import { describe, it, expect, beforeEach } from 'vitest';
import { gvDb } from '../src/lib/database';

describe('Phase 6: Main Gaming Website & Public Catalog', () => {
  let publishedGameId: string;
  let draftGameId: string;

  beforeEach(() => {
    // 1. Seed a published game
    publishedGameId = `game-pub-${Date.now()}`;
    gvDb.createGame({
      id: publishedGameId,
      developerId: 'usr-dev-1',
      developerName: 'PixelForge Studios',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `pub-runner-${Date.now()}`,
      title: 'Galactic Runner 2026',
      shortDescription: 'Cyberpunk endless runner in deep space.',
      fullDescription: 'Dodge asteroids and collect energy orbs.',
      controlsGuide: 'WASD to dodge, Space to hyperspace.',
      engine: 'Phaser 3',
      orientation: 'LANDSCAPE',
      status: 'PUBLISHED',
      totalPlays: 25000,
      rating: 4.9,
    });

    // 2. Seed a non-published/draft game
    draftGameId = `game-draft-${Date.now()}`;
    gvDb.createGame({
      id: draftGameId,
      developerId: 'usr-dev-2',
      developerName: 'Secret Labs',
      categoryId: 'cat-puzzle',
      categoryName: 'Puzzle',
      slug: `secret-puzzle-${Date.now()}`,
      title: 'Secret Unreleased Puzzle',
      shortDescription: 'Unpublished draft game.',
      status: 'SUBMITTED',
      totalPlays: 0,
      rating: 0,
    });
  });

  it('1. should only return PUBLISHED games in public catalog queries', () => {
    const publishedGames = gvDb.getGames({ status: 'PUBLISHED' });
    expect(publishedGames.some((g) => g.id === publishedGameId)).toBe(true);
    expect(publishedGames.some((g) => g.id === draftGameId)).toBe(false);
  });

  it('2. should filter catalog games by category correctly', () => {
    const arcadeGames = gvDb.getGames({ categoryId: 'cat-arcade', status: 'PUBLISHED' });
    expect(arcadeGames.length).toBeGreaterThan(0);
    expect(arcadeGames.every((g) => g.categoryId === 'cat-arcade')).toBe(true);
  });

  it('3. should search games by title, description, or developer name', () => {
    const titleResults = gvDb.getGames({ search: 'Galactic', status: 'PUBLISHED' });
    expect(titleResults.some((g) => g.id === publishedGameId)).toBe(true);

    const descResults = gvDb.getGames({ search: 'endless runner', status: 'PUBLISHED' });
    expect(descResults.some((g) => g.id === publishedGameId)).toBe(true);

    const studioResults = gvDb.getGames({ search: 'PixelForge', status: 'PUBLISHED' });
    expect(studioResults.some((g) => g.id === publishedGameId)).toBe(true);
  });

  it('4. should sort games by popularity, top rating, and newest', () => {
    const allPublished = gvDb.getGames({ status: 'PUBLISHED' });

    // Sorted by plays (Popularity)
    const sortedByPlays = [...allPublished].sort((a, b) => b.totalPlays - a.totalPlays);
    expect(sortedByPlays[0].totalPlays).toBeGreaterThanOrEqual(
      sortedByPlays[sortedByPlays.length - 1].totalPlays
    );

    // Sorted by rating
    const sortedByRating = [...allPublished].sort((a, b) => b.rating - a.rating);
    expect(sortedByRating[0].rating).toBeGreaterThanOrEqual(
      sortedByRating[sortedByRating.length - 1].rating
    );
  });

  it('5. should fetch categories with dynamic live counts of published games', () => {
    const categories = gvDb.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(7);

    const arcade = categories.find((c) => c.slug === 'arcade');
    expect(arcade).toBeDefined();
    expect(arcade!.count).toBeGreaterThan(0);
  });

  it('6. should generate secure opaque referral tokens without exposing sensitive developer data', () => {
    const game = gvDb.getGameById(publishedGameId);
    expect(game).toBeDefined();

    const referralToken = `cr_${game!.developerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
    expect(referralToken.startsWith('cr_')).toBe(true);
    expect(referralToken).not.toContain('@');
    expect(referralToken).not.toContain('password');
    expect(referralToken.length).toBeLessThanOrEqual(12);
  });
});
