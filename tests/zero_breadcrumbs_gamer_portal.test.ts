import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Zero Breadcrumbs Across All Gamer Portal Pages', () => {
  const pagesToCheck = [
    { name: 'Favorites', path: '../src/app/player/favorites/page.tsx' },
    { name: 'History', path: '../src/app/player/history/page.tsx' },
    { name: 'Payouts', path: '../src/app/player/payouts/page.tsx' },
    { name: 'Profile', path: '../src/app/player/profile/page.tsx' },
    { name: 'Game Slug', path: '../src/app/game/[slug]/page.tsx' },
    { name: 'Category Index', path: '../src/app/category/page.tsx' },
    { name: 'Category Slug', path: '../src/app/category/[slug]/page.tsx' },
  ];

  pagesToCheck.forEach(({ name, path: relPath }) => {
    it(`should not contain top breadcrumb navigation in ${name} page`, () => {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Must not contain breadcrumb Home link or breadcrumb slash
      expect(content).not.toContain('<span>Home</span>');
      expect(content).not.toContain('<span>Catalog Home</span>');
      expect(content).not.toContain('<span>/</span>');
      expect(content).not.toContain('Breadcrumb Navigation');
    });
  });
});
