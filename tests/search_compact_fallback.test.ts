import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Search Page Ultra-Compact Fallback Notification & Clean Controls', () => {
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

  it('3. should remove Popular tags row, Global Search header, and Category dropdown, while retaining Sort', () => {
    const searchContent = fs.readFileSync(searchPagePath, 'utf-8');

    // Removed Popular tags row
    expect(searchContent).not.toContain('<span>Popular:</span>');
    expect(searchContent).not.toContain('{POPULAR_TAGS.map');

    // Removed top Global Search / games found header
    expect(searchContent).not.toContain('GLOBAL SEARCH');
    expect(searchContent).not.toContain('Discover & Search Games');

    // Removed category select dropdown from controls
    expect(searchContent).not.toContain('<option value="cat-arcade">Arcade</option>');
    expect(searchContent).not.toContain('<option value="all">All Categories</option>');

    // Retained Sort dropdown
    expect(searchContent).toContain('value={sortBy}');
    expect(searchContent).toContain('<option value="trending">Sort: Trending</option>');
    expect(searchContent).toContain('<option value="popular">Sort: Most Played</option>');
  });
});
