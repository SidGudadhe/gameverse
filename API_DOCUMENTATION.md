# GameVerse: RESTful API Specifications & Endpoints
**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Authentication:** Bearer JWT / HttpOnly Session Cookie  

---

## 1. Authentication & Identity
- `POST /api/v1/auth/signup` — Register new user (`email`, `password`, `role: PLAYER | DEVELOPER`).
- `POST /api/v1/auth/login` — Authenticate credentials, issues secure HTTP-only cookie.
- `POST /api/v1/auth/logout` — Invalidate session and clear cookies.
- `POST /api/v1/auth/verify-email` — Verify email token.
- `POST /api/v1/auth/forgot-password` — Issue password reset token.
- `POST /api/v1/auth/reset-password` — Reset password using token.
- `GET  /api/v1/auth/me` — Retrieve active authenticated session and role privileges.
- `POST /api/v1/auth/2fa/setup` — Generate TOTP QR code (Admin role).
- `POST /api/v1/auth/2fa/verify` — Confirm TOTP activation.

---

## 2. Developer Portal Endpoints
- `POST /api/v1/developer/onboard` — Submit studio details and accept creator agreement.
- `GET  /api/v1/developer/games` — List games created by authenticated developer.
- `POST /api/v1/developer/games` — Create a new game draft metadata.
- `GET  /api/v1/developer/games/:id` — Get detailed game metadata and version history.
- `PATCH /api/v1/developer/games/:id` — Update game metadata.
- `POST /api/v1/developer/games/:id/upload` — Upload ZIP build, triggers background scan.
- `POST /api/v1/developer/games/:id/submit-qa` — Submit version to QA queue.
- `GET  /api/v1/developer/analytics` — Aggregate player starts, playtime, and revenue.
- `GET  /api/v1/developer/referrals` — Manage and generate opaque promotion links.
- `GET  /api/v1/developer/payouts` — View earnings ledger and request payout.

---

## 3. Public Player & Catalog Endpoints
- `GET  /api/v1/games` — Filterable game catalog (search, category, sort: featured, trending, new).
- `GET  /api/v1/games/:slug` — Public game details and metadata.
- `GET  /api/v1/categories` — List active categories and game counts.
- `POST /api/v1/player/session/start` — Initialize player game session, returns session token.
- `POST /api/v1/player/session/heartbeat` — Send active playtime ping (every 30s).
- `POST /api/v1/player/session/end` — Finalize session and record total active playtime.
- `POST /api/v1/player/games/:id/favorite` — Toggle favorite status.
- `GET  /api/v1/player/library` — Get user's favorites and recently played history.
- `POST /api/v1/player/games/:id/report` — Submit abuse, bug, or copyright report.

---

## 4. Admin & QA Operations Endpoints
- `GET  /api/v1/admin/submissions` — Fetch submission review queue.
- `GET  /api/v1/admin/submissions/:versionId` — Get sandbox build, automated scan report.
- `POST /api/v1/admin/submissions/:versionId/decision` — Action review (`APPROVE`, `REJECT`, `REQUEST_CHANGES`).
- `POST /api/v1/admin/games/:id/publish` — Publish approved game to live catalog.
- `POST /api/v1/admin/games/:id/suspend` — Instantly suspend game and disable iframe playback.
- `GET  /api/v1/admin/analytics/overview` — Platform-wide DAU, MAU, playtime, ad revenue.
- `GET  /api/v1/admin/reports` — View user abuse and content reports.
- `GET  /api/v1/admin/finance/ledger` — Audit platform revenue, deductions, and approve payouts.
- `GET  /api/v1/admin/audit-logs` — Immutable audit trail of administrative actions.
