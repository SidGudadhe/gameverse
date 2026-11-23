import { describe, it, expect } from 'vitest';
import { gvDb } from '../src/lib/database';
import { getPersonalizedRecommendations } from '../src/lib/recommendations';

describe('Veg & Non-Veg 2 Main Categories Architecture', () => {
  it('1. should classify games into 2 Main Categories: VEG and NON_VEG', () => {
    const allGames = gvDb.getGames();
    expect(allGames.length).toBeGreaterThan(0);

    const vegGames = gvDb.getGames({ mainCategory: 'VEG' });
    const nonVegGames = gvDb.getGames({ mainCategory: 'NON_VEG' });

    expect(vegGames.length).toBeGreaterThan(0);
    expect(nonVegGames.length).toBeGreaterThan(0);

    // Each game belongs to either VEG or NON_VEG
    for (const game of vegGames) {
      expect(game.mainCategory).toBe('VEG');
    }
    for (const game of nonVegGames) {
      expect(game.mainCategory).toBe('NON_VEG');
    }
  });

  it('2. should calculate vegCount and nonVegCount for sub-categories', () => {
    const categories = gvDb.getCategories();
    expect(categories.length).toBeGreaterThan(0);

    const arcadeCat = categories.find((c) => c.slug === 'arcade' || c.id === 'cat-arcade');
    expect(arcadeCat).toBeDefined();
    if (arcadeCat) {
      expect(typeof arcadeCat.vegCount).toBe('number');
      expect(typeof arcadeCat.nonVegCount).toBe('number');
      expect(arcadeCat.count).toBe(arcadeCat.vegCount + arcadeCat.nonVegCount);
    }
  });

  it('3. should separate games within the same subcategory based on developer selection', () => {
    // If games share the same sub-category (e.g. 'cat-arcade' or 'arcade'), developer's mainCategory selection distinguishes them
    const vegArcadeGames = gvDb.getGames({ categoryId: 'cat-arcade', mainCategory: 'VEG' });
    const nonVegArcadeGames = gvDb.getGames({ categoryId: 'cat-arcade', mainCategory: 'NON_VEG' });

    for (const game of vegArcadeGames) {
      expect(game.mainCategory).toBe('VEG');
      expect(game.categoryId).toBe('cat-arcade');
    }

    for (const game of nonVegArcadeGames) {
      expect(game.mainCategory).toBe('NON_VEG');
      expect(game.categoryId).toBe('cat-arcade');
    }
  });

  it('4. should allow developer to create a game with explicit mainCategory', () => {
    const newVegGame = gvDb.createGame({
      title: 'Garden Puzzle Feast',
      slug: `garden-puzzle-feast-${Date.now()}`,
      shortDescription: 'Family friendly matching game',
      categoryId: 'cat-puzzle',
      mainCategory: 'VEG',
      developerId: 'usr-dev-1',
      orientation: 'LANDSCAPE',
      engine: 'Phaser 3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      rating: 4.8,
      totalPlays: 10,
      status: 'PUBLISHED',
      controlsGuide: 'Mouse to match',
    });

    expect(newVegGame.mainCategory).toBe('VEG');

    const newNonVegGame = gvDb.createGame({
      title: 'Bloodline Arena Combat',
      slug: `bloodline-arena-combat-${Date.now()}`,
      shortDescription: 'Intense multiplayer 16+ combat',
      categoryId: 'cat-action',
      mainCategory: 'NON_VEG',
      developerId: 'usr-dev-1',
      orientation: 'LANDSCAPE',
      engine: 'Custom HTML5',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      totalPlays: 20,
      status: 'PUBLISHED',
      controlsGuide: 'WASD to attack',
    });

    expect(newNonVegGame.mainCategory).toBe('NON_VEG');

    // Verify retrieval filter isolates them
    const foundVeg = gvDb.getGames({ mainCategory: 'VEG' }).find((g) => g.id === newVegGame.id);
    expect(foundVeg).toBeDefined();

    const notFoundInNonVeg = gvDb.getGames({ mainCategory: 'NON_VEG' }).find((g) => g.id === newVegGame.id);
    expect(notFoundInNonVeg).toBeUndefined();
  });

  it('5. should allow developer to update game mainCategory via updateGame', () => {
    const updated = gvDb.updateGame('game-voxel-quest', {
      mainCategory: 'NON_VEG',
    });
    expect(updated?.mainCategory).toBe('NON_VEG');

    // Reset back for test consistency
    gvDb.updateGame('game-voxel-quest', {
      mainCategory: 'VEG',
    });
    expect(gvDb.getGameById('game-voxel-quest')?.mainCategory).toBe('VEG');
  });

  it('6. should enforce restaurant menu analogy: identical sub-category names display completely different games', () => {
    // Both Veg and Non-Veg have 'Arcade', 'Action', 'Puzzle', 'RPG'
    const vegArcade = gvDb.getGames({ categoryId: 'cat-arcade', mainCategory: 'VEG' });
    const nonVegArcade = gvDb.getGames({ categoryId: 'cat-arcade', mainCategory: 'NON_VEG' });

    expect(vegArcade.length).toBeGreaterThan(0);
    expect(nonVegArcade.length).toBeGreaterThan(0);

    // No game in vegArcade is in nonVegArcade
    const vegIds = new Set(vegArcade.map((g) => g.id));
    for (const g of nonVegArcade) {
      expect(vegIds.has(g.id)).toBe(false);
      expect(g.mainCategory).toBe('NON_VEG');
    }
    for (const g of vegArcade) {
      expect(g.mainCategory).toBe('VEG');
    }
  });

  it('7. sub-category page UI strictly locks mainCategory and requires Back navigation to change', () => {
    const fs = require('fs');
    const path = require('path');
    const slugPagePath = path.resolve(__dirname, '../src/app/category/[slug]/page.tsx');
    const slugContent = fs.readFileSync(slugPagePath, 'utf-8');

    // Must have Locked Category indicator
    expect(slugContent).toContain('Active Category (Locked):');
    expect(slugContent).toContain('LOCKED');

    // Must have Back to Change Category button linking to /category
    expect(slugContent).toContain('← Back to Change Category');
    expect(slugContent).toContain('href={`/category?mainCategory=');

    // Must NOT have inline category switch buttons (user cannot change category here)
    expect(slugContent).not.toContain("setMainCategoryFilter('VEG')");
    expect(slugContent).not.toContain("setMainCategoryFilter('NON_VEG')");
  });

  it('8. category page guidance banners must NOT contain sub-category back note or Reset to All button', () => {
    const fs = require('fs');
    const path = require('path');
    const catPagePath = path.resolve(__dirname, '../src/app/category/page.tsx');
    const catContent = fs.readFileSync(catPagePath, 'utf-8');

    // Must NOT contain the note
    expect(catContent).not.toContain('(Note: Once inside a sub-category');
    expect(catContent).not.toContain('← Back to Change Category&quot;.)');

    // Must NOT contain the Reset to All button
    expect(catContent).not.toContain('Reset to All');
  });

  it('9. recommendations engine must strictly isolate games by mainCategory when requested', () => {
    const vegRecs = getPersonalizedRecommendations({
      mainCategory: 'VEG',
      limit: 10,
    });
    expect(vegRecs.games.length).toBeGreaterThan(0);
    for (const g of vegRecs.games) {
      expect(g.mainCategory || 'VEG').toBe('VEG');
    }

    const nonVegRecs = getPersonalizedRecommendations({
      mainCategory: 'NON_VEG',
      limit: 10,
    });
    expect(nonVegRecs.games.length).toBeGreaterThan(0);
    for (const g of nonVegRecs.games) {
      expect(g.mainCategory).toBe('NON_VEG');
    }

    // Zero cross-leakage: No veg game in non-veg recommendations and vice-versa
    const vegIds = new Set(vegRecs.games.map((g: any) => g.id));
    for (const g of nonVegRecs.games) {
      expect(vegIds.has(g.id)).toBe(false);
    }
  });

  it('10. game detail page must enforce strictly isolated recommendations below the game player', () => {
    const fs = require('fs');
    const path = require('path');
    const gamePagePath = path.resolve(__dirname, '../src/app/game/[slug]/page.tsx');
    const gameContent = fs.readFileSync(gamePagePath, 'utf-8');

    // Must pass mainCategory to AdaptiveRecommendations
    expect(gameContent).toContain("mainCategory={isNonVeg ? 'NON_VEG' : 'VEG'}");
    expect(gameContent).toContain("title={isNonVeg ? `More Non-Veg Games Like ${game.title}` : `More Veg Games Like ${game.title}`}");
  });
});
