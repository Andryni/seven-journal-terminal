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
    'relative inline-flex items-center justify-center font-sans font-bold uppercase tracking-wider',
    'rounded-xl border transition-all duration-300 overflow-hidden',
    'disabled:opacity-40 disabled:pointer-events-none',
    'active:scale-[0.96] select-none',
    'btn-press',
  ].join(' ');

  const variants: Record<string, string> = {
    primary: [
      'bg-[#0075ff] border-[#0075ff] text-white',
      'hover:bg-[#0066de] hover:border-[#0066de] hover:shadow-gold-md',
    ].join(' '),

    secondary: [
      'bg-[#0f143c] border-bloomberg-border text-[#a0aec0]',
      'hover:border-bloomberg-border-bright hover:text-white hover:bg-[#151c54]',
    ].join(' '),

    danger: [
      'bg-transparent border-bloomberg-red text-bloomberg-red',
      'hover:bg-bloomberg-red hover:text-white hover:shadow-red-sm',
    ].join(' '),

    success: [
      'bg-transparent border-[#01b574] text-[#01b574]',
      'hover:bg-[#01b574] hover:text-white hover:shadow-green-sm',
    ].join(' '),

    outline: [
      'bg-transparent border-bloomberg-border text-bloomberg-text-secondary',
      'hover:text-white hover:border-[#0075ff] hover:bg-[#0075ff]/10',
    ].join(' '),

    ghost: [
      'bg-transparent border-transparent text-[#a0aec0]',
      'hover:text-white hover:bg-white/5',
    ].join(' '),
  };

  const sizes: Record<string, string> = {
    xs: 'text-[9px] px-2 py-0.5 gap-1',
    sm: 'text-[10px] px-3 py-1 gap-1.5',
    md: 'text-[10px] px-4 py-2 gap-2',
    lg: 'text-xs px-5 py-3 gap-2',
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
