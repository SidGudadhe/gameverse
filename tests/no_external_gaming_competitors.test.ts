import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Zero External Browser Gaming Competitor Names Guarantee (100x Deep Audit)', () => {
  const rootDir = process.cwd();
  const FORBIDDEN_COMPETITOR_PATTERNS = [
    /\bpoki\b/i,
    /crazy\s*games?/i,
    /\by8\b/i,
    /itch\.io/i,
    /armorgames?/i,
    /miniclip/i,
    /newgrounds/i,
    /\bkizi\b/i,
    /coolmath(games)?/i,
    /\bfriv\b/i,
    /kongregate/i,
    /gamepix/i,
    /addictinggames?/i,
    /now\.gg/i,
    /snokido/i,
    /plonga/i,
  ];

  function getAllCodeFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'browser_evidence' || file === 'public') {
        continue;
      }
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getAllCodeFiles(fullPath, fileList);
      } else if (/\.(tsx?|jsx?|md|json)$/i.test(file)) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  it('1. should verify zero competitor gaming website names across all src/ files', () => {
    const srcFiles = getAllCodeFiles(path.join(rootDir, 'src'));
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of FORBIDDEN_COMPETITOR_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(rootDir, file),
              line: index + 1,
              match: line.trim(),
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('2. should verify zero competitor gaming website names across UI documentation and design system', () => {
    const docFiles = [
      path.join(rootDir, 'UI_UX_DESIGN_SYSTEM.md'),
      path.join(rootDir, 'PHASE_COMPLETION_REPORTS/PHASE_HOSTING_1_REPORT.md'),
    ];

    const violations: { file: string; match: string }[] = [];
    for (const file of docFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of FORBIDDEN_COMPETITOR_PATTERNS) {
          if (pattern.test(content)) {
            violations.push({
              file: path.relative(rootDir, file),
              match: pattern.source,
            });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('3. should verify PlayerAuthModal is properly named without legacy competitor names', () => {
    const modalPath = path.join(rootDir, 'src/components/PlayerAuthModal.tsx');
    expect(fs.existsSync(modalPath)).toBe(true);

    const layoutPath = path.join(rootDir, 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    expect(layoutContent).toContain('PlayerAuthModal');
    expect(layoutContent).not.toContain('CrazyGamesAuthModal');
  });
});
