'use client';

import React, { useState } from 'react';
import { Heart, Share2, Flag } from 'lucide-react';
import SocialShareModal from './SocialShareModal';

interface GameActionBarProps {
  gameTitle: string;
  gameSlug: string;
  referralToken: string;
  thumbnailUrl?: string;
}

export default function GameActionBar({
  gameTitle,
  gameSlug,
  referralToken,
  thumbnailUrl,
}: GameActionBarProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reported, setReported] = useState(false);

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 3000);
  };

  return (
    <>
      <div className="flex items-center gap-2.5 w-full md:w-auto">
        <button
          onClick={handleFavorite}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${
            isFavorited
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-elevated hover:bg-white/10 text-gray-200 hover:text-white border-white/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
          <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
        </button>

        <button
          onClick={() => setIsShareOpen(true)}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600/30 to-cyan-500/30 hover:from-indigo-600/40 hover:to-cyan-500/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Share2 className="w-4 h-4 text-cyan-400" />
          <span>Share & Refer</span>
        </button>

        <button
          onClick={handleReport}
          className={`p-2.5 rounded-xl border transition-colors ${
            reported
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-elevated hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border-white/10'
          }`}
          title="Report build or content issue"
        >
          <Flag className="w-4 h-4" />
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
    </>
  );
}
