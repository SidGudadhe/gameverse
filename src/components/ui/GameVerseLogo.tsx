'use client';

import React from 'react';
import Link from 'next/link';

export interface GameVerseLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  href?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 rounded-lg',
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-14 h-14 rounded-2xl',
  '2xl': 'w-16 h-16 rounded-3xl',
};

const textSizeClasses = {
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-2xl sm:text-3xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
};

export default function GameVerseLogo({
  size = 'md',
  showText = false,
  textClassName = '',
  subtitle,
  href,
  className = '',
}: GameVerseLogoProps) {
  const iconNode = (
    <div
      className={`relative ${sizeClasses[size]} overflow-hidden shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300 shrink-0 bg-slate-950 ${className}`}
    >
      <img
        src="/logo.jpg"
        alt="GameVerse Official G Gaming Logo"
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );

  const fullContent = (
    <div className="flex items-center gap-3 group">
      {iconNode}
      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-heading font-black tracking-wider text-slate-900 leading-tight ${
              textSizeClasses[size]
            } ${textClassName}`}
          >
            GAME<span className="text-indigo-600">VERSE</span>
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 block -mt-0.5 tracking-wider uppercase font-semibold">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group cursor-pointer focus:outline-none">
        {fullContent}
      </Link>
    );
  }

  return showText ? fullContent : iconNode;
}
