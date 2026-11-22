# GameVerse — Production Deployment & Cloudflare R2 / Global CDN Runbook

**Document Version:** 1.0.0-PROD  
**Target Environment:** Production  
**Cloud Storage Provider:** Cloudflare R2 (`cloudflare_r2`)  
**CDN & Edge Network:** Cloudflare Global Anycast Edge Network  
**Application Tier:** Next.js 14 App Router (Node.js runtime)  
**Security Classification:** Restricted / Operations  

---

## 1. Architectural Overview & Zero-Egress Philosophy

GameVerse employs a decoupled, zero-egress cloud architecture designed for high-concurrency HTML5/WebGL game delivery:

```
[ Developer Portal ] ──(Presigned S3 PUT)──> [ Cloudflare R2 Storage ]
                                                        │
                                                        ▼
[ End-User Browser ] <──(Global Edge Anycast)── [ Cloudflare CDN ]
         │                                       (cdn.gameverse.com)
         │ (Zero static traffic to App Server)
         ▼
[ GameVerse App Server ] ──(Control Plane APIs only: /api/analytics, /api/auth, /api/games)
```

1. **Storage Tier (Cloudflare R2)**:
   - S3-compatible object storage with **$0 egress fees**.
   - Storage format: `games/<gameId>/versions/<versionNumber>/<entryFile | assets/...>`.
   - Immutable versioned storage: old assets are never overwritten or deleted during game updates.

2. **Delivery Tier (Cloudflare CDN - `https://cdn.gameverse.com`)**:
   - RFC 7234 compliant edge caching.
   - Long-term cache headers (`public, max-age=31536000, immutable`) for versioned JS, CSS, WASM, images, audio, and binary bundles.
   - Short revalidation (`public, max-age=0, s-maxage=60, must-revalidate`) for `index.html` and `manifest.json`.
   - Compression: Brotli (`br`) and Gzip enabled automatically at the edge.

3. **Application Tier (GameVerse Next.js App Server)**:
   - Completely offloaded from serving static gameplay assets.
   - Serves only metadata, server-rendered discovery pages, authenticated APIs, and telemetry ingestion.

---

## 2. Environment Variables & Secret Configuration

To deploy GameVerse to production, configure the following environment variables:

```bash
# ================= Cloudflare R2 Storage Configuration =================
GAMEVERSE_STORAGE_PROVIDER="cloudflare_r2"
R2_ACCOUNT_ID="<your-cloudflare-account-id>"
R2_ACCESS_KEY_ID="<your-r2-api-token-access-key-id>"
R2_SECRET_ACCESS_KEY="<your-r2-api-token-secret-access-key>"
R2_BUCKET_NAME="gameverse-production-games"
R2_PUBLIC_DOMAIN="https://cdn.gameverse.com"

# ================= Domain & Edge Isolation =================
NEXT_PUBLIC_CDN_ORIGIN="https://cdn.gameverse.com"
GAME_SERVING_DOMAIN="https://play.gameverse.com"
NEXT_PUBLIC_SANDBOX_ORIGIN="https://play.gameverse.com"
NEXT_PUBLIC_APP_URL="https://gameverse.com"

# ================= Storage Limits & Presigned Uploads =================
MAX_GAME_ZIP_BYTES=104857600  # 100 MB max upload size
STORAGE_PRESIGNED_TTL_SECONDS=900  # 15 minutes session TTL
```

*Note: In local and CI development environments without live Cloudflare credentials, GameVerse automatically activates its in-process RFC S3/R2 mock emulator (`src/lib/storage/emulator.ts`), ensuring 100% test reliability with zero external dependencies.*

---

## 3. Pre-Flight Deployment Checklist

Before routing live traffic to the production cluster:

1. **Verify R2 Bucket Binding**:
   - Run operational verification: `POST /api/admin/launch-sign-off`
   - Ensure `verifyCloudflareR2Binding()` probe passes with `sha256Match: true` and latency `< 100ms`.

2. **Audit Trail Cryptographic Integrity**:
   - Run `verifyAuditTrailIntegrity()`.
   - Confirm genesis hash and sequential tamper hashes are unbroken (`valid: true`).

3. **7 Pre-Flight Gate Verification**:
   - Verify `evaluateLaunchReadiness()` returns `status: "READY_FOR_PRODUCTION"` across all 7 gates:
     1. `CORE_ARCHITECTURE` (Zero breadcrumb leaks, 39 canonical pages, clean routes)
     2. `SECURITY_ISOLATION` (Multi-origin iframe sandbox, CSP, anti-top navigation)
     3. `PRIVACY_COMPLIANCE` (GDPR/DPDP IP anonymization, rights disclosures)
     4. `FINANCIAL_LEDGER` (Immutable ledger, double-entry consistency, UPI payouts)
     5. `CATALOG_PIPELINE` (ZIP magic bytes, ZIP bomb defense, virus scanner)
     6. `EDGE_PERFORMANCE` (RFC 7234 cache hit ratio > 95%, compression)
     7. `CREATOR_BETA` (Developer onboarding, real profile sync, revenue sharing)

4. **Execute Production Launch Sign-Off**:
   - Navigate to `/admin/launch-checklist` in the Admin Portal.
   - Click **Authorize Production Launch**.
   - Generates immutable `ProductionLaunchCertificate` signed by the administrator with a SHA-256 seal.

---

## 4. Live DNS & CDN Routing Architecture

Configure the following DNS records in Cloudflare DNS management:

| Type | Name | Content / Target | Proxy Status | Purpose |
|------|------|------------------|--------------|---------|
| `CNAME` | `gameverse.com` | `your-app-cluster.cname` | Proxied (`Orange Cloud`) | Platform Gamer & Admin Portal |
| `CNAME` | `cdn.gameverse.com` | `<bucket-name>.<account-id>.r2.cloudflarestorage.com` | Proxied (`Orange Cloud`) | Static Game Asset CDN |
| `CNAME` | `play.gameverse.com` | `your-app-cluster.cname` | Proxied (`Orange Cloud`) | Isolated Game Sandbox Runner |

### Cloudflare Edge Rules for `cdn.gameverse.com/*`:
1. **Edge Cache TTL**: 1 year for `/games/*/versions/*` assets excluding `index.html`.
2. **Browser Cache TTL**: Respect origin `Cache-Control` header.
3. **Always Online**: Enabled.
4. **HTTP/2 & HTTP/3 (QUIC)**: Enabled.
5. **Brotli Compression**: Enabled.

---

## 5. Rollback & Emergency Quarantine Protocol

If a newly deployed game version contains an unforeseen bug or vulnerability:

1. **1-Click Instant Rollback**:
   - Open Developer Portal (`/developer/games`) or Admin Review Panel (`/admin/review/[id]`).
   - Click **Restore Previous Version** (or **Rollback to Build**).
   - Enter mandatory audit reason.
   - The platform atomically updates `game.currentVersionId` pointer in `< 1ms`.
   - Existing players finish their current session uninterrupted; new players immediately receive the previous safe build.
   - CDN cache purge is **not required** because build paths are immutable and version-scoped.

2. **Emergency Quarantine**:
   - Admin opens `/admin/review/[id]`.
   - Under Emergency Actions, click **Quarantine Build**.
   - Flags the build as `QUARANTINED`, unpublishes the game if it is the current version, and rolls back to the highest clean build automatically.
