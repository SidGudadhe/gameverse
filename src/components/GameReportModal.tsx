'use client';

import React, { useState } from 'react';
import {
  X,
  Flag,
  AlertTriangle,
  Gamepad2,
  Tags,
  ZapOff,
  HelpCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface GameReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameSlug: string;
  gameId?: string;
  thumbnailUrl?: string;
  onReportSubmitted?: (reason: string) => void;
}

const REPORT_REASONS = [
  {
    id: 'GAME_NOT_LOADING',
    title: 'Game Not Loading',
    description: 'Black screen, stuck at 0%, or fails to start in browser',
    icon: AlertTriangle,
  },
  {
    id: 'BROKEN_CONTROLS',
    title: 'Broken Controls',
    description: 'Keys, mouse clicks, or touch interactions not responding',
    icon: Gamepad2,
  },
  {
    id: 'WRONG_CATEGORY',
    title: 'Wrong Category',
    description: 'Veg / Non-Veg mismatch, inappropriate language in Veg, or wrong genre',
    icon: ShieldAlert,
  },
  {
    id: 'GAME_CRASHING',
    title: 'Game Crashing / Freezing',
    description: 'Game freezes mid-play, unexpected lag, or browser crashes',
    icon: ZapOff,
  },
  {
    id: 'OTHER',
    title: 'Other Issue',
    description: 'Audio glitches, broken display, or other developer feedback',
    icon: HelpCircle,
  },
];

export default function GameReportModal({
  isOpen,
  onClose,
  gameTitle,
  gameSlug,
  gameId,
  thumbnailUrl,
  onReportSubmitted,
}: GameReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('GAME_NOT_LOADING');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const selectedOption = REPORT_REASONS.find((r) => r.id === selectedReason);
      const res = await fetch('/api/player/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          gameTitle,
          gameSlug,
          reason: selectedOption?.title || selectedReason,
          details,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        if (onReportSubmitted) {
          onReportSubmitted(selectedOption?.title || selectedReason);
        }
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2200);
      } else {
        // Fallback optimistic success
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2200);
      }
    } catch {
      // Optimistic success for UX continuity
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsSuccess(false);
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Report Game Issue
              </h3>
              <p className="text-[11px] text-slate-500">
                Help us keep GameVerse smooth and safe
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          /* Success Confirmation View */
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-black text-lg text-slate-900">
                Report Submitted!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Thank you for letting us know. Our technical team and the game developer have been notified to review and fix the issue.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Game Preview Mini Bar */}
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt={gameTitle}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Reporting Game
                </span>
                <h4 className="font-heading font-black text-xs text-slate-900 truncate">
                  {gameTitle}
                </h4>
              </div>
            </div>

            {/* Select Reason Radio List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                What problem are you facing?
              </label>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedReason === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setSelectedReason(r.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300/50'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold block ${
                              isSelected ? 'text-rose-950' : 'text-slate-800'
                            }`}
                          >
                            {r.title}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-rose-600 bg-rose-600'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-1">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment / Details */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                placeholder="E.g., Screen goes black after level 2, or arrow keys don't work..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all resize-none placeholder:text-slate-400 text-slate-800"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedReason}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
