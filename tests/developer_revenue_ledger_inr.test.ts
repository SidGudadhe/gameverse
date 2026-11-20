import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { getCreatorPayoutSummary } from '../src/lib/ledger';
import { GET as getDeveloperPayouts } from '../src/app/api/developer/payouts/route';
import { POST as requestDeveloperPayout } from '../src/app/api/developer/payouts/request/route';

describe('Developer Revenue Ledger 100x Rebuild & INR Currency Enforcement', () => {
  let devId: string;
  let devAuthHeader: string;

  beforeEach(() => {
    devId = `usr-dev-inr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const devToken = generateToken({
      userId: devId,
      email: 'creator@pixelstudio.com',
      role: 'DEVELOPER',
    });
    devAuthHeader = `Bearer ${devToken}`;

    // Seed developer settings with Bank Wire + UPI and studioVerified = true
    gvDb.updateDeveloperSettings(devId, {
      payoutMethod: 'BANK_AND_UPI',
      currency: 'INR',
      studioVerified: true,
      bankAccount: {
        accountNumber: '918273645012',
        ifscCode: 'HDFC0001234',
        beneficiaryName: 'PixelForge Studios Pvt Ltd',
        bankName: 'HDFC Bank',
      },
      upi: {
        upiId: 'pixelforge@okhdfcbank',
        beneficiaryName: 'PixelForge Studios',
      },
    });
  });

  it('1. Retrieves available balance and timeframe analytics in Indian Rupees (INR)', async () => {
    // Seed finalized record
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId: 'game-neon-runner',
      gameTitle: 'Neon Cyber Runner 2088',
      period: 'October 2026',
      grossRevenue: 24500.0,
      deductions: 2450.0,
      netRevenue: 22050.0,
      creatorShare: 18500.0,
      currency: 'INR',
      status: 'FINALIZED',
    });

    const summary = getCreatorPayoutSummary(devId);
    expect(summary.availableBalance).toBe(18500.0);
    expect(summary.currency).toBe('INR');
    expect(summary.studioVerified).toBe(true);
    expect(summary.payoutMethod?.bankAccount?.accountNumber).toBe('918273645012');
    expect(summary.payoutMethod?.upi?.upiId).toBe('pixelforge@okhdfcbank');

    const req = new NextRequest('http://localhost:3000/api/developer/payouts', {
      headers: { authorization: devAuthHeader },
    });
    const res = await getDeveloperPayouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.currency).toBe('INR');
    expect(data.summary.availableBalance).toBe(18500.0);
    expect(data.timeframeRevenue).toBeDefined();
    expect(data.settings.bankAccount.bankName).toBe('HDFC Bank');
    expect(data.settings.upi.upiId).toBe('pixelforge@okhdfcbank');
  });

  it('2. Connects and saves both Indian Bank Account and UPI destination (BANK WIRE + UPI)', async () => {
    const saveReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'SAVE_BANK_AND_UPI',
        bankAccount: {
          accountNumber: '50100223344556',
          ifscCode: 'ICIC0000001',
          beneficiaryName: 'Indie Game Studio India',
          bankName: 'ICICI Bank',
        },
        upi: {
          upiId: 'indiegame@icici',
          beneficiaryName: 'Indie Game Studio',
        },
      }),
    });

    const res = await requestDeveloperPayout(saveReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.settings.bankAccount.accountNumber).toBe('50100223344556');
    expect(data.settings.bankAccount.ifscCode).toBe('ICIC0000001');
    expect(data.settings.upi.upiId).toBe('indiegame@icici');
  });

  it('3. Strictly enforces Studio Verification rule: Unverified studio cannot withdraw or earn (not verified me earning nhi hogi)', async () => {
    // 1. Toggle studio verification to FALSE
    const toggleReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'TOGGLE_VERIFICATION',
        studioVerified: false,
      }),
    });
    const toggleRes = await requestDeveloperPayout(toggleReq);
    expect(toggleRes.status).toBe(200);
    const toggleData = await toggleRes.json();
    expect(toggleData.studioVerified).toBe(false);

    // 2. Add finalized funds
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId: 'game-neon-runner',
      gameTitle: 'Neon Cyber Runner 2088',
      period: 'October 2026',
      grossRevenue: 5000.0,
      deductions: 500.0,
      netRevenue: 4500.0,
      creatorShare: 4500.0,
      currency: 'INR',
      status: 'FINALIZED',
    });

    // 3. Attempt withdrawal while studio is unverified -> MUST BE BLOCKED
    const withdrawReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'REQUEST_PAYOUT',
        amount: 2000,
        payoutMethod: 'BANK_WIRE',
      }),
    });
    const withdrawRes = await requestDeveloperPayout(withdrawReq);
    expect(withdrawRes.status).toBe(400);
    const withdrawData = await withdrawRes.json();
    expect(withdrawData.error).toContain('Studio Verification Required');

    // 4. Re-verify studio
    const verifyReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'TOGGLE_VERIFICATION',
        studioVerified: true,
      }),
    });
    const verifyRes = await requestDeveloperPayout(verifyReq);
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.studioVerified).toBe(true);

    // 5. Withdrawal now succeeds!
    const validWithdrawReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'REQUEST_PAYOUT',
        amount: 2000,
        payoutMethod: 'BANK_WIRE',
      }),
    });
    const validWithdrawRes = await requestDeveloperPayout(validWithdrawReq);
    expect(validWithdrawRes.status).toBe(200);
    const validWithdrawData = await validWithdrawRes.json();
    expect(validWithdrawData.success).toBe(true);
    expect(validWithdrawData.amount).toBe(2000);
    expect(validWithdrawData.message).toContain('₹2,000.00');
  });

  it('4. Classifies and returns withdrawal history with exactly SUCCESS, PENDING, and REJECT statuses', async () => {
    // 1. Success record (Paid)
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId: 'all-titles',
      gameTitle: 'Studio Creator Revenue Distribution',
      period: 'October 2026',
      grossRevenue: 12500.0,
      deductions: 0,
      netRevenue: 12500.0,
      creatorShare: 12500.0,
      currency: 'INR',
      status: 'SUCCESS',
      payoutMethod: 'BANK_WIRE',
      payoutReference: 'UTR-HDFC-9928172601',
    });

    // 2. Pending record (In Review)
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId: 'all-titles',
      gameTitle: 'Studio Creator Revenue Distribution',
      period: 'November 2026',
      grossRevenue: 3500.0,
      deductions: 0,
      netRevenue: 3500.0,
      creatorShare: 3500.0,
      currency: 'INR',
      status: 'PENDING',
      payoutMethod: 'UPI',
      payoutReference: 'UPI-AXIS-8827361902',
    });

    // 3. Reject record (Declined with reason)
    gvDb.createFinancialRecord({
      creatorId: devId,
      gameId: 'all-titles',
      gameTitle: 'Studio Creator Revenue Distribution',
      period: 'September 2026',
      grossRevenue: 1500.0,
      deductions: 0,
      netRevenue: 1500.0,
      creatorShare: 1500.0,
      currency: 'INR',
      status: 'REJECT',
      payoutMethod: 'BANK_WIRE',
      payoutReference: 'PO-DEV-REJ-44102',
      rejectionReason: 'Invalid IFSC code verification failed with destination branch',
    });

    const req = new NextRequest('http://localhost:3000/api/developer/payouts', {
      headers: { authorization: devAuthHeader },
    });
    const res = await getDeveloperPayouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    const records = data.records;

    const hasSuccess = records.some((r: any) => r.status === 'SUCCESS' && r.payoutReference === 'UTR-HDFC-9928172601');
    const hasPending = records.some((r: any) => r.status === 'PENDING' && r.payoutReference === 'UPI-AXIS-8827361902');
    const hasReject = records.some(
      (r: any) =>
        r.status === 'REJECT' &&
        r.rejectionReason === 'Invalid IFSC code verification failed with destination branch'
    );

    expect(hasSuccess).toBe(true);
    expect(hasPending).toBe(true);
    expect(hasReject).toBe(true);
  });
});
