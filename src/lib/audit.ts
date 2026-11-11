import crypto from 'crypto';
import { gvDb } from './database';
import { AuditLog, UserRole } from '../types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes deterministic SHA-256 tamper hash for an audit record linked to the previous record hash.
 */
export function computeAuditTamperHash(
  previousHash: string,
  entry: {
    id: string;
    createdAt: string;
    action: string;
    actorId: string;
    targetId: string;
    details: any;
  }
): string {
  const payload = `${previousHash}|${entry.id}|${entry.createdAt}|${entry.action}|${entry.actorId}|${entry.targetId}|${JSON.stringify(
    entry.details
  )}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Records a cryptographically tamper-evident audit log in the GameVerse database.
 */
export function recordAuditLog(params: {
  actorId: string;
  actorName: string;
  actorRole?: UserRole | 'SYSTEM';
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): AuditLog {
  const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = new Date().toISOString();
  const details = params.details || {};
  const ipAddress = params.ipAddress || '127.0.0.1';

  // The latest log in gvDb.state.auditLogs is at index 0 (unshifted)
  const allLogs = gvDb.state.auditLogs;
  const latestLog = allLogs.length > 0 ? allLogs[0] : null;
  const previousHash = latestLog?.tamperHash || GENESIS_HASH;

  const tamperHash = computeAuditTamperHash(previousHash, {
    id,
    createdAt,
    action: params.action,
    actorId: params.actorId,
    targetId: params.targetId,
    details,
  });

  const log: AuditLog = {
    id,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole || 'SYSTEM',
    actorEmail: params.actorEmail,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    details,
    ipAddress,
    previousHash,
    tamperHash,
    createdAt,
  };

  gvDb.state.auditLogs.unshift(log);
  gvDb.persistState();
  return log;
}

/**
 * Verifies the cryptographic integrity of the audit log chain.
 * Returns valid: true if all hashes are unmodified and correctly linked.
 */
export function verifyAuditTrailIntegrity(logs?: AuditLog[]): {
  valid: boolean;
  totalChecked: number;
  corruptedIndex?: number;
  corruptedLogId?: string;
  reason?: string;
} {
  const targetLogs = logs || gvDb.state.auditLogs;
  if (targetLogs.length === 0) {
    return { valid: true, totalChecked: 0 };
  }

  // Logs are stored newest-first (unshifted), so reverse for chronological order
  const chronological = [...targetLogs].reverse();

  for (let i = 0; i < chronological.length; i++) {
    const current = chronological[i];
    const expectedPrevHash =
      i === 0
        ? current.previousHash || GENESIS_HASH
        : chronological[i - 1].tamperHash || GENESIS_HASH;

    if (current.previousHash && current.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        totalChecked: i,
        corruptedIndex: i,
        corruptedLogId: current.id,
        reason: `Chain broken at log ${current.id}: previousHash mismatch. Expected ${expectedPrevHash}, found ${current.previousHash}`,
      };
    }

    if (current.tamperHash) {
      const recalculated = computeAuditTamperHash(current.previousHash || GENESIS_HASH, {
        id: current.id,
        createdAt: current.createdAt,
        action: current.action,
        actorId: current.actorId,
        targetId: current.targetId,
        details: current.details,
      });

      if (recalculated !== current.tamperHash) {
        return {
          valid: false,
          totalChecked: i,
          corruptedIndex: i,
          corruptedLogId: current.id,
          reason: `Data tampering detected at log ${current.id}: tamperHash mismatch. Expected ${recalculated}, found ${current.tamperHash}`,
        };
      }
    }
  }

  return { valid: true, totalChecked: chronological.length };
}
