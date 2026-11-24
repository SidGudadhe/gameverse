import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Developer vs Gamer Policy & Zero Cross-Portal Connection Verification (100x Deep Scan)', () => {
  const rootDir = process.cwd();

  // 1. Separate Policy & Agreement Pages Exist
  it('1. should verify Developer and Gamer have distinct, separated policy files', () => {
    // Developer legal files
    expect(fs.existsSync(path.join(rootDir, 'src/app/developer/agreement/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/app/developer/terms/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/app/developer/privacy/page.tsx'))).toBe(true);

    // Gamer legal files
    expect(fs.existsSync(path.join(rootDir, 'src/app/terms/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/app/privacy/page.tsx'))).toBe(true);
  });

  // 2. Developer Agreement Content Verification
  it('2. should verify Developer Agreement is 100% focused on studio publishing and has zero gamer links', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/app/developer/agreement/page.tsx'), 'utf8');

    // Contains creator & publisher terms
    expect(content).toContain('GameVerse Creator Agreement');
    expect(content).toContain('100% IP Ownership');
    expect(content).toContain('Net Ad Revenue');
    expect(content).toContain('Net-30 Settlement');
    expect(content).toContain('₹500.00 INR');
    expect(content).toContain('Invalid Traffic (IVT)');

    // Links strictly stay inside Developer realm
    expect(content).toContain('/developer');
    expect(content).toContain('/developer/terms');
    expect(content).toContain('/developer/privacy');
    expect(content).toContain('/developer/docs');

    // Does NOT link to gamer pages
    expect(content).not.toContain('href="/"');
    expect(content).not.toContain('href="/game/');
    expect(content).not.toContain('href="/terms"');
    expect(content).not.toContain('href="/privacy"');
  });

  // 3. Developer Terms Content Verification
  it('3. should verify Developer Terms of Service has zero gamer links', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/app/developer/terms/page.tsx'), 'utf8');

    expect(content).toContain('Developer Studio Terms of Service');
    expect(content).toContain('postMessage protocol');
    expect(content).toContain('Automated Quarantine');

    // Does NOT link to gamer pages
    expect(content).not.toContain('href="/"');
    expect(content).not.toContain('href="/game/');
    expect(content).not.toContain('href="/terms"');
    expect(content).not.toContain('href="/privacy"');
  });

  // 4. Developer Privacy Policy Content Verification
  it('4. should verify Developer Privacy Policy is studio-specific and has zero gamer links', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/app/developer/privacy/page.tsx'), 'utf8');

    expect(content).toContain('Developer Studio Privacy Policy');
    expect(content).toContain('Studio Telemetry');

    // Does NOT link to gamer pages
    expect(content).not.toContain('href="/"');
    expect(content).not.toContain('href="/game/');
    expect(content).not.toContain('href="/terms"');
    expect(content).not.toContain('href="/privacy"');
  });

  // 5. Developer Auth Signup Links Strictly to Developer Legal Pages
  it('5. should verify Developer signup page links to /developer/agreement and /developer/terms', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/app/developer/auth/signup/page.tsx'), 'utf8');

    expect(content).toContain('/developer/agreement');
    expect(content).toContain('/developer/terms');
    expect(content).not.toContain('/creator-agreement');
  });

  // 6. Developer Profile Links Strictly to Developer Agreement
  it('6. should verify Developer profile page links to /developer/agreement', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/app/developer/profile/page.tsx'), 'utf8');

    expect(content).toContain('/developer/agreement');
    expect(content).not.toContain('/creator-agreement');
  });

  // 7. Developer Auth Login Forgot Password
  it('7. should verify Developer login page links to /developer/auth/forgot-password', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/app/developer/auth/login/page.tsx'), 'utf8');

    expect(content).toContain('/developer/auth/forgot-password');
    expect(content).not.toContain('href="/auth/forgot-password"');
  });

  // 8. Legacy /creator-agreement and /docs/publishing-guide redirects
  it('8. should verify legacy routes cleanly redirect to Developer Studio routes', () => {
    const agreementRedirect = fs.readFileSync(path.join(rootDir, 'src/app/creator-agreement/page.tsx'), 'utf8');
    expect(agreementRedirect).toContain("redirect('/developer/agreement')");

    const docsRedirect = fs.readFileSync(path.join(rootDir, 'src/app/docs/publishing-guide/page.tsx'), 'utf8');
    expect(docsRedirect).toContain("redirect('/developer/docs')");
  });

  // 9. Developer Studio Games & Dashboard use Sandbox Previews instead of Player links
  it('9. should verify Developer Games and Dashboard pages do not link to /game/[slug]', () => {
    const gamesContent = fs.readFileSync(path.join(rootDir, 'src/app/developer/games/page.tsx'), 'utf8');
    expect(gamesContent).not.toContain('href={`/game/${game.slug}`}');
    expect(gamesContent).toContain('/sandbox/');

    const dashboardContent = fs.readFileSync(path.join(rootDir, 'src/app/developer/page.tsx'), 'utf8');
    expect(dashboardContent).not.toContain('href={`/game/${g.slug}`}');
    expect(dashboardContent).toContain('/sandbox/');

    const analyticsContent = fs.readFileSync(path.join(rootDir, 'src/app/developer/analytics/[gameId]/page.tsx'), 'utf8');
    expect(analyticsContent).not.toContain('href={`/game/${targetGame.slug}`}');
    expect(analyticsContent).toContain('/sandbox/');
  });

  // 10. FooterLegal strictly isolates Developer links vs Gamer links
  it('10. should verify FooterLegal dynamically isolates Developer vs Player links', () => {
    const content = fs.readFileSync(path.join(rootDir, 'src/components/FooterLegal.tsx'), 'utf8');

    expect(content).toContain('isDevPortal');
    expect(content).toContain('/developer/terms');
    expect(content).toContain('/developer/agreement');
    expect(content).toContain('/developer/privacy');
    expect(content).toContain('/developer/docs');
    expect(content).toContain('/privacy');
    expect(content).toContain('/terms');
    expect(content).not.toContain('Cookie Settings');
  });

  // 11. Cookie Setting removed from all 3 roles
  it('11. should verify Cookie Settings button and banners are removed across all portals', () => {
    const footerContent = fs.readFileSync(path.join(rootDir, 'src/components/FooterLegal.tsx'), 'utf8');
    expect(footerContent).not.toContain('Cookie Settings');
    expect(footerContent).not.toContain('openCookiePreferences');

    const layoutContent = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf8');
    expect(layoutContent).not.toContain('<CookieConsent');

    const privacyContent = fs.readFileSync(path.join(rootDir, 'src/app/privacy/page.tsx'), 'utf8');
    expect(privacyContent).not.toContain('Cookie Preferences');
  });
});
