# GameVerse: Project Changelog

All notable changes to the GameVerse project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
