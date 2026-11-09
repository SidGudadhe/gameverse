# GameVerse: Quality Assurance & Testing Strategy
**Version:** 1.0.0  

---

## 1. Multi-Tiered Testing Pyramid
GameVerse adheres to an enterprise testing protocol spanning four rigorous testing levels:

```
              /\
             /  \    E2E & Playwright Browser Automation (Critical User Journeys)
            /----\
           /      \   Integration & API Security Tests (Supertest, RBAC, Database)
          /--------\
         /          \  Unit Tests (Jest / Vitest: Schema, Validations, Services)
        /------------\
```

---

## 2. Testing Methodology by Discipline

### 2.1 Automated Unit & Integration Testing
- **Framework:** Vitest / Jest with Supertest.
- **Coverage Target:** 85%+ on core business logic (auth, permissions, file upload sanitization, referral attribution, financial ledger reconciliation).
- **Security Checkpoints:** Cross-developer tenant isolation tests (verifying Developer A gets `403 Forbidden` accessing Developer B's games), rate limiter tests, invalid token rejection.

### 2.2 Upload & File Security Testing
- **Archive Extraction Stress:**
  - Corrupted ZIP headers and truncated archives.
  - ZIP Bomb detection (multi-gigabyte decompressed payload rejection).
  - Path traversal injection (`../../etc/passwd` or `..\windows\system32`).
  - Prohibited file extensions (`.exe`, `.bat`, `.sh`, `.php`, `.vbs`, `.dll`).
  - Missing entry file validation (absence of `index.html` at root).

### 2.3 Sandboxed Iframe & Gameplay QA
- **Isolation Check:** Verify embedded iframe cannot execute scripts against parent origin or read cookies.
- **Viewport & Aspect Ratio:** Verify 16:9 responsive scaling on desktop (1920x1080, 1440x900), tablet (iPad Pro, iPad Mini), and mobile (iPhone 14/15, Galaxy S23).
- **Fullscreen Transitions:** Verify explicit escape handling via Escape key and parent-level discreet back button.

### 2.4 End-to-End Golden Flow Verification
- `E2E-01`: Developer registers -> completes studio onboarding -> signs creator agreement -> uploads valid HTML5 ZIP -> archive scanned -> version enters Admin QA queue.
- `E2E-02`: Admin opens QA workspace -> loads isolated sandbox -> inspects automated scan metrics -> approves build -> publishes game to public catalog.
- `E2E-03`: Player visits catalog -> searches game -> opens game detail page -> launches sandboxed player -> enters fullscreen -> exits player -> session analytics recorded.
