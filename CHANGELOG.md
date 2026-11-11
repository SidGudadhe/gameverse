# GameVerse: Project Changelog

All notable changes to the GameVerse project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.15.0] - 2026-11-11
### Added - Phase 15 (Performance Optimization, CDN Edge Caching & Stress Testing)
- Cloudflare & Edge CDN caching headers configured in `next.config.mjs` and `src/lib/performance.ts` for static assets (`immutable`), public game catalog, categories (`s-maxage=3600`, `stale-while-revalidate`), and game build archives.
- Automated in-memory database index engine (`DatabaseIndexEngine`) converting game, user, and referral queries to $O(1)$ constant-time map lookups.
- Dynamic component code-splitting with `next/dynamic` and cyber-slate skeletons for `GamePlayer` and `GameReviewsSection` on game landing pages.
- Package import tree-shaking optimization for `lucide-react` icons.
- Brotli and Gzip compression capability detection and payload size reduction heuristics.
- High-concurrency worker-pool load testing engine (`runConcurrencyBenchmark`) evaluating latency percentiles (avg, P95, P99) and RPS across 100, 500, 1,000, and 5,000 concurrent player sessions with 0% failure rate.
- Admin performance and stress testing metrics API (`GET /api/admin/performance`).
- Comprehensive Phase 15 automated test suite (`tests/performance_phase15.test.ts`).

## [0.14.0] - 2026-11-11
### Added - Phase 14 (Security Hardening, Privacy & Legal Compliance)
- Subdomain origin isolation verifier (`src/lib/security.ts`) and sandbox attribute validator enforcing strict `allow-scripts allow-same-origin allow-pointer-lock` while blocking breakout flags.
- Comprehensive HTTP security headers and CSP Level 3 policy configured in `next.config.mjs` and Next.js Edge middleware (`src/middleware.ts`).
- Directory traversal URL screening preventing path escape attacks (`..`, `%2e%2e`).
- GDPR Article 15/20 & India DPDP Section 11 Data Subject Access Request (DSAR) export API (`/api/user/privacy/export`) with SHA-256 data archive checksums.
- GDPR Article 17 & India DPDP Section 12 Right to Erasure / Account Anonymization API (`/api/user/privacy/erasure`) wiping credentials, purging personal history, and pseudonymizing reviews to preserve game ratings without retaining PII.
- Cyber-Slate floating cookie and consent manager (`src/components/CookieConsent.tsx`) with category toggles for Essential, Analytics, and Advertising.
- Cryptographically chained SHA-256 audit logging engine (`src/lib/audit.ts`) and tamper detection verifier.
- Admin security audit log dashboard (`/admin/audit-logs`, `/api/admin/audit-logs`) with real-time chain integrity verification badges and JSON inspection drawer.
- Legally binding policy pages: Privacy Policy (`/privacy`), Terms of Service (`/terms`), and Creator Agreement (`/creator-agreement`).
- Comprehensive Phase 14 automated test suite (`tests/security_phase14.test.ts`).

## [0.13.0] - 2026-11-11
### Added - Phase 13 (Player Community, Profiles & Social)
- Unique player handle validation system (`src/lib/community.ts`) enforcing format `^[a-zA-Z0-9_]{3,20}$`, uniqueness, and reserved username protection.
- Public player profile pages (`/player/[username]`) displaying player avatar, bio, favorite genre, joined date, games played counter, reviews written counter, and public favorite games showcase.
- Cloud favorites synchronization across devices (`/api/player/favorites`) integrated with `GameActionBar` heart toggle.
- Play history tracker (`/api/player/history`) recording games, last played timestamp, and total accumulated playtime.
- Verified Player review badges requiring at least 60 active seconds of recorded gameplay to combat review bombing.
- Automated review commentary moderation screening out profanity, repetitive spam, and malicious links.
- Interactive `GameReviewsSection` component on game pages with 5-star picker, review posting form, review cards, and helpful upvote buttons.
- Community APIs for reviews (`/api/games/[slug]/reviews`), helpful votes (`/api/games/[slug]/reviews/[reviewId]/helpful`), favorites, history, and player profiles (`/api/player/profile`).
- Comprehensive Phase 13 automated test suite (`tests/community_phase13.test.ts`).

## [0.12.0] - 2026-11-11
### Added - Phase 12 (Earnings & Double-Entry Financial Ledger)
- Double-entry financial ledger architecture (`src/lib/ledger.ts`, `src/lib/database/index.ts`) tracking gross revenue, platform deductions (10%), net revenue, and creator share.
- State machine lifecycle for financial records: `ESTIMATED` (real-time MTD), `FINALIZED` (Net-30 verified), `PROCESSING` (requested batch), `PAID` (disbursed), and `ON_HOLD`.
- Minimum payout threshold rules enforcing a strict $50.00 accumulated balance and validated payout method before disbursement.
- Net-30 monthly settlement engine transitioning closed period estimates to finalized records.
- Batch disbursement system processing payments with immutable transaction/batch reference IDs.
- Interactive Studio Payouts Hub (`/developer/payouts`) with real-time balance cards, threshold progress bar, payout method details, status filters, and instant withdrawal request modal.
- Creator Payouts APIs (`GET /api/developer/payouts` and `POST /api/developer/payouts/request`) with strict tenant isolation.
- Admin Financial Reconciliation APIs (`GET /api/admin/finance` and `POST /api/admin/finance/settle`) with RBAC enforcement.
- Comprehensive Phase 12 automated test suite (`tests/ledger_phase12.test.ts`).

## [0.11.0] - 2026-11-11
### Added - Phase 11 (Advertising & Monetization Integration)
- HTML5 Ad Engine & Monetization Architecture (`src/lib/ads.ts`) supporting PREROLL ($4.50 eCPM), INTERSTITIAL ($6.00 eCPM), and REWARDED ($8.00 eCPM) formats.
- Frequency capping and cooldown rules enforcing single preroll per session start, 180s active gameplay cooldown between interstitials, and 60s cooldown on rewarded ads.
- Transparent revenue split math deducting 10% network/hosting fee and delivering 50% net revenue to standard plays, boosted to 70% net revenue on creator referral-attributed plays.
- IVT ad suppression engine preventing bot traffic and automated scripts from registering billable ad impressions.
- Minimum view duration verification ($\ge 3$ seconds) required to qualify as completed billable impression.
- Cyber-slate themed `AdOverlay` component with animated progress bar, "Ad • GameVerse Network" badge, sponsor showcase, and dynamic 3-second skip countdown button.
- In-Player Ad integration in `src/components/GamePlayer.tsx` displaying prerolls on game boot and handling `GV_REQUEST_AD` postMessage events from HTML5 games.
- Ad slot eligibility check API (`GET /api/ads/slot`) and impression ingestion API (`POST /api/ads/impression`).
- Database persistence for ad impressions and monetization stats integration in Developer Analytics API.
- Comprehensive Phase 11 automated test suite (`tests/ads_phase11.test.ts`).

## [0.10.0] - 2026-11-11
### Added - Phase 10 (Social Promotion & Referral Engine)
- Opaque, tamper-proof creator referral token generator (`src/lib/referrals.ts`) preventing leakage of sensitive developer emails or internal database identifiers.
- Anti-fraud attribution engine preventing self-referral bonus abuse and validating promotion tokens.
- Tiered monetization bonus calculation boosting creator net revenue split from standard 50% to 70% on referral-attributed traffic.
- SocialShareModal component with one-click link copying and pre-formatted community sharing for Twitter/X, Reddit, WhatsApp, and Discord.
- GameActionBar client component integrating Favorite, Share & Refer, and Report triggers into game detail pages.
- Creator Referral Campaign Manager (`/developer/referrals`) with custom campaign creator modal and performance tracking table.
- Developer Referral APIs (`/api/developer/referrals`) for creating and listing tracked promotional campaigns.
- Public Referral Token Resolution API (`/api/referrals/[token]`) with automatic click telemetry logging.
- Comprehensive Phase 10 automated test suite (`tests/referrals_phase10.test.ts`).

## [0.9.0] - 2026-11-11
### Added - Phase 9 (Developer Analytics & Dashboards)
- Developer Analytics Hub (`/developer/analytics`) providing studio-level telemetry overviews with timeframe filtering (7D, 30D, All Time) and multi-game selection.
- Interactive SVG timeline trend visualizer comparing daily gameplay starts and active play minutes with hover tooltips.
- Device & platform distribution component showing desktop, mobile, and tablet proportions with percentage bars.
- Player retention benchmark cards tracking Day 1, Day 7, and Day 30 retention curves.
- Acquisition and creator referral attribution table tracking link clicks and unique players (?ref=cr_...).
- Per-game deep dive analytics page (`/developer/analytics/[gameId]`) displaying detailed title-specific metrics and public page links.
- Developer Analytics API (`GET /api/developer/analytics`) with role enforcement and strict tenant isolation.
- Telemetry export API (`GET /api/developer/analytics/export`) supporting downloadable CSV and JSON formats.
- Studio sub-navigation updated with direct link to Analytics dashboard.
- Comprehensive Phase 9 automated test suite (`tests/analytics_phase9.test.ts`).

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
