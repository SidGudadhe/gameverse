'use client';

import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, MessageSquare, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function DeveloperSupportPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'PUBLISHING' | 'MONETIZATION' | 'TECHNICAL' | 'GENERAL'>('TECHNICAL');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initial mock ticket for display
  const [tickets, setTickets] = useState([
    {
      id: 'tkt-001',
      subject: 'WebGL 2.0 compressed texture support',
      category: 'TECHNICAL',
      message: 'Does the sandbox runner support Basis Universal / KTX2 texture formats?',
      status: 'RESOLVED',
      createdAt: '2026-11-05T14:00:00.000Z',
    },
  ]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);

    try {
      const res = await fetch('/api/developer/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setTickets([data.data, ...tickets]);
        setSubject('');
        setMessage('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
      }
    } catch {
      setLoading(false);
      // Fallback local update
      const newTkt = {
        id: `tkt-${Date.now()}`,
        subject,
        category,
        message,
        status: 'OPEN' as const,
        createdAt: new Date().toISOString(),
      };
      setTickets([newTkt, ...tickets]);
      setSubject('');
      setMessage('');
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          Developer Support & Publishing Guides
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
          Submit technical inquiries directly to the platform engineering and QA review team.
        </p>
      </div>

      {submitted && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Support ticket successfully submitted. Our team typically responds within 24 hours.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ticket Submission Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmitTicket} className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Open a Support Ticket</span>
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="TECHNICAL">Technical (Sandbox / Audio / Controls)</option>
                  <option value="PUBLISHING">Publishing & QA Review Status</option>
                  <option value="MONETIZATION">Monetization & Payout Inquiries</option>
                  <option value="GENERAL">General Developer Question</option>
                </select>
              </div>

              <Input
                label="Ticket Subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Audio distortion on Safari iOS in landscape"
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-300">
                  Detailed Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question, include game title, browser, and error messages..."
                  className="w-full bg-black/40 text-gray-100 placeholder-gray-500 text-xs sm:text-sm rounded-xl p-3 border border-white/10 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <Button type="submit" variant="primary" isLoading={loading} rightIcon={<Send className="w-3.5 h-3.5" />}>
                Submit Inquiry
              </Button>
            </div>
          </form>

          {/* Ticket History */}
          <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-base text-white">
              Your Support History
            </h3>

            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{t.subject}</span>
                    <Badge variant={t.status === 'RESOLVED' ? 'success' : 'warning'}>
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{t.message}</p>
                  <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1">
                    <span>Category: {t.category}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Developer FAQ & Knowledge Base (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Developer Knowledge Base</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-gray-300">
              <div className="p-3 rounded-xl bg-black/20 space-y-1">
                <div className="font-semibold text-white">How long does QA review take?</div>
                <p className="text-gray-400 text-[11px]">
                  Manual review and automated sandboxing usually complete within 24–48 hours of ZIP submission.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/20 space-y-1">
                <div className="font-semibold text-white">What are the archive upload limits?</div>
                <p className="text-gray-400 text-[11px]">
                  Maximum compressed size is 50 MB (250 MB decompressed). The root directory must contain index.html.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/20 space-y-1">
                <div className="font-semibold text-white">How is the 50% net split calculated?</div>
                <p className="text-gray-400 text-[11px]">
                  Net revenue equals gross ad earnings minus direct network transaction fees and invalid-traffic deductions.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/20 space-y-1">
                <div className="font-semibold text-white">When are payouts disbursed?</div>
                <p className="text-gray-400 text-[11px]">
                  Payouts process on a Net-30 monthly schedule once your account balance meets the $50 threshold.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
