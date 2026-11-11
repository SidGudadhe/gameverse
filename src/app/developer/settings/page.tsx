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
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          Studio Settings & Payout Preferences
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
          Configure payment disbursement accounts, email notification preferences, and security settings.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Payout Configuration Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Monetization Payout Method</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Minimum payout threshold is $50.00 USD. Net-30 monthly disbursement.
              </p>
            </div>
          </div>

          {/* Payout Method Selector */}
          <div className="grid grid-cols-3 gap-3">
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
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs text-white">{m.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{m.fee}</div>
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
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <span>Studio Notification Preferences</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/5 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">QA Review Updates</div>
                <div className="text-[11px] text-gray-400">Receive instant alerts when an admin approves or requests changes to a build.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyQa}
                onChange={(e) => setNotifyQa(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/5 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Monthly Payout Statements</div>
                <div className="text-[11px] text-gray-400">Receive notification when monthly ad revenue reconciliation is completed.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyPayout}
                onChange={(e) => setNotifyPayout(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/5 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Player Bug & Performance Reports</div>
                <div className="text-[11px] text-gray-400">Get notified if players submit crash or audio glitch reports for your games.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyReports}
                onChange={(e) => setNotifyReports(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
              />
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Preferences
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
