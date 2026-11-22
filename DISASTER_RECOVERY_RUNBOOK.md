# GameVerse — Disaster Recovery & High-Availability Runbook

**Document Version:** 1.0.0-PROD  
**Target Recovery Point Objective (RPO):** $\le 0\text{ seconds}$ (Zero Data Loss)  
**Target Recovery Time Objective (RTO):** $\le 300\text{ ms}$ (Sub-Second In-Memory & File Restoration)  
**Integrity Seal:** SHA-256 Cryptographic Digest & Tamper-Evident Hash Chain  

---

## 1. Disaster Recovery Philosophy

GameVerse uses a dual-layer disaster recovery strategy:
1. **Cloud Object Storage (Cloudflare R2)**:
   - High-durability distributed object storage ($99.999999999\%$ annual durability).
   - Versioned directory paths prevent accidental overwrite or data destruction.
2. **Platform Database & State**:
   - In-memory index engine with synchronous JSON persistence (`.data/gameverse_db.json`).
   - Automated timestamped snapshots stored with SHA-256 integrity metadata under `.data/backups/`.
   - Cryptographically linked audit logs (`src/lib/audit.ts`) enabling post-restore tamper detection.

---

## 2. Automated Snapshot Creation Pipeline

Snapshots can be created programmatically, via scheduled cron, or on demand via Admin API:

### Programmatic Snapshot Creation (`src/lib/backup.ts`):
```typescript
import { createPlatformSnapshot } from '@/lib/backup';

const snapshot = await createPlatformSnapshot('pre_deployment_v1.0.0');
console.log(`Snapshot created: ${snapshot.snapshotId}`);
console.log(`SHA-256 seal: ${snapshot.sha256}`);
console.log(`Total records: ${snapshot.recordCount}`);
```

### Snapshot Storage Format:
- Snapshot Payload: `.data/backups/snapshot_SNAP-<timestamp>-<hash>.json`
- Cryptographic Metadata: `.data/backups/snapshot_SNAP-<timestamp>-<hash>.meta.json`
```json
{
  "snapshotId": "SNAP-1732258800000-A1B2C3D4",
  "label": "daily_production_backup",
  "timestamp": "2026-11-22T06:00:00.000Z",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "recordCount": 420,
  "collections": {
    "users": 15,
    "games": 35,
    "gameVersions": 80,
    "auditLogs": 150,
    "ledger": 60,
    "analytics": 80
  }
}
```

---

## 3. Disaster Recovery Drill & Restoration Procedure

To test or execute platform disaster recovery:

### Method A: Admin UI (1-Click DR Drill)
1. Log in as an Administrator (`admin@gameverse.com`).
2. Navigate to `/admin/launch-checklist`.
3. Locate the **Disaster Recovery & High Availability Status** card.
4. Click **Execute DR Restore Drill**.
5. The system performs:
   - Baseline state snapshot creation.
   - Simulation of database corruption / complete file deletion.
   - Restoration from the verified snapshot.
   - SHA-256 checksum verification.
   - Secondary index rebuild (`globalIndexEngine.rebuildIndexes`).
   - Audit trail hash verification (`verifyAuditTrailIntegrity`).
   - Reports measured RTO (ms) and RPO (seconds) directly in the UI.

### Method B: Admin API
```bash
curl -X POST https://gameverse.com/api/admin/disaster-recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "drill"}' \
  --cookie "gv_session=..."
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "rtoMs": 42,
    "rpoSeconds": 0,
    "restoredRecords": 420,
    "auditChainValid": true,
    "sha256Verified": true,
    "snapshotId": "SNAP-1732258812345-F5E4D3C2"
  }
}
```

---

## 4. Cold Catastrophe Recovery (Manual Runbook)

If the active database server host is completely lost or destroyed:

1. **Provision New Compute Node**:
   - Clone repository: `git clone https://github.com/SidGudadhe/gameverse.git`
   - Install dependencies: `npm install`
   - Set environment variables (`.env.production`).

2. **Retrieve Latest Verified Backup Snapshot**:
   - Download the latest snapshot JSON and `.meta.json` from secondary backup storage (e.g., S3/GCS secondary replica).
   - Place in `.data/backups/`.

3. **Execute Snapshot Restore Script**:
   ```typescript
   import { restorePlatformSnapshot, listPlatformSnapshots } from '@/lib/backup';
   
   const snapshots = listPlatformSnapshots();
   const latest = snapshots[0];
   const result = await restorePlatformSnapshot(latest.snapshotId);
   console.log('Restoration result:', result);
   ```

4. **Verify Cryptographic Chain & Secondary Indexes**:
   ```typescript
   import { verifyAuditTrailIntegrity } from '@/lib/audit';
   import { globalIndexEngine } from '@/lib/performance';
   import { gvDb } from '@/lib/database';
   
   const audit = verifyAuditTrailIntegrity(gvDb.state.auditLogs);
   console.log('Audit chain valid:', audit.valid);
   globalIndexEngine.rebuildIndexes(gvDb.state);
   console.log('Secondary indexes rebuilt successfully.');
   ```

5. **Start Production Service**:
   ```bash
   npm run build
   npm run start
   ```
6. **Execute Smoke Tests**:
   - Check `/api/health`
   - Check `/api/games`
   - Check `/admin/launch-checklist`
