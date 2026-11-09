# GameVerse: Master Requirements Specification
**Version:** 1.0.0  
**Date:** November 9, 2026  
**Document Status:** Pending Architecture & UI Approval  
**Project GitHub:** https://github.com/SidGudadhe/gameverse  

---

## 1. Executive Summary & Vision
GameVerse is a next-generation browser-based gaming portal designed to bridge players, independent game creators, and platform operations. Players can instantly discover and play high-performance HTML5, WebAssembly (WASM), and WebGL games directly in their browser without downloading a client or launcher. Independent creators submit runnable builds, view comprehensive engagement analytics, and earn monetization shares. Platform administrators oversee security scanning, manual gameplay review, rights verification, content moderation, and revenue reconciliation.

---

## 2. Platform Architecture: Three Connected Portals
All three portals operate off a single, shared, hardened backend and database, with strict role-based and object-level authorization (tenant isolation):

### 2.1 Player Website (Public & Registered)
- **Home & Discovery:** Featured hero carousel, trending games, most-played, new releases, categorized browsable grids (Action, Puzzle, Arcade, Strategy, RPG, Sports, Multiplayer, Casual), search with autocomplete, and multi-factor filtering (device, genre, rating).
- **Game Detail Page:** Game title, developer/studio profile link, rich description, controls guide, gameplay screenshots, ratings, favorite button, share button with referral token generator, report button, and related games carousel.
- **Embedded Game Player:** Responsive aspect-ratio viewport (16:9, responsive letterbox), play-on-demand lazy loader (thumbnail placeholder before boot), fullscreen API support, discreet parent-level exit/back controls, pause/resume messaging, and focus/audio management.
- **Player Accounts:** Guest play supported by default; registered accounts feature custom usernames, avatars, favorite games collection, recently played history, and public gamer profiles.

### 2.2 Developer Portal (Creators & Studios)
- **Registration & Onboarding:** Dedicated studio signup, legal terms of service and Creator Agreement acceptance with immutable version tracking and timestamping, profile/bio/social links setup.
- **Game Submission & Version Management:** Drag-and-drop ZIP archive upload containing entry `index.html`, JavaScript/WASM assets, audio, and textures. Captures rich metadata: title, description, categories, tags, control schemes (keyboard, mouse, touch, gamepad), target orientations (landscape, portrait), engine used (Unity, Godot, Phaser, Construct, Custom), and build version.
- **Rights & AI Disclosures:** Explicit declaration of AI usage (AI-generated, AI-assisted, or Human-developed), licensing proofs for 3rd-party assets, fonts, and audio, and copyright indemnification.
- **Creator Dashboard & Analytics:** Real-time metrics on game impressions, game starts, unique players, total active play minutes, average session duration, returning player retention, referral performance, and ad impressions.
- **Revenue & Payout Hub:** Tracking of estimated earnings, finalized earnings, pending balances, payout thresholds, historical payout receipts, and payment method configuration.

### 2.3 Admin Portal (Platform Operations & QA)
- **Submission & QA Queue:** Multi-stage review workspace showing submitted builds, security scan reports, archive extraction status, and rights declarations.
- **Isolated Game Sandbox:** Safe iframe preview executing on an isolated origin/subdomain to test gameplay mechanics, console output, network requests, responsive viewports, and performance before public release.
- **Workflow State Machine:** Rigorous lifecycle states: `Submitted`, `Processing`, `Security Review`, `Content Review`, `QA Testing`, `Changes Requested`, `Approved`, `Published`, `Rejected`, `Suspended`, `Unpublished`.
- **Operations & Moderation:** Category management, featured game curation, player abuse/copyright report triage, user management, role assignment, and comprehensive audit logs.
- **Financial & Revenue Operations:** Ad network reconciliation, invalid-traffic deductions, creator share calculations, payout batch approvals, and double-entry financial ledger auditing.

---

## 3. User Roles & Permission Matrix
| Role | Public Games | Upload Builds | Private QA Sandbox | Developer Analytics | Admin QA Queue | Publish / Reject | Financial Ledger |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Guest / Anonymous** | Read-only | No | No | No | No | No | No |
| **Player** | Play & Review | No | No | No | No | No | No |
| **Developer / Creator**| Play | Own Games Only | Own Previews | Own Games Only | No | No | Own Payouts |
| **Moderator / QA** | Play | No | All Previews | No | Read/Review/Notes | Request Changes | No |
| **Finance Manager** | Play | No | No | No | No | No | Full Access |
| **Admin** | Play | All | All Previews | All | Full Access | Full Access | Audit View |
| **Super Admin** | Full | Full | Full | Full | Full | Full | Full |

---

## 4. Key Business Logic & Revenue Sharing
1. **Net Revenue Definition:** Net Revenue = Gross Advertising Revenue − Direct Network Fees − Chargebacks/Refunds − Invalid Traffic (IVT) Deductions − Hosting/Bandwidth Deductions (if stipulated in Creator Agreement).
2. **Creator Share:** Standard 50% split of eligible Net Game Revenue generated by the specific game, with direct referral bonuses (up to 70% or 100% net of platform fee for direct creator-promoted links as specified in tiered terms).
3. **Threshold & Payout Schedule:** Minimum payout threshold: $50 USD (or equivalent INR). Net-30 or Net-45 payout cycle to account for ad network audit reconciliation and clawbacks.
4. **Invalid Traffic (IVT) Protection:** Automated bot detection, click-spam filters, and retention thresholds (plays under 10 seconds excluded from monetization credit).

---

## 5. Security & Isolation Directives
- **Origin Isolation:** Untrusted game assets MUST NEVER execute under the main domain. All uploaded games are served from an isolated subdomain (e.g. `sandbox.gameverse.com` or dedicated cloud storage CDN domain).
- **Iframe Sandboxing:** Sandboxed iframe attributes: `sandbox="allow-scripts allow-same-origin allow-pointer-lock"`. Explicitly DISALLOW `allow-top-navigation`, `allow-popups-to-escape-sandbox`, `allow-modals`, and `allow-same-origin-with-parent`.
- **Archive Validation:** Zip bomb detection (maximum decompressed size: 250 MB; compression ratio limit: 10:1; maximum file count: 2,000 files), strict path traversal check (`../` prevention), executable file rejection (`.exe`, `.sh`, `.bat`, `.dll` prohibited).
- **Authentication & Sessions:** HTTP-only, secure, SameSite cookies with JWT/session store, Argon2/bcrypt password hashing, optional Google OAuth 2.0, TOTP-based 2FA for administrative accounts.
