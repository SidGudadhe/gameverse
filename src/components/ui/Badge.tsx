import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'featured' | 'success' | 'warning' | 'danger' | 'cyan' | 'engine';
  size?: 'sm' | 'md';
}

export function Badge({
  className = '',
  variant = 'default',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    default: 'bg-white/10 text-gray-300 border-white/10',
    featured: 'bg-indigo-600/90 text-white border-indigo-400/40 shadow-sm shadow-indigo-600/30 font-bold uppercase',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-mono',
    engine: 'bg-black/60 backdrop-blur-md text-cyan-300 border-cyan-500/30 font-mono',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-medium select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
