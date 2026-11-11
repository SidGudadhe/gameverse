# GameVerse: Project Changelog

All notable changes to the GameVerse project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-11-11
### Added - Phase 8 (Player Analytics Pipeline & IVT Filtering)
- Enterprise-grade player telemetry heartbeat ingestion API (`POST /api/analytics/ping`) processing `SESSION_START`, `HEARTBEAT`, `SESSION_PAUSE`, `SESSION_RESUME`, and `SESSION_END`.
- Bot and Invalid Traffic (IVT) heuristic detection engine (`src/lib/analytics.ts`) blocking automated scripts and scrapers from earning monetization or falsifying play counts.
- Salted SHA-256 IP anonymization for DPDP and GDPR privacy compliance.
- Monotonic playtime progression validation and anomaly leap detection to prevent fraudulent duration spoofing.
- Platform monetization threshold enforcement gating plays under 10 seconds and IVT traffic.
- Real-time game analytics summary API (`GET /api/analytics/game/[gameId]`) calculating total starts, valid sessions, IVT counts, unique players, total play minutes, average session duration, and device breakdowns.
- Client-side `GamePlayer` telemetry integration tracking true active gameplay seconds, automated 15-second heartbeats, tab visibility events, and beacon unload dispatch.
- Database engine methods in `src/lib/database/index.ts` maintaining synchronized playtime and play counts across games and sessions.
- Comprehensive Phase 8 automated test suite (`tests/analytics_phase8.test.ts`).

## [0.7.0] - 2026-11-11
### Added - Phase 7 (Game Player & Sandboxed Fullscreen)
- Interactive Game Player component (`src/components/GamePlayer.tsx`) featuring 16:9 letterbox scaling, pre-boot poster thumbnail state for bandwidth conservation, and theater mode.
- Strict iframe multi-origin sandbox policy (`sandbox="allow-scripts allow-same-origin allow-pointer-lock"`, `allow="fullscreen; autoplay; gamepad; focus-without-user-activation"`) prohibiting top navigation and DOM escalations.
- Parent-level floating HUD overlay with 3-second auto-hide in fullscreen, audio mute/unmute toggle ('M' key), restart action, theater mode toggle, and browser Fullscreen API toggle ('F' key).
- Tab visibility manager listening to `document.visibilitychange` to automatically pause game loop and mute audio on backgrounding.
- Sandboxed HTML5 canvas runner (`src/app/sandbox/[gameId]/[versionId]/page.tsx`) with bidirectional `postMessage` protocol and WebAudio synthesizer.
- Secure static file delivery server (`/api/sandbox/files/[gameId]/[versionId]/[...file]`) enforcing strict Zip Slip path traversal defenses and isolated Content-Security-Policy headers.
- Comprehensive Phase 7 automated test suite (`tests/player_phase7.test.ts`).

## [0.6.0] - 2026-11-11
### Added - Phase 6 (Main Gaming Website & Public Catalog)
- Revamped homepage (`/`) featuring Hero Carousel, live category quick chips, Trending Right Now, Hall of Fame, and Fresh Releases sections.
- Dynamic category browsing catalog (`/category/[slug]`) with multi-factor sorting (Popularity, Rating, Newest) and orientation filters.
- Debounced global search experience (`/search`) with quick tag suggestion chips and real-time result counts.
- Rich game detail pages (`/game/[slug]`) with pre-boot player viewport, verified technical specifications, player controls, related games carousel, and opaque creator referral links (`?ref=cr_...`).
- Public RESTful APIs: `/api/games`, `/api/games/[slug]`, `/api/categories`.
- Database search query enhancements for creator studio names in `src/lib/database/index.ts`.
- Comprehensive Phase 6 automated test suite (`tests/catalog_phase6.test.ts`).

## [0.5.0] - 2026-11-11
### Added - Phase 5 (Admin Portal & QA Review Workspace)
- Operations review queue dashboard (`/admin`) with real-time status filters (`ALL`, `SUBMITTED`, `QA_TESTING`, `CHANGES_REQUESTED`, `PUBLISHED`, `REJECTED`), metrics summary cards, and search.
- Split-screen QA inspection workspace (`/admin/review/[id]`) featuring automated pre-flight security telemetry, AI disclosure review, operations checklist, and decision controls.
- Embedded live sandbox runner executing on isolated origin with device viewport switcher (Desktop 16:9, Tablet 4:3, Mobile 9:16) and live telemetry console monitor.
- Admin RESTful APIs: `/api/admin/submissions`, `/api/admin/submissions/[id]`, `/api/admin/submissions/[id]/review`.
- State machine transition engine for Approve & Publish, Request Changes, and Reject actions with audit logging.
- Comprehensive Phase 5 automated test suite (`tests/admin_phase5.test.ts`).

## [0.4.0] - 2026-11-11
### Added - Phase 4 (Game Submission & Secure Archive Processing Pipeline)
- Production-grade game submission wizard (`/developer/submit`) featuring 5 distinct steps (Build package, Discovery metadata, Technical specs & controls, Visual branding, and Legal & AI disclosures).
- Real server-side ZIP archive upload, decompression analysis, and staging API (`POST /api/developer/upload`).
- Production game submission endpoint (`POST /api/developer/submit`) validating metadata, checking Creator Agreement, creating Game/Version/Submission/RightsDeclaration entities, and extracting files to isolated disk storage.
- Submissions retrieval and tenant-isolated inspection API (`GET /api/developer/submissions`).
- Zip Slip protection and safe extraction engine (`extractArchiveSafely`) in `src/lib/security.ts`.
- Database persistence extensions for game versions, submissions, and rights declarations in `src/lib/database/index.ts`.
- Comprehensive Phase 4 automated test suite (`tests/submission_phase4.test.ts`) covering Zip Slip defense, prohibited executables, missing entry points, database records, and tenant isolation.

## [0.3.0] - 2026-11-11
### Added - Phase 3 (Developer Portal & Studio Onboarding)
- Studio Portal layout and navigation shell (`/developer/layout.tsx`).
- 3-step studio onboarding and legal agreement signing wizard (`/developer/onboard`).
- "My Games" studio catalog hub with dynamic status filtering, play metrics, and actions (`/developer/games`).
- Studio Profile and branding management (`/developer/profile`).
- Studio payout preferences supporting Bank Wire, UPI, and PayPal (`/developer/settings`).
- Developer Support Hub with ticketing system and FAQ accordion (`/developer/support`).
- Developer REST APIs: `/api/developer/onboard`, `/api/developer/profile`, `/api/developer/settings`, `/api/developer/support`, `/api/developer/games`.
- Comprehensive Phase 3 automated test suite (`tests/developer_phase3.test.ts`).

## [0.2.0] - 2026-11-11
### Added - Phase 2 (Backend, Database & Authentication Core)
- Relational database engine with disk persistence supporting all 17 schema entities (`src/lib/database/index.ts`).
- Multi-tenant security middleware: sliding window rate limiter, `requireAuth`, RBAC `requireRole`, and tenant isolation `requireOwnership`.
- Authentication REST APIs: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/verify-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/2fa/verify`.
- Authentication UI pages: `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/verify-email`.
- Comprehensive Phase 2 security test suite (`tests/auth_phase2.test.ts`).

## [0.1.0] - 2026-11-11
### Added - Phase 1 (UI/UX Design System & Interactive Prototypes)
- "Cyber-Slate" design token system.
- Accessible core UI component library (`Button`, `Input`, `Badge`, `Skeleton`, `EmptyState`, `Modal`, `Navbar`).
- Interactive design system showcase and prototypes (`/design-system`).
- Design system test suite (`tests/ui_design_system.test.ts`).

## [0.0.1] - 2026-11-10
### Added - Phase 0 (Requirements, Architecture & Project Management)
- Created remote GitHub repository `gameverse` under `SidGudadhe`.
- Authored 11 foundational architecture documents.
