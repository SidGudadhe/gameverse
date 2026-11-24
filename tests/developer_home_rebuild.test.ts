import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Developer Homepage Rebuild & Studio Streams', () => {
  const devPagePath = path.join(process.cwd(), 'src/app/developer/page.tsx');
  const notifRoutePath = path.join(process.cwd(), 'src/app/api/developer/notifications/route.ts');
  const devContent = fs.readFileSync(devPagePath, 'utf8');
  const notifContent = fs.readFileSync(notifRoutePath, 'utf8');

  it('renders 3 compact top KPI metric boxes as specified', () => {
    // 1. Total Published Games (jo game website par live hai)
    expect(devContent).toContain('Total Published Games');
    expect(devContent).toContain('( Live on GameVerse )');

    // 2. Total games Playtime (0 hrs Across 0 verified player sessions)
    expect(devContent).toContain('Total Games Playtime');
    expect(devContent).toContain('Across');
    expect(devContent).toContain('verified player sessions');

    // 3. Total Revenue
    expect(devContent).toContain('Total Revenue');
    expect(devContent).toContain('IndianRupee');
  });

  it('features structured communication streams: Notice, Change / Update Request, and Growth Notifications', () => {
    // Notice stream
    expect(devContent).toContain('Notice');
    expect(devContent).toContain('Official Admin Notice');

    // Change / Update Request stream
    expect(devContent).toContain('Change / Update Request');
    expect(devContent).toContain('Admin Review Feedback & Action Required:');

    // Growth notifications stream
    expect(devContent).toContain('Growth Notifications');
  });

  it('provides interactive tab filters for the 3 streams', () => {
    expect(devContent).toContain("setActiveTab('ALL')");
    expect(devContent).toContain("setActiveTab('NOTICES')");
    expect(devContent).toContain("setActiveTab('CHANGE_REQUESTS')");
    expect(devContent).toContain("setActiveTab('GROWTH')");
  });

  it('notifications API returns structured admin notices, change requests, and growth alerts', () => {
    expect(notifContent).toContain('ADMIN_NOTICE');
    expect(notifContent).toContain('CHANGE_REQUESTED');
    expect(notifContent).toContain('BUILD_REJECTED');
    expect(notifContent).toContain('PLAYTIME_SPIKE');
    expect(notifContent).toContain('REVENUE_SPIKE');
    expect(notifContent).toContain('UPDATE_IMPACT');
  });

  it('ensures complete portal isolation with no direct player links or cookie settings', () => {
    // Should NOT link developers to /game/:slug
    expect(devContent).not.toMatch(/href=\{`\/game\/\$\{/);
    // Should link to /sandbox/
    expect(devContent).toContain('/sandbox/');
    // Should NOT have cookie setting buttons
    expect(devContent).not.toContain('Cookie Settings');
    expect(devContent).not.toContain('Cookie Preferences');
  });
});
