import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'green' | 'red' | 'neutral' | 'blue';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
}) => {
  const variants = {
    gold: 'bg-bloomberg-gold/10 border-bloomberg-gold text-bloomberg-gold-light',
    green: 'bg-bloomberg-green/10 border-bloomberg-green text-bloomberg-green-light',
    red: 'bg-bloomberg-red/10 border-bloomberg-red text-bloomberg-red-light',
    neutral: 'bg-bloomberg-border/20 border-bloomberg-border text-bloomberg-text-secondary',
    blue: 'bg-blue-900/20 border-blue-600 text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-[10px] uppercase font-mono tracking-wider font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};
