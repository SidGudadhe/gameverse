import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Search Page Ultra-Compact Fallback Notification', () => {
  const searchPagePath = path.resolve(__dirname, '../src/app/search/page.tsx');

  it('1. should configure ultra-compact fallback banner when zero search results found', () => {
    const searchContent = fs.readFileSync(searchPagePath, 'utf-8');

    // Notification contains title and text
    expect(searchContent).toContain('This Game is Not Available Yet');
    expect(searchContent).toContain('Would you like to play these top-rated and similar popular games instead?');

    // Uses compact single-row banner styling instead of oversized card
    expect(searchContent).toContain('rounded-xl px-4 py-2.5 shadow-2xs');
    expect(searchContent).toContain('text-xs sm:text-sm font-bold text-slate-900 tracking-tight');
    expect(searchContent).not.toContain('rounded-3xl p-8 sm:p-10');
  });

  it('2. should place curated alternative games directly below compact fallback banner', () => {
    const searchContent = fs.readFileSync(searchPagePath, 'utf-8');

    const fallbackIndex = searchContent.indexOf('This Game is Not Available Yet');
    const alternativesIndex = searchContent.indexOf('Suggested Games You Might Enjoy Instead');
    const gamesGridIndex = searchContent.indexOf('fallbackRecommendations.map');

    expect(fallbackIndex).toBeGreaterThan(-1);
    expect(alternativesIndex).toBeGreaterThan(fallbackIndex);
    expect(gamesGridIndex).toBeGreaterThan(alternativesIndex);
  });
});
