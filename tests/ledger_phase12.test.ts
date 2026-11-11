import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import {
  getCreatorPayoutSummary,
  requestPayout,
  generateMonthlySettlement,
  disbursePayoutBatch,
  getPlatformFinancialOverview,
  MINIMUM_PAYOUT_THRESHOLD,
} from '../src/lib/ledger';
import { GET as getDeveloperPayouts } from '../src/app/api/developer/payouts/route';
import { POST as requestDeveloperPayout } from '../src/app/api/developer/payouts/request/route';
import { GET as getAdminFinance } from '../src/app/api/admin/finance/route';
import { POST as settleAdminFinance } from '../src/app/api/admin/finance/settle/route';

describe('Phase 12: Earnings & Double-Entry Financial Ledger', () => {
  let devId: string;
  let otherDevId: string;
  let adminId: string;
  let devAuthHeader: string;
  let otherDevAuthHeader: string;
  let adminAuthHeader: string;
  let gameId: string;

  beforeEach(() => {
    devId = `usr-dev-p12-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    otherDevId = `usr-dev-other-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    adminId = `usr-admin-p12-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    gameId = `game-p12-${Date.now()}`;

    const devToken = generateToken({
      userId: devId,
      email: 'dev@ledger.com',
      role: 'DEVELOPER',
    });
    devAuthHeader = `Bearer ${devToken}`;

    const otherToken = generateToken({
      userId: otherDevId,
      email: 'other@ledger.com',
      role: 'DEVELOPER',
    });
    otherDevAuthHeader = `Bearer ${otherToken}`;

    const adminToken = generateToken({
      userId: adminId,
      email: 'admin@gameverse.com',
      role: 'ADMIN',
    });
    adminAuthHeader = `Bearer ${adminToken}`;

    // Configure developer settings with valid bank wire details
    gvDb.updateDeveloperSettings(devId, {
      payoutMethod: 'BANK_WIRE',
      payoutDetails: {
        accountHolder: 'Indie Studio Ltd',
        iban: 'GB29NWBK60161331926819',
        swift: 'NWBKGB2L',
      },
    });
  });

  it('1. Creates double-entry financial records and validates mathematical precision', () => {
    const record = gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Neon Odyssey',
      period: 'October 2026',
      grossRevenue: 100.0,
      deductions: 10.0,
      netRevenue: 90.0,
      creatorShare: 45.0, // 50% split
      status: 'FINALIZED',
    });

    expect(record.id).toBeDefined();
    expect(record.creatorId).toBe(devId);
    expect(record.grossRevenue).toBe(100.0);
    expect(record.deductions).toBe(10.0);
    expect(record.netRevenue).toBe(90.0);
    expect(record.creatorShare).toBe(45.0);
    expect(record.status).toBe('FINALIZED');

    const fetched = gvDb.getFinancialRecordById(record.id);
    expect(fetched).toBeDefined();
    expect(fetched?.gameTitle).toBe('Neon Odyssey');
  });

  it('2. Enforces $50.00 minimum payout threshold rules', () => {
    // Only $45 finalized: below $50 threshold
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Neon Odyssey',
      period: 'October 2026',
      grossRevenue: 100.0,
      deductions: 10.0,
      netRevenue: 90.0,
      creatorShare: 45.0,
      status: 'FINALIZED',
    });

    const summaryBelow = getCreatorPayoutSummary(devId);
    expect(summaryBelow.availableBalance).toBe(45.0);
    expect(summaryBelow.thresholdMet).toBe(false);
    expect(summaryBelow.thresholdProgress).toBe(90.0);

    const failRequest = requestPayout(devId);
    expect(failRequest.success).toBe(false);
    expect(failRequest.error).toContain('Minimum payout threshold of $50.00 not met');

    // Add another record bringing balance to $75 (above threshold)
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Neon Odyssey 2',
      period: 'October 2026',
      grossRevenue: 66.67,
      deductions: 6.67,
      netRevenue: 60.0,
      creatorShare: 30.0,
      status: 'FINALIZED',
    });

    const summaryAbove = getCreatorPayoutSummary(devId);
    expect(summaryAbove.availableBalance).toBe(75.0);
    expect(summaryAbove.thresholdMet).toBe(true);
    expect(summaryAbove.thresholdProgress).toBe(100);

    const successRequest = requestPayout(devId);
    expect(successRequest.success).toBe(true);
    expect(successRequest.amount).toBe(75.0);
    expect(successRequest.recordIds?.length).toBe(2);
    expect(successRequest.payoutReference).toBeDefined();

    // After payout request, records should transition to PROCESSING and available balance resets to 0
    const summaryAfter = getCreatorPayoutSummary(devId);
    expect(summaryAfter.availableBalance).toBe(0);
  });

  it('3. Rejects payout request if payout method is not configured', () => {
    // Other developer with unconfigured settings
    gvDb.updateDeveloperSettings(otherDevId, {
      payoutDetails: {},
    });

    gvDb.createFinancialRecord({
      creatorId: otherDevId,
      gameId,
      gameTitle: 'Voxel World',
      period: 'October 2026',
      grossRevenue: 200.0,
      deductions: 20.0,
      netRevenue: 180.0,
      creatorShare: 90.0,
      status: 'FINALIZED',
    });

    const reqResult = requestPayout(otherDevId);
    expect(reqResult.success).toBe(false);
    expect(reqResult.error).toContain('Payout method not configured');
  });

  it('4. Handles Net-30 monthly period settlement (ESTIMATED -> FINALIZED)', () => {
    // Seed estimated records for November 2026
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Cyber Blade',
      period: '2026-11',
      grossRevenue: 150.0,
      deductions: 15.0,
      netRevenue: 135.0,
      creatorShare: 67.5,
      status: 'ESTIMATED',
    });

    const summaryPre = getCreatorPayoutSummary(devId);
    expect(summaryPre.estimatedBalance).toBe(67.5);
    expect(summaryPre.availableBalance).toBe(0);

    // Run monthly settlement
    const settlement = generateMonthlySettlement('2026-11');
    expect(settlement.settledCount).toBeGreaterThanOrEqual(1);
    expect(settlement.totalSettledAmount).toBeGreaterThanOrEqual(67.5);

    // After settlement, estimated moves to finalized/available
    const summaryPost = getCreatorPayoutSummary(devId);
    expect(summaryPost.availableBalance).toBe(67.5);
    expect(summaryPost.estimatedBalance).toBe(0);
  });

  it('5. Disburses payout batch and transitions records to PAID', () => {
    const rec1 = gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Space Flight',
      period: 'September 2026',
      grossRevenue: 120.0,
      deductions: 12.0,
      netRevenue: 108.0,
      creatorShare: 54.0,
      status: 'PROCESSING',
    });

    const disburseResult = disbursePayoutBatch([rec1.id], 'BATCH_WIRE_2026_11');
    expect(disburseResult.success).toBe(true);
    expect(disburseResult.disbursedAmount).toBe(54.0);
    expect(disburseResult.recordsUpdated).toBe(1);

    const updated = gvDb.getFinancialRecordById(rec1.id);
    expect(updated?.status).toBe('PAID');
    expect(updated?.paidAt).toBeDefined();
    expect(updated?.payoutReference).toBe('BATCH_WIRE_2026_11');

    const summary = getCreatorPayoutSummary(devId);
    expect(summary.lifetimePaid).toBe(54.0);
  });

  it('6. Enforces tenant isolation in GET /api/developer/payouts', async () => {
    // Seed record for devId
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Dev Game A',
      period: 'October 2026',
      grossRevenue: 80.0,
      deductions: 8.0,
      netRevenue: 72.0,
      creatorShare: 36.0,
      status: 'FINALIZED',
    });

    // Seed record for otherDevId
    gvDb.createFinancialRecord({
      creatorId: otherDevId,
      gameId: 'game-other',
      gameTitle: 'Other Game B',
      period: 'October 2026',
      grossRevenue: 150.0,
      deductions: 15.0,
      netRevenue: 135.0,
      creatorShare: 67.5,
      status: 'FINALIZED',
    });

    // Request from devId
    const req = new NextRequest('http://localhost:3000/api/developer/payouts', {
      headers: { authorization: devAuthHeader },
    });
    const res = await getDeveloperPayouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.availableBalance).toBe(36.0);
    expect(data.records.every((r: any) => r.creatorId === devId)).toBe(true);
  });

  it('7. Handles POST /api/developer/payouts/request correctly', async () => {
    // Add record over threshold
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId,
      gameTitle: 'Major Hit',
      period: 'October 2026',
      grossRevenue: 200.0,
      deductions: 20.0,
      netRevenue: 180.0,
      creatorShare: 90.0,
      status: 'FINALIZED',
    });

    const req = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
    });

    const res = await requestDeveloperPayout(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.amount).toBe(90.0);
    expect(data.payoutReference).toBeDefined();
  });

  it('8. Enforces RBAC and executes settlement via Admin Finance APIs', async () => {
    // Developer trying to access Admin Finance API -> 403 Forbidden
    const devForbiddenReq = new NextRequest('http://localhost:3000/api/admin/finance', {
      headers: { authorization: devAuthHeader },
    });
    const devRes = await getAdminFinance(devForbiddenReq);
    expect(devRes.status).toBe(403);

    // Admin accessing Admin Finance API -> 200 OK
    const adminReq = new NextRequest('http://localhost:3000/api/admin/finance', {
      headers: { authorization: adminAuthHeader },
    });
    const adminRes = await getAdminFinance(adminReq);
    expect(adminRes.status).toBe(200);
    const financeData = await adminRes.json();
    expect(financeData.success).toBe(true);
    expect(financeData.overview).toBeDefined();
    expect(financeData.overview.totalGrossRevenue).toBeGreaterThanOrEqual(0);

    // Admin executing monthly settlement action
    const settleReq = new NextRequest('http://localhost:3000/api/admin/finance/settle', {
      method: 'POST',
      headers: {
        authorization: adminAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'FINALIZE_PERIOD',
        period: '2026-11',
      }),
    });
    const settleRes = await settleAdminFinance(settleReq);
    expect(settleRes.status).toBe(200);
    const settleData = await settleRes.json();
    expect(settleData.success).toBe(true);
    expect(settleData.action).toBe('FINALIZE_PERIOD');
  });
});
