import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Category Page Layout & Gamer Role Display', () => {
  const categoryPagePath = path.resolve(__dirname, '../src/app/category/page.tsx');
  const categorySlugPagePath = path.resolve(__dirname, '../src/app/category/[slug]/page.tsx');
  const navbarPath = path.resolve(__dirname, '../src/components/Navbar.tsx');
  const webAdBannerPath = path.resolve(__dirname, '../src/components/ads/WebAdBanner.tsx');

  it('1. should display "Player" instead of "Developer" under gamer name in Gamer Portal Navbar', () => {
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
    
    // In Portal C (Gamer Portal), under the user name it must render Player
    expect(navbarContent).toContain('<div className="text-slate-500 text-[10px] font-mono font-medium">Player</div>');
    expect(navbarContent).not.toContain('<div className="text-slate-500 text-[10px] font-mono">{role}</div>');
  });

  it('2. should configure compact hero category header in src/app/category/page.tsx', () => {
    const catPageContent = fs.readFileSync(categoryPagePath, 'utf-8');

    // Header has All Game Categories and required text
    expect(catPageContent).toContain('All Game Categories');
    expect(catPageContent).toContain(
      'Find instant browser games by your favorite genre. Pick any category below to filter games, or explore popular picks.'
    );

    // Uses compact sizing
    expect(catPageContent).toContain('rounded-2xl p-4 sm:p-5');
    expect(catPageContent).toContain('text-xl sm:text-2xl text-slate-900 tracking-tight');
  });

  it('3. should enforce strict screen order: Compact Header -> Browse by Category -> Banner Ad -> Games', () => {
    const catPageContent = fs.readFileSync(categoryPagePath, 'utf-8');

    const headerIndex = catPageContent.indexOf('All Game Categories');
    const browseCategoryIndex = catPageContent.indexOf('Browse by Category');
    const bannerAdIndex = catPageContent.indexOf('<WebAdBanner placement="CATEGORY_BANNER"');
    const gamesIndex = catPageContent.indexOf('All Available Games');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(browseCategoryIndex).toBeGreaterThan(headerIndex);
    expect(bannerAdIndex).toBeGreaterThan(browseCategoryIndex);
    expect(gamesIndex).toBeGreaterThan(bannerAdIndex);
  });

  it('4. should have CATEGORY_BANNER configured with authentic gaming gear sponsor in WebAdBanner', () => {
    const bannerContent = fs.readFileSync(webAdBannerPath, 'utf-8');

    expect(bannerContent).toContain('CATEGORY_BANNER');
    expect(bannerContent).toContain('SteelSeries Apex Pro TKL');
    expect(bannerContent).toContain('steelseries.com');
  });
});
