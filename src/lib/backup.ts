import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { gvDb } from './database';
import { globalIndexEngine } from './performance';
import { recordAuditLog, verifyAuditTrailIntegrity } from './audit';
import { DatabaseState } from './database';

export interface PlatformSnapshotMetadata {
  snapshotId: string;
  label?: string;
  filePath: string;
  sha256: string;
  recordCount: number;
  collections: Record<string, number>;
  timestamp: string;
  sizeBytes: number;
}

export interface DisasterRecoveryDrillResult {
  success: boolean;
  rtoMs: number;
  rpoSeconds: number;
  restoredRecords: number;
  auditChainValid: boolean;
  sha256Verified: boolean;
  snapshotId: string;
  details: {
    preDrillRecordCount: number;
    restoredRecordCount: number;
    disasterSimulationType: string;
    restoredAt: string;
    auditIntegrityStatus: string;
  };
}

const BACKUP_DIR = path.resolve(process.cwd(), '.data', 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Calculates the total number of records across all database collections.
 */
export function countDatabaseRecords(state: DatabaseState): { total: number; collections: Record<string, number> } {
  const collections: Record<string, number> = {};
  let total = 0;

  for (const [key, value] of Object.entries(state)) {
    if (Array.isArray(value)) {
      collections[key] = value.length;
      total += value.length;
    }
  }

  return { total, collections };
}

/**
 * Creates a verified, timestamped platform snapshot with a SHA-256 integrity seal.
 */
export async function createPlatformSnapshot(label?: string): Promise<PlatformSnapshotMetadata> {
  ensureBackupDir();

  const timestamp = new Date().toISOString();
  const snapshotId = `SNAP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const filePath = path.join(BACKUP_DIR, `snapshot_${snapshotId}.json`);
  const metaPath = path.join(BACKUP_DIR, `snapshot_${snapshotId}.meta.json`);

  const { total: recordCount, collections } = countDatabaseRecords(gvDb.state);

  // Clone current database state
  const snapshotPayload = {
    snapshotId,
    label: label || 'manual_snapshot',
    timestamp,
    recordCount,
    collections,
    state: gvDb.state,
  };

  const serialized = JSON.stringify(snapshotPayload, null, 2);
  const sha256 = crypto.createHash('sha256').update(serialized, 'utf-8').digest('hex');

  // Write snapshot data file
  fs.writeFileSync(filePath, serialized, 'utf-8');

  const metadata: PlatformSnapshotMetadata = {
    snapshotId,
    label: label || 'manual_snapshot',
    filePath,
    sha256,
    recordCount,
    collections,
    timestamp,
    sizeBytes: Buffer.byteLength(serialized, 'utf-8'),
  };

  // Write metadata index file
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // Record tamper-evident audit entry
  recordAuditLog({
    actorId: 'system-backup',
    actorName: 'Platform Backup Service',
    actorRole: 'SYSTEM',
    action: 'PLATFORM_SNAPSHOT_CREATED',
    targetType: 'PLATFORM_BACKUP',
    targetId: snapshotId,
    details: {
      snapshotId,
      label,
      recordCount,
      sha256,
      sizeBytes: metadata.sizeBytes,
    },
  });

  return metadata;
}

/**
 * Lists all existing platform backup snapshots sorted from newest to oldest.
 */
export async function listPlatformSnapshots(): Promise<PlatformSnapshotMetadata[]> {
  ensureBackupDir();

  const files = fs.readdirSync(BACKUP_DIR);
  const metaFiles = files.filter((f) => f.endsWith('.meta.json'));
  const snapshots: PlatformSnapshotMetadata[] = [];

  for (const mf of metaFiles) {
    try {
      const content = fs.readFileSync(path.join(BACKUP_DIR, mf), 'utf-8');
      const meta = JSON.parse(content) as PlatformSnapshotMetadata;
      snapshots.push(meta);
    } catch {
      // Ignore corrupt metadata files
    }
  }

  return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Verifies the cryptographic SHA-256 seal of a specific snapshot.
 */
export async function verifySnapshotIntegrity(snapshotId: string): Promise<{
  valid: boolean;
  expectedSha256: string;
  computedSha256: string;
  filePath: string;
}> {
  ensureBackupDir();

  const filePath = path.join(BACKUP_DIR, `snapshot_${snapshotId}.json`);
  const metaPath = path.join(BACKUP_DIR, `snapshot_${snapshotId}.meta.json`);

  if (!fs.existsSync(filePath) || !fs.existsSync(metaPath)) {
    throw new Error(`Snapshot ${snapshotId} not found.`);
  }

  const meta: PlatformSnapshotMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const data = fs.readFileSync(filePath, 'utf-8');
  const computedSha256 = crypto.createHash('sha256').update(data, 'utf-8').digest('hex');

  return {
    valid: computedSha256 === meta.sha256,
    expectedSha256: meta.sha256,
    computedSha256,
    filePath,
  };
}

/**
 * Restores platform database state from an archived snapshot.
 */
export async function restorePlatformSnapshot(snapshotId: string): Promise<{
  success: boolean;
  restoredRecords: number;
  sha256Verified: boolean;
  auditChainValid: boolean;
}> {
  const integrity = await verifySnapshotIntegrity(snapshotId);
  if (!integrity.valid) {
    throw new Error(
      `Snapshot integrity check failed. Expected ${integrity.expectedSha256}, computed ${integrity.computedSha256}`
    );
  }

  const raw = fs.readFileSync(integrity.filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  // Restore state into database singleton
  gvDb.state = parsed.state;
  gvDb.persistState(true);

  // Rebuild in-memory search & query index engine
  globalIndexEngine.rebuildIndexes(gvDb.state);

  // Verify cryptographic audit trail
  const auditResult = verifyAuditTrailIntegrity();

  const { total: restoredRecords } = countDatabaseRecords(gvDb.state);

  return {
    success: true,
    restoredRecords,
    sha256Verified: true,
    auditChainValid: auditResult.valid,
  };
}

/**
 * Executes a full automated disaster recovery restoration drill:
 * 1. Takes pre-drill baseline snapshot with SHA-256 seal.
 * 2. Simulates catastrophe (clearing database collections and persisting empty state).
 * 3. Restores from snapshot archive.
 * 4. Validates SHA-256 seal, rebuilds index engine, and verifies audit chain integrity.
 * 5. Measures RTO (ms) and RPO (0 lost records).
 */
export async function executeDisasterRecoveryDrill(): Promise<DisasterRecoveryDrillResult> {
  const preDrillCount = countDatabaseRecords(gvDb.state).total;

  // 1. Create baseline snapshot
  const baseline = await createPlatformSnapshot('automated_dr_drill_baseline');

  // 2. Simulate catastrophic loss / corruption
  const emptyState: any = {};
  for (const key of Object.keys(gvDb.state)) {
    emptyState[key] = [];
  }
  gvDb.state = emptyState;
  gvDb.persistState(true);
  globalIndexEngine.rebuildIndexes(gvDb.state);

  // Confirm simulated disaster wiped active state
  const wipedCount = countDatabaseRecords(gvDb.state).total;
  if (wipedCount > 0) {
    throw new Error('Disaster simulation failed to clear platform state.');
  }

  // 3. Measure Recovery Time Objective (RTO)
  const restoreStartTime = Date.now();
  const restoreResult = await restorePlatformSnapshot(baseline.snapshotId);
  const rtoMs = Date.now() - restoreStartTime;

  // 4. Verify Recovery Point Objective (RPO) = 0 seconds (zero records lost)
  const postRestoreCount = countDatabaseRecords(gvDb.state).total;
  const recordsLost = Math.max(0, preDrillCount - postRestoreCount);
  const rpoSeconds = recordsLost === 0 ? 0 : 3600;

  // 5. Record disaster recovery drill audit log
  recordAuditLog({
    actorId: 'system-dr-engine',
    actorName: 'Automated DR Engine',
    actorRole: 'SYSTEM',
    action: 'DISASTER_RECOVERY_DRILL_COMPLETED',
    targetType: 'PLATFORM_BACKUP',
    targetId: baseline.snapshotId,
    details: {
      snapshotId: baseline.snapshotId,
      rtoMs,
      rpoSeconds,
      recordsRestored: postRestoreCount,
      sha256Verified: restoreResult.sha256Verified,
      auditChainValid: restoreResult.auditChainValid,
    },
  });

  return {
    success: restoreResult.success && recordsLost === 0 && restoreResult.auditChainValid,
    rtoMs,
    rpoSeconds,
    restoredRecords: postRestoreCount,
    auditChainValid: restoreResult.auditChainValid,
    sha256Verified: restoreResult.sha256Verified,
    snapshotId: baseline.snapshotId,
    details: {
      preDrillRecordCount: preDrillCount,
      restoredRecordCount: postRestoreCount,
      disasterSimulationType: 'CATASTROPHIC_DATABASE_CORRUPTION',
      restoredAt: new Date().toISOString(),
      auditIntegrityStatus: restoreResult.auditChainValid ? 'TAMPER_EVIDENT_CHAIN_VERIFIED' : 'CHAIN_CORRUPTED',
    },
  };
}
