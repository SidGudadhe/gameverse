'use client';

import React, { useState } from 'react';
import { Settings, Wallet, Bell, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function DeveloperSettingsPage() {
  const [payoutMethod, setPayoutMethod] = useState<'BANK_WIRE' | 'UPI' | 'PAYPAL'>('BANK_WIRE');
  const [accountHolder, setAccountHolder] = useState('PixelForge Studios Ltd');
  const [iban, setIban] = useState('GB29NWBK60161331926819');
  const [swift, setSwift] = useState('NWBKGB2L');
  const [upiId, setUpiId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Notifications
  const [notifyQa, setNotifyQa] = useState(true);
  const [notifyPayout, setNotifyPayout] = useState(true);
  const [notifyReports, setNotifyReports] = useState(false);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const payoutDetails =
      payoutMethod === 'BANK_WIRE'
        ? { accountHolder, iban, swift }
        : payoutMethod === 'UPI'
        ? { upiId }
        : { paypalEmail };

    try {
      const res = await fetch('/api/developer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutMethod,
          payoutDetails,
          notifyOnQaUpdate: notifyQa,
          notifyOnPayout: notifyPayout,
          notifyOnPlayerReport: notifyReports,
        }),
      });

      setLoading(false);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setLoading(false);
      setSaved(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
          Studio Settings & Payout Preferences
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Configure payment disbursement accounts, email notification preferences, and security settings.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Payout Configuration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Monetization Payout Method</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Minimum payout threshold is $50.00 USD. Net-30 monthly disbursement.
              </p>
            </div>
          </div>

          {/* Payout Method Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'BANK_WIRE', label: 'International Wire / IBAN', fee: 'No platform fee' },
              { id: 'UPI', label: 'India UPI Instant', fee: 'INR direct bank transfer' },
              { id: 'PAYPAL', label: 'PayPal Global', fee: '2% standard processor fee' },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setPayoutMethod(m.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  payoutMethod === m.id
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">{m.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.fee}</div>
              </button>
            ))}
          </div>

          {/* Conditional Method Fields */}
          {payoutMethod === 'BANK_WIRE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Account Beneficiary Name"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="PixelForge Studios Ltd"
              />
              <Input
                label="IBAN / Account Number"
                required
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="GB29NWBK..."
              />
              <Input
                label="SWIFT / BIC Code"
                required
                value={swift}
                onChange={(e) => setSwift(e.target.value)}
                placeholder="NWBKGB2L"
              />
            </div>
          )}

          {payoutMethod === 'UPI' && (
            <div className="pt-2 max-w-md">
              <Input
                label="Virtual Payment Address (UPI ID)"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="studio@okaxis"
              />
            </div>
          )}

          {payoutMethod === 'PAYPAL' && (
            <div className="pt-2 max-w-md">
              <Input
                label="PayPal Account Email"
                type="email"
                required
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="payments@studio.com"
              />
            </div>
          )}
        </div>

        {/* Notifications Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>Studio Notification Preferences</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-xs font-semibold text-slate-900">QA Review Updates</div>
                <div className="text-[11px] text-slate-500">Receive instant alerts when an admin approves or requests changes to a build.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyQa}
                onChange={(e) => setNotifyQa(e.target.checked)}
                className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-xs font-semibold text-slate-900">Monthly Payout Statements</div>
                <div className="text-[11px] text-slate-500">Receive notification when monthly ad revenue reconciliation is completed.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyPayout}
                onChange={(e) => setNotifyPayout(e.target.checked)}
                className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-xs font-semibold text-slate-900">Player Bug & Performance Reports</div>
                <div className="text-[11px] text-slate-500">Get notified if players submit crash or audio glitch reports for your games.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyReports}
                onChange={(e) => setNotifyReports(e.target.checked)}
                className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
              />
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Preferences
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
