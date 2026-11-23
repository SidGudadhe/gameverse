import { describe, it, expect } from 'vitest';
import { gvDb } from '../src/lib/database';

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
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      gameUrl: '/games/voxel-quest/index.html',
      rating: 4.8,
      totalPlays: 10,
      tags: ['puzzle', 'family', 'veg'],
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
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      gameUrl: '/games/shadow-strike/index.html',
      rating: 4.9,
      totalPlays: 20,
      tags: ['action', 'intense', 'non-veg'],
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
});
