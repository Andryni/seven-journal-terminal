import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  ...props
}) => {
  const base = [
    'relative inline-flex items-center justify-center font-mono font-semibold uppercase tracking-widest',
    'rounded-none border transition-all duration-150 overflow-hidden',
    'disabled:opacity-40 disabled:pointer-events-none',
    'active:scale-[0.97] select-none',
    'btn-press',
  ].join(' ');

  const variants: Record<string, string> = {
    primary: [
      'bg-bloomberg-gold border-bloomberg-gold text-black',
      'hover:bg-bloomberg-gold-light hover:border-bloomberg-gold-light hover:shadow-gold-sm',
      'after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200',
    ].join(' '),

    secondary: [
      'bg-bloomberg-surface-2 border-bloomberg-border text-bloomberg-text-primary',
      'hover:border-bloomberg-border-bright hover:text-white',
    ].join(' '),

    danger: [
      'bg-transparent border-bloomberg-red text-bloomberg-red',
      'hover:bg-bloomberg-red hover:text-white hover:shadow-red-sm',
    ].join(' '),

    success: [
      'bg-transparent border-bloomberg-green text-bloomberg-green',
      'hover:bg-bloomberg-green hover:text-white hover:shadow-green-sm',
    ].join(' '),

    outline: [
      'bg-transparent border-bloomberg-border text-bloomberg-text-secondary',
      'hover:text-bloomberg-gold hover:border-bloomberg-gold/70 hover:bg-bloomberg-gold/5',
    ].join(' '),

    ghost: [
      'bg-transparent border-transparent text-bloomberg-text-secondary',
      'hover:text-white hover:bg-bloomberg-border/30',
    ].join(' '),
  };

  const sizes: Record<string, string> = {
    xs: 'text-[9px] px-2 py-0.5 gap-1',
    sm: 'text-[10px] px-2.5 py-1 gap-1.5',
    md: 'text-[10px] px-4 py-1.5 gap-2',
    lg: 'text-xs px-5 py-2.5 gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
          <span>CHARGEMENT...</span>
        </>
      ) : children}
    </button>
  );
};
