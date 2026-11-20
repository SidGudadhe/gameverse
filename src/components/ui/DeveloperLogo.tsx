'use client';

import React from 'react';
import Link from 'next/link';

export interface DeveloperLogoProps {
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
  '2xl': 'w-20 h-20 rounded-3xl',
};

const textSizeClasses = {
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl sm:text-3xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
};

export default function DeveloperLogo({
  size = 'md',
  showText = false,
  textClassName = '',
  subtitle,
  href,
  className = '',
}: DeveloperLogoProps) {
  const iconNode = (
    <div
      className={`relative ${sizeClasses[size]} overflow-hidden shadow-md shadow-purple-600/30 border border-purple-500/25 group-hover:scale-105 transition-all duration-300 shrink-0 bg-black flex items-center justify-center ${className}`}
    >
      <img
        src="/developer-logo.png"
        alt="GameVerse Developer Studio Logo"
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
            GAMEVERSE <span className="text-purple-600">STUDIO</span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-mono text-purple-700 block -mt-0.5 tracking-widest uppercase font-semibold">
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
