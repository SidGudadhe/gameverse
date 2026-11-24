'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Share2, Flag } from 'lucide-react';
import SocialShareModal from './SocialShareModal';
import GameReportModal from './GameReportModal';
import { useAuth } from '@/context/AuthContext';

interface GameActionBarProps {
  gameTitle: string;
  gameSlug: string;
  gameId?: string;
  referralToken: string;
  thumbnailUrl?: string;
}

export default function GameActionBar({
  gameTitle,
  gameSlug,
  gameId,
  referralToken,
  thumbnailUrl,
}: GameActionBarProps) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!gameId || !isAuthenticated) return;
    fetch(`/api/player/favorites/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.isFavorited !== undefined) {
          setIsFavorited(data.isFavorited);
        }
      })
      .catch(() => {});
  }, [gameId, isAuthenticated]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      openAuthModal('LOGIN');
      return;
    }
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    if (!gameId) return;

    try {
      if (nextState) {
        await fetch('/api/player/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId }),
        });
      } else {
        await fetch(`/api/player/favorites/${gameId}`, {
          method: 'DELETE',
        });
      }
    } catch {
      // Non-blocking
    }
  };

  return (
    <>
      <div className="flex items-center gap-2.5 w-full md:w-auto">
        <button
          onClick={handleFavorite}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
            isFavorited
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
          <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
        </button>

        <button
          onClick={() => setIsShareOpen(true)}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-indigo-600" />
          <span>Share Game</span>
        </button>

        <button
          onClick={() => setIsReportOpen(true)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
            reported
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
          }`}
          title="Report build or content issue"
          aria-label="Report Game Issue"
        >
          <Flag className={`w-4 h-4 ${reported ? 'fill-rose-500 text-rose-600' : ''}`} />
          {reported && <span className="text-[11px] font-bold text-rose-700">Reported</span>}
        </button>
      </div>

      <SocialShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        gameTitle={gameTitle}
        gameSlug={gameSlug}
        referralToken={referralToken}
        thumbnailUrl={thumbnailUrl}
      />

      <GameReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        gameTitle={gameTitle}
        gameSlug={gameSlug}
        gameId={gameId}
        thumbnailUrl={thumbnailUrl}
        onReportSubmitted={() => {
          setReported(true);
        }}
      />
    </>
  );
}
