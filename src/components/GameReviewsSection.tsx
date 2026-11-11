'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ThumbsUp, ShieldCheck, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { GameReview } from '@/types';

interface GameReviewsSectionProps {
  gameSlug: string;
  gameId: string;
  initialRating?: number;
}

export default function GameReviewsSection({
  gameSlug,
  gameId,
  initialRating = 4.5,
}: GameReviewsSectionProps) {
  const [reviews, setReviews] = useState<GameReview[]>([]);
  const [averageRating, setAverageRating] = useState(initialRating);
  const [totalReviews, setTotalReviews] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/games/${gameSlug}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.averageRating) setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews || 0);
        if (data.breakdown) setBreakdown(data.breakdown);
      }
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [gameSlug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setSubmitError('Review commentary must be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/games/${gameSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setComment('');
        await fetchReviews();
        setTimeout(() => setSubmitSuccess(false), 4000);
      } else {
        setSubmitError(data.error || 'Failed to submit review.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/games/${gameSlug}/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r
          )
        );
      }
    } catch (e) {
      // Non-blocking
    }
  };

  return (
    <section className="bg-slate-900/60 rounded-2xl p-6 sm:p-8 border border-white/10 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-white flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span>Community Ratings & Reviews</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Real feedback from verified players who have explored this title.
          </p>
        </div>

        {/* Rating Overview Pill */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1 text-amber-400 font-black text-2xl font-mono">
            <Star className="w-6 h-6 fill-amber-400" />
            <span>{averageRating.toFixed(1)}</span>
          </div>
          <div className="text-[11px] text-gray-400 border-l border-white/10 pl-3">
            <div className="font-bold text-gray-200">{totalReviews} Reviews</div>
            <div>Community Verified</div>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="bg-[#0B0F19] rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Leave Your Rating & Review</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-normal">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Player badge active after 60s playtime</span>
          </span>
        </h3>

        <form onSubmit={handleSubmitReview} className="space-y-4">
          {/* Star Rating Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-2">Your Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      (hoverRating || userRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 ml-2">
              {hoverRating || userRating} / 5 Stars
            </span>
          </div>

          {/* Review Text Area */}
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your gameplay thoughts, mechanics feedback, or tips for other players (minimum 5 characters)..."
              rows={3}
              maxLength={1000}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Supports friendly community discussion</span>
              <span>{comment.length} / 1000</span>
            </div>
          </div>

          {/* Feedback messages */}
          {submitError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              {submitError}
            </p>
          )}

          {submitSuccess && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Your review was published successfully!</span>
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || comment.trim().length < 5}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-xs text-gray-500 py-6 text-center">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-400">No community reviews yet.</p>
            <p className="text-xs text-gray-500 mt-1">
              Be the first verified player to share your thoughts!
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#0B0F19] rounded-2xl p-5 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shrink-0">
                    <img
                      src={
                        rev.userAvatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.username}`
                      }
                      alt={rev.displayName}
                      className="w-full h-full rounded-full object-cover bg-black"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/player/${rev.username}`}
                        className="text-sm font-bold text-white hover:text-indigo-400 transition-colors"
                      >
                        {rev.displayName}
                      </Link>
                      <span className="text-xs text-gray-500">@{rev.username}</span>

                      {rev.isVerifiedPlayer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Player</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Helpful Upvote Button */}
                <button
                  onClick={() => handleVoteHelpful(rev.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 text-xs transition-colors active:scale-95 cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Helpful ({rev.helpfulCount || 0})</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pl-12">
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
