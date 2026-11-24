import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as reportGame } from '../src/app/api/player/report/route';
import { gvDb } from '../src/lib/database';
import fs from 'fs';
import path from 'path';

describe('Player Website Game Flag & Report Modal Architecture', () => {
  it('1. should reject report request with 400 if game identifier is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Game Not Loading',
      }),
    });

    const res = await reportGame(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing game identifier');
  });

  it('2. should accept valid report and log audit event and technical ticket', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.195',
      },
      body: JSON.stringify({
        gameId: 'game-neon-runner',
        gameTitle: 'Neon Cyber Runner 2088',
        gameSlug: 'neon-runner',
        reason: 'Broken Controls',
        details: 'Jump key does not register on Firefox',
      }),
    });

    const res = await reportGame(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify audit log was recorded
    const auditLogs = gvDb.state.auditLogs || [];
    const reportAudit = auditLogs.find(
      (a) => a.action === 'GAME_REPORTED' && a.targetId === 'game-neon-runner'
    );
    expect(reportAudit).toBeDefined();
    expect(reportAudit?.details.reason).toBe('Broken Controls');
    expect(reportAudit?.details.details).toContain('Jump key');
    expect(reportAudit?.ipAddress).toBe('203.0.113.195');

    // Verify support ticket was created for the developer
    const tickets = gvDb.state.supportTickets || [];
    const bugTicket = tickets.find(
      (t) => t.category === 'TECHNICAL' && t.subject.includes('Broken Controls')
    );
    expect(bugTicket).toBeDefined();
    expect(bugTicket?.message).toContain('Jump key does not register');
  });

  it('3. should support all user requested issue reasons including Wrong Category', async () => {
    const reasons = [
      'Game Not Loading',
      'Broken Controls',
      'Wrong Category',
      'Game Crashing / Freezing',
      'Other Issue',
    ];

    for (const reason of reasons) {
      const req = new NextRequest('http://localhost:3000/api/player/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-cyber-carnage',
          gameTitle: 'Cyber Blood Carnage',
          gameSlug: 'cyber-carnage',
          reason,
          details: `Testing reason: ${reason}`,
        }),
      });

      const res = await reportGame(req);
      expect(res.status).toBe(200);
    }
  });

  it('4. GameActionBar must contain the flag button and GameReportModal with all requested options', () => {
    const actionBarPath = path.resolve(__dirname, '../src/components/GameActionBar.tsx');
    const modalPath = path.resolve(__dirname, '../src/components/GameReportModal.tsx');

    const actionBarContent = fs.readFileSync(actionBarPath, 'utf-8');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    // Action bar must include GameReportModal and Flag button
    expect(actionBarContent).toContain('GameReportModal');
    expect(actionBarContent).toContain('setIsReportOpen(true)');
    expect(actionBarContent).toContain('Flag');
    expect(actionBarContent).toContain('Reported');

    // Modal must include all the requested options
    expect(modalContent).toContain('Game Not Loading');
    expect(modalContent).toContain('Broken Controls');
    expect(modalContent).toContain('Wrong Category');
    expect(modalContent).toContain('Game Crashing / Freezing');
    expect(modalContent).toContain('Submit Report');
    expect(modalContent).toContain('Report Submitted!');
  });
});
