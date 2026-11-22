import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { startR2Emulator, stopR2Emulator } from '../src/lib/storage/emulator';
import { gameverseStorage, verifyCloudflareR2Binding } from '../src/lib/storage';
import {
  createPlatformSnapshot,
  listPlatformSnapshots,
  verifySnapshotIntegrity,
  restorePlatformSnapshot,
  executeDisasterRecoveryDrill,
  countDatabaseRecords,
} from '../src/lib/backup';
import {
  evaluateLaunchReadiness,
  evaluateProductionDeploymentChecklist,
  executeProductionSignOff,
  getLastLaunchCertificate,
} from '../src/lib/launch';
import { gvDb } from '../src/lib/database';
import { globalIndexEngine } from '../src/lib/performance';
import { generateToken } from '../src/lib/auth';
import { verifyAuditTrailIntegrity } from '../src/lib/audit';
import { GET as getDisasterRecovery, POST as postDisasterRecovery } from '../src/app/api/admin/disaster-recovery/route';
import { NextRequest } from 'next/server';

describe('Phase 8: Production Readiness Sign-Off & Live Deployment Verification', () => {
  const mockAdmin = {
    id: 'usr-admin-1',
    name: 'System Admin',
    email: 'admin@gameverse.com',
  };

  beforeEach(() => {
    gvDb.resetToSeed();
    globalIndexEngine.rebuildIndexes(gvDb.state);
  });

  afterAll(async () => {
    await stopR2Emulator();
    gvDb.resetToSeed();
    globalIndexEngine.rebuildIndexes(gvDb.state);
  });

  // ================= 1. IN-PROCESS S3/R2 MOCK EMULATOR =================
  describe('1. Cloudflare R2 / S3 Mock Emulator', () => {
    it('1.1 should start in-process S3 emulator on dynamic port and handle CRUD via AWS SDK v3', async () => {
      const emulator = await startR2Emulator(0);
      expect(emulator.port).toBeGreaterThan(0);
      expect(emulator.endpoint).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

      const s3Client = new S3Client({
        region: 'auto',
        endpoint: emulator.endpoint,
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
        forcePathStyle: true,
      });

      const bucket = 'gameverse-games';
      const key = 'builds/test-game/v1/game.js';
      const content = Buffer.from('console.log("GameVerse Phaser Runtime v1.0.0");');
      const expectedSha256 = crypto.createHash('sha256').update(content).digest('hex');

      // 0. HeadBucket
      const headBucketRes = await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        })
      );
      expect(headBucketRes).toBeDefined();

      // 1. PutObject
      const putRes = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: content,
          ContentType: 'application/javascript',
          Metadata: { 'test-meta': 'phaser-runtime' },
        })
      );
      expect(putRes.ETag).toBeDefined();

      // 2. GetObject
      const getRes = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      expect(getRes.ContentType).toBe('application/javascript');
      const chunks: Uint8Array[] = [];
      for await (const chunk of getRes.Body as any) {
        chunks.push(chunk);
      }
      const retrieved = Buffer.concat(chunks);
      expect(retrieved.toString()).toBe(content.toString());
      expect(crypto.createHash('sha256').update(retrieved).digest('hex')).toBe(expectedSha256);

      // 3. HeadObject
      const headRes = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      expect(headRes.ContentLength).toBe(content.length);
      expect(headRes.ContentType).toBe('application/javascript');

      // 4. ListObjectsV2
      const listRes = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: 'builds/test-game/',
        })
      );
      expect(listRes.KeyCount).toBe(1);
      expect(listRes.Contents?.[0].Key).toBe(key);

      // 5. DeleteObject
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Verify deletion via GetObject and HeadObject
      await expect(
        s3Client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        )
      ).rejects.toThrow();

      await expect(
        s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        )
      ).rejects.toThrow();
    });
  });

  // ================= 2. CLOUDFLARE R2 BUCKET BINDING VERIFICATION =================
  describe('2. Cloudflare R2 Bucket Binding Verification', () => {
    it('2.1 should execute R2 binding probe and verify SHA-256 seal with automatic emulator fallback', async () => {
      const result = await verifyCloudflareR2Binding({ allowEmulator: true });

      expect(result.bound).toBe(true);
      expect(result.sha256Match).toBe(true);
      expect(result.bucket).toBe('gameverse-games');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.latencyMs).toBeLessThan(5000);
      expect(result.emulatorUsed).toBe(true);
      expect(result.endpoint).toMatch(/127\.0\.0\.1/);
    });

    it('2.2 should report bound: false when live cloud credentials are absent and emulator is disabled', async () => {
      const result = await gameverseStorage.verifyCloudflareR2Binding({ allowEmulator: false });

      expect(result.bound).toBe(false);
      expect(result.emulatorUsed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ================= 3. PLATFORM SNAPSHOT & INTEGRITY VERIFICATION =================
  describe('3. Platform Backup Snapshot Pipeline', () => {
    it('3.1 should create verified platform snapshot archive with cryptographic SHA-256 seal', async () => {
      const snapshot = await createPlatformSnapshot('phase8_pre_flight_seal');

      expect(snapshot.snapshotId).toMatch(/^SNAP-\d+-[0-9A-F]{8}$/);
      expect(snapshot.sha256).toHaveLength(64);
      expect(snapshot.recordCount).toBeGreaterThan(0);
      expect(snapshot.sizeBytes).toBeGreaterThan(500);
      expect(fs.existsSync(snapshot.filePath)).toBe(true);

      // Verify SHA-256 checksum on disk matches metadata seal
      const fileData = fs.readFileSync(snapshot.filePath, 'utf-8');
      const calculatedSha = crypto.createHash('sha256').update(fileData, 'utf-8').digest('hex');
      expect(calculatedSha).toBe(snapshot.sha256);

      // Verify audit log recorded
      const latestAudit = gvDb.state.auditLogs[0];
      expect(latestAudit.action).toBe('PLATFORM_SNAPSHOT_CREATED');
      expect(latestAudit.targetId).toBe(snapshot.snapshotId);
    });

    it('3.2 should list snapshots and verify snapshot integrity', async () => {
      const snapshots = await listPlatformSnapshots();
      expect(snapshots.length).toBeGreaterThan(0);

      const latest = snapshots[0];
      const integrity = await verifySnapshotIntegrity(latest.snapshotId);
      expect(integrity.valid).toBe(true);
      expect(integrity.computedSha256).toBe(latest.sha256);
    });
  });

  // ================= 4. DISASTER RECOVERY RESTORATION DRILL =================
  describe('4. Disaster Recovery Catastrophe Simulation & Restore Drill', () => {
    it('4.1 should simulate catastrophic database wipe, restore from snapshot, and verify RTO/RPO', async () => {
      const initialCount = countDatabaseRecords(gvDb.state).total;
      expect(initialCount).toBeGreaterThan(10);

      // Execute full disaster recovery drill
      const drillResult = await executeDisasterRecoveryDrill();

      expect(drillResult.success).toBe(true);
      expect(drillResult.rpoSeconds).toBe(0); // Zero data loss
      expect(drillResult.rtoMs).toBeLessThan(5000); // Sub-5 second recovery time
      expect(drillResult.restoredRecords).toBe(initialCount);
      expect(drillResult.sha256Verified).toBe(true);
      expect(drillResult.auditChainValid).toBe(true);
      expect(drillResult.details.disasterSimulationType).toBe('CATASTROPHIC_DATABASE_CORRUPTION');

      // Verify database state is restored and queryable
      expect(gvDb.state.games.length).toBeGreaterThan(0);
      expect(gvDb.state.users.length).toBeGreaterThan(0);
      const testGame = globalIndexEngine.getGameBySlug('neon-runner');
      expect(testGame).toBeDefined();
      expect(testGame?.title).toBe('Neon Cyber Runner 2088');

      // Verify tamper-evident audit trail chain remains valid
      const auditStatus = verifyAuditTrailIntegrity();
      expect(auditStatus.valid).toBe(true);
    });
  });

  // ================= 5. LIVE PRODUCTION DEPLOYMENT CHECKLIST =================
  describe('5. Production Readiness & Deployment Checklist', () => {
    it('5.1 should evaluate full Phase 8 production deployment checklist and achieve 100% score', async () => {
      const report = await evaluateProductionDeploymentChecklist();

      expect(report.allCleared).toBe(true);
      expect(report.score).toBe(100);
      expect(report.version).toBe('1.0.0');
      expect(report.items.length).toBe(5);

      const itemIds = report.items.map((i) => i.id);
      expect(itemIds).toContain('CHECKLIST_R2_STORAGE');
      expect(itemIds).toContain('CHECKLIST_DISASTER_RECOVERY');
      expect(itemIds).toContain('CHECKLIST_SECURITY_SECRETS');
      expect(itemIds).toContain('CHECKLIST_CDN_EDGE');
      expect(itemIds).toContain('CHECKLIST_AUDIT_INTEGRITY');

      for (const item of report.items) {
        expect(item.passed).toBe(true);
        expect(item.score).toBe(100);
      }

      expect(report.r2Binding.bound).toBe(true);
      expect(report.r2Binding.sha256Match).toBe(true);
      expect(report.disasterRecovery.auditChainValid).toBe(true);
    });

    it('5.2 should strictly preserve existing 7 operational pre-flight gates for launch readiness', () => {
      const report = evaluateLaunchReadiness();

      expect(report.passed).toBe(true);
      expect(report.readinessScore).toBe(100);
      expect(report.status).toBe('READY_FOR_PRODUCTION');
      expect(report.gates.length).toBe(7);

      const gateIds = report.gates.map((g) => g.id);
      expect(gateIds).toEqual([
        'CORE_ARCHITECTURE',
        'SECURITY_ISOLATION',
        'PRIVACY_COMPLIANCE',
        'FINANCIAL_LEDGER',
        'CATALOG_PIPELINE',
        'EDGE_PERFORMANCE',
        'CREATOR_BETA',
      ]);
    });

    it('5.3 should execute authorized production launch sign-off with tamper-evident seal', () => {
      const signOff = executeProductionSignOff(mockAdmin);

      expect(signOff.success).toBe(true);
      expect(signOff.certificate).toBeDefined();

      const cert = signOff.certificate!;
      expect(cert.certificateId).toMatch(/^CERT-GV-PROD-/);
      expect(cert.status).toBe('AUTHORIZED');
      expect(cert.authorizedBy.email).toBe(mockAdmin.email);
      expect(cert.gatesPassed).toBe(7);
      expect(cert.totalGates).toBe(7);
      expect(cert.readinessScore).toBe(100);
      expect(cert.sha256Seal).toHaveLength(64);

      const lastCert = getLastLaunchCertificate();
      expect(lastCert?.certificateId).toBe(cert.certificateId);
    });
  });

  // ================= 6. DISASTER RECOVERY ADMIN API ROUTE =================
  describe('6. Disaster Recovery Admin API Endpoints', () => {
    it('6.1 should require ADMIN role for GET and POST requests', async () => {
      // Unauthenticated request
      const unauthReq = new NextRequest('http://localhost:3000/api/admin/disaster-recovery', {
        headers: { host: 'localhost:3000' },
      });

      const getRes = await getDisasterRecovery(unauthReq);
      expect(getRes.status).toBe(401);

      const postRes = await postDisasterRecovery(unauthReq);
      expect(postRes.status).toBe(401);
    });

    it('6.2 should reject non-ADMIN role with 403 Forbidden', async () => {
      const playerToken = generateToken({
        userId: 'usr-player-1',
        email: 'player@gameverse.com',
        role: 'PLAYER',
      });

      const playerReq = new NextRequest('http://localhost:3000/api/admin/disaster-recovery', {
        headers: {
          host: 'localhost:3000',
          authorization: `Bearer ${playerToken}`,
        },
      });

      const getRes = await getDisasterRecovery(playerReq);
      expect(getRes.status).toBe(403);

      const postRes = await postDisasterRecovery(playerReq);
      expect(postRes.status).toBe(403);
    });

    it('6.3 should return snapshot list for authenticated ADMIN GET request', async () => {
      const adminToken = generateToken({
        userId: 'usr-admin-1',
        email: 'admin@gameverse.com',
        role: 'ADMIN',
      });

      const adminReq = new NextRequest('http://localhost:3000/api/admin/disaster-recovery', {
        headers: {
          host: 'localhost:3000',
          authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await getDisasterRecovery(adminReq);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.snapshots)).toBe(true);
      expect(typeof data.totalSnapshots).toBe('number');
    });

    it('6.4 should create snapshot and execute drill via ADMIN POST request', async () => {
      const adminToken = generateToken({
        userId: 'usr-admin-1',
        email: 'admin@gameverse.com',
        role: 'ADMIN',
      });

      // 1. Create Snapshot action
      const snapReq = new NextRequest('http://localhost:3000/api/admin/disaster-recovery', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'snapshot', label: 'api_test_snapshot' }),
      });

      const snapRes = await postDisasterRecovery(snapReq);
      expect(snapRes.status).toBe(200);
      const snapData = await snapRes.json();
      expect(snapData.success).toBe(true);
      expect(snapData.snapshot.snapshotId).toBeDefined();

      // 2. Restore without snapshotId validation
      const badRestoreReq = new NextRequest('http://localhost:3000/api/admin/disaster-recovery', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'restore' }),
      });
      const badRes = await postDisasterRecovery(badRestoreReq);
      expect(badRes.status).toBe(400);

      // 3. Drill action
      const drillReq = new NextRequest('http://localhost:3000/api/admin/disaster-recovery', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'drill' }),
      });

      const drillRes = await postDisasterRecovery(drillReq);
      expect(drillRes.status).toBe(200);
      const drillData = await drillRes.json();
      expect(drillData.success).toBe(true);
      expect(drillData.result.sha256Verified).toBe(true);
      expect(drillData.result.rpoSeconds).toBe(0);
    });
  });
});
