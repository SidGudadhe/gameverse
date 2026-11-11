import { gvDb } from './database';
import { FinancialLedgerRecord, FinancialLedgerStatus, PayoutSummary } from '../types';

export const MINIMUM_PAYOUT_THRESHOLD = 50.0;
export const PLATFORM_FEE_RATE = 0.1; // 10% platform hosting, network and delivery fee
export const NET_30_DAYS = 30;

/**
 * Compiles a creator's comprehensive financial summary and payout eligibility.
 */
export function getCreatorPayoutSummary(creatorId: string): PayoutSummary {
  const records = gvDb.getFinancialRecords({ creatorId });
  const settings = gvDb.getDeveloperSettings(creatorId);

  // Available Balance: Finalized records awaiting disbursement
  const availableRecords = records.filter((r) => r.status === 'FINALIZED');
  const availableBalance =
    Math.round(availableRecords.reduce((acc, r) => acc + r.creatorShare, 0) * 100) / 100;

  // Estimated Current MTD Balance
  const estimatedRecords = records.filter((r) => r.status === 'ESTIMATED');
  const estimatedBalance =
    Math.round(estimatedRecords.reduce((acc, r) => acc + r.creatorShare, 0) * 100) / 100;

  // Lifetime Disbursed Paid Amount
  const paidRecords = records.filter((r) => r.status === 'PAID');
  const lifetimePaid =
    Math.round(paidRecords.reduce((acc, r) => acc + r.creatorShare, 0) * 100) / 100;

  // Lifetime Gross Creator Share
  const lifetimeEarnings =
    Math.round(
      records
        .filter((r) => ['FINALIZED', 'PROCESSING', 'PAID'].includes(r.status))
        .reduce((acc, r) => acc + r.creatorShare, 0) * 100
    ) / 100;

  // Payout method configuration check
  const details = settings.payoutDetails || {};
  const isConfigured = Object.keys(details).length > 0 && Object.values(details).some((v) => !!v);

  const thresholdMet = availableBalance >= MINIMUM_PAYOUT_THRESHOLD;
  const thresholdProgress =
    availableBalance >= MINIMUM_PAYOUT_THRESHOLD
      ? 100
      : Math.round((availableBalance / MINIMUM_PAYOUT_THRESHOLD) * 1000) / 10;

  return {
    availableBalance,
    estimatedBalance,
    lifetimeEarnings,
    lifetimePaid,
    threshold: MINIMUM_PAYOUT_THRESHOLD,
    thresholdMet,
    thresholdProgress,
    payoutMethod: {
      method: settings.payoutMethod,
      details,
      isConfigured,
    },
  };
}

/**
 * Initiates a payout request for all eligible finalized earnings.
 * Enforces the $50 minimum threshold and payout configuration.
 */
export function requestPayout(creatorId: string): {
  success: boolean;
  amount?: number;
  recordIds?: string[];
  payoutReference?: string;
  error?: string;
} {
  const summary = getCreatorPayoutSummary(creatorId);

  if (!summary.payoutMethod?.isConfigured) {
    return {
      success: false,
      error: 'Payout method not configured. Please complete your payout details in Settings.',
    };
  }

  if (summary.availableBalance < MINIMUM_PAYOUT_THRESHOLD) {
    return {
      success: false,
      error: `Minimum payout threshold of $${MINIMUM_PAYOUT_THRESHOLD.toFixed(
        2
      )} not met. Available balance: $${summary.availableBalance.toFixed(2)}.`,
    };
  }

  const eligibleRecords = gvDb
    .getFinancialRecords({ creatorId })
    .filter((r) => r.status === 'FINALIZED');

  if (eligibleRecords.length === 0) {
    return {
      success: false,
      error: 'No finalized records eligible for payout.',
    };
  }

  const payoutReference = `po_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const recordIds: string[] = [];

  for (const record of eligibleRecords) {
    gvDb.updateFinancialRecord(record.id, {
      status: 'PROCESSING',
      payoutMethod: summary.payoutMethod.method,
      payoutReference,
    });
    recordIds.push(record.id);
  }

  return {
    success: true,
    amount: summary.availableBalance,
    recordIds,
    payoutReference,
  };
}

/**
 * Settles a period by transitioning ESTIMATED records to FINALIZED (Net-30 close).
 */
export function generateMonthlySettlement(
  period: string,
  finalizedAt = new Date().toISOString()
): {
  settledCount: number;
  totalSettledAmount: number;
} {
  const estimatedRecords = gvDb
    .getFinancialRecords()
    .filter((r) => r.period === period && r.status === 'ESTIMATED');

  let totalSettledAmount = 0;
  for (const record of estimatedRecords) {
    gvDb.updateFinancialRecord(record.id, {
      status: 'FINALIZED',
      finalizedAt,
    });
    totalSettledAmount += record.creatorShare;
  }

  return {
    settledCount: estimatedRecords.length,
    totalSettledAmount: Math.round(totalSettledAmount * 100) / 100,
  };
}

/**
 * Admin action to mark a batch of PROCESSING payout records as PAID.
 */
export function disbursePayoutBatch(
  recordIds: string[],
  payoutReference: string
): {
  success: boolean;
  disbursedAmount: number;
  recordsUpdated: number;
} {
  let disbursedAmount = 0;
  let recordsUpdated = 0;
  const now = new Date().toISOString();

  for (const id of recordIds) {
    const record = gvDb.getFinancialRecordById(id);
    if (record && (record.status === 'PROCESSING' || record.status === 'FINALIZED')) {
      gvDb.updateFinancialRecord(id, {
        status: 'PAID',
        paidAt: now,
        payoutReference: payoutReference || record.payoutReference,
      });
      disbursedAmount += record.creatorShare;
      recordsUpdated += 1;
    }
  }

  return {
    success: true,
    disbursedAmount: Math.round(disbursedAmount * 100) / 100,
    recordsUpdated,
  };
}

/**
 * Compiles a system-wide platform financial overview for admin operations.
 */
export function getPlatformFinancialOverview(): {
  totalGrossRevenue: number;
  platformDeductions: number;
  netRevenue: number;
  totalCreatorEarnings: number;
  totalPaidOut: number;
  pendingFinalized: number;
  estimatedUnfinalized: number;
  totalRecordsCount: number;
} {
  const records = gvDb.getFinancialRecords();

  let totalGrossRevenue = 0;
  let platformDeductions = 0;
  let netRevenue = 0;
  let totalCreatorEarnings = 0;
  let totalPaidOut = 0;
  let pendingFinalized = 0;
  let estimatedUnfinalized = 0;

  for (const r of records) {
    totalGrossRevenue += r.grossRevenue;
    platformDeductions += r.deductions;
    netRevenue += r.netRevenue;
    totalCreatorEarnings += r.creatorShare;

    if (r.status === 'PAID') {
      totalPaidOut += r.creatorShare;
    } else if (r.status === 'FINALIZED' || r.status === 'PROCESSING') {
      pendingFinalized += r.creatorShare;
    } else if (r.status === 'ESTIMATED') {
      estimatedUnfinalized += r.creatorShare;
    }
  }

  return {
    totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
    platformDeductions: Math.round(platformDeductions * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    totalCreatorEarnings: Math.round(totalCreatorEarnings * 100) / 100,
    totalPaidOut: Math.round(totalPaidOut * 100) / 100,
    pendingFinalized: Math.round(pendingFinalized * 100) / 100,
    estimatedUnfinalized: Math.round(estimatedUnfinalized * 100) / 100,
    totalRecordsCount: records.length,
  };
}
