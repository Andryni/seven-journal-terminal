import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'green' | 'red' | 'neutral' | 'blue' | 'indigo';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
}) => {
  const variants = {
    gold: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    neutral: 'bg-[#20222c] border-[#262833] text-slate-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium tracking-wide ${variants[variant]}`}>
      {children}
    </span>
  );
};
