# GameVerse: Technical Architecture Specification
**Version:** 1.0.0  
**Status:** Architectural Blueprint  

---

## 1. System Topology Overview
The GameVerse platform is engineered around high performance, low latency, robust security isolation, and clear separation of concerns across its three interconnected user personas (Players, Creators, Administrators).

```
                      +---------------------------------------+
                      |         Cloudflare CDN / Edge         |
                      |  - DDoS Protection & SSL/TLS          |
                      |  - Caching for Static Assets & CDN    |
                      +---------------------------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
                v                                                   v
+-------------------------------+                   +-------------------------------+
|     Main Web Application      |                   |    Isolated Game Sandbox      |
|       (app.gameverse.com)     |                   |    (games.gameverse.com)      |
|  - Next.js (App Router)       |                   |  - Sandboxed static file host |
|  - Player Discovery & Play    |                   |  - Restricted CSP             |
|  - Developer Portal           |                   |  - Custom Sandbox Runner      |
|  - Admin / QA Portal          |                   |  - PostMessage Bridge         |
+-------------------------------+                   +-------------------------------+
                |                                                   |
                +-------------------------+-------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |          Backend API Service          |
                      |           (api.gameverse.com)         |
                      |  - Node.js (NestJS / Modular Express) |
                      |  - RESTful & WebSocket APIs           |
                      |  - Auth, RBAC, Sessions, Rate Limits  |
                      |  - Validation & Security Sanitization |
                      +---------------------------------------+
                             |                         |
              +--------------+                         +--------------+
              v                                                       v
+-------------------------------+                           +-------------------------------+
|       PostgreSQL 16           |                           |         Redis / BullMQ        |
|  - Users, Roles, Profiles     |                           |  - Session Cache              |
|  - Games, Versions, Files     |                           |  - Rate Limiting              |
|  - Analytics & Events         |                           |  - ZIP Extraction & Malware   |
|  - Double-Entry Ledger        |                           |  - Thumbnail Generation       |
+-------------------------------+                           +-------------------------------+
              |
              v
+-------------------------------+
|      Cloud Storage (R2/S3)    |
|  - Raw ZIP Archives (Private) |
|  - Extracted Game Assets      |
|  - Thumbnails & Screenshots   |
+-------------------------------+
```

---

## 2. Technology Stack Selection & Justification

| Layer | Chosen Technology | Rationale & Enterprise Standards |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (React 18/19, App Router, TypeScript)** | Server-side rendering (SSR) and Incremental Static Regeneration (ISR) provide optimal SEO for thousands of game landing pages, ultra-fast initial page loads, and native API routes. |
| **Styling & UI Kit** | **Tailwind CSS + Lucide Icons + Radix UI Primitives** | Highly customizable, zero-runtime overhead, built-in dark mode support, accessible keyboard and screen-reader interactions, and responsive utility architecture. |
| **Backend API Framework**| **Node.js with NestJS / Modular Express (TypeScript)** | Strong architectural structure, native dependency injection, decorators for RBAC guards, robust OpenAPI/Swagger generation, and seamless integration with ORMs. |
| **Database & ORM** | **PostgreSQL 16 with Prisma / Drizzle ORM** | ACID compliance is mandatory for financial ledgering, analytics event aggregation, relational game versioning, and complex querying. Schema migrations are type-safe. |
| **Asynchronous Worker Queue**| **BullMQ + Redis (or Node worker threads for local dev)** | Handles non-blocking ZIP unpacking, MIME-type verification, virus/malware heuristic checks, image resizing, and daily analytics reconciliation. |
| **Object Storage & CDN**| **Cloudflare R2 / AWS S3 + Cloudflare CDN** | Zero egress fees with R2, lightning-fast global asset delivery for heavy WebGL binaries (`.wasm`, `.data`, `.unityweb`), and domain isolation. |
| **Security & Sandbox Bridge**| **HTML5 PostMessage API + Strict CSP Headers** | Safe two-way communication between parent website and embedded iframe for analytics, pause/resume, and fullscreen handling without cross-origin script execution. |

---

## 3. Sandboxing & Isolation Architecture
Running arbitrary third-party WebGL/HTML5 code presents severe security threats:
1. **Cross-Origin Script Execution & Cookie Theft:** Mitigated by serving game builds strictly from a dedicated origin (`games.gameverse.com` or local isolated port `localhost:5001`), completely isolating player authentication cookies and localStorage on `app.gameverse.com`.
2. **Iframe Sandboxing Attributes:**
   ```html
   <iframe
     src="https://games.gameverse.com/builds/{gameId}/{versionId}/index.html"
     sandbox="allow-scripts allow-same-origin allow-pointer-lock"
     allow="fullscreen; autoplay; gamepad"
     loading="lazy"
   ></iframe>
   ```
3. **Discreet Escape Control:** The game cannot trap the player; a parent-level HUD overlay provides an explicit "Back to GameVerse" and "Exit Fullscreen" control that cannot be captured by the canvas.

---

## 4. Multi-Tenant Authorization & RBAC
Every endpoint enforces:
1. `AuthenticationGuard`: Validates session cookie or bearer token.
2. `RolesGuard`: Enforces role permission hierarchy (`GUEST` < `PLAYER` < `DEVELOPER` < `MODERATOR` < `ADMIN` < `SUPER_ADMIN`).
3. `OwnershipGuard`: Enforces that developers can only query, modify, or view analytics for games where `game.developer_id === user.id`. Cross-tenant data leakage is prevented at the database query level.
