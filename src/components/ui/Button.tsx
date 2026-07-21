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
    'relative inline-flex items-center justify-center font-sans font-semibold tracking-wide',
    'rounded-xl border transition-all duration-200 overflow-hidden',
    'disabled:opacity-40 disabled:pointer-events-none',
    'btn-press select-none cursor-pointer',
  ].join(' ');

  const variants: Record<string, string> = {
    primary: [
      'bg-[#6366f1] border-[#6366f1] text-white',
      'hover:bg-[#4f46e5] hover:border-[#4f46e5] hover:shadow-indigo-glow',
    ].join(' '),

    secondary: [
      'bg-[#1e2029] border-[#262833] text-slate-300',
      'hover:border-[#363948] hover:text-white hover:bg-[#262833]',
    ].join(' '),

    danger: [
      'bg-red-500/10 border-red-500/30 text-red-400',
      'hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-red-glow',
    ].join(' '),

    success: [
      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      'hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-green-glow',
    ].join(' '),

    outline: [
      'bg-transparent border-[#262833] text-slate-300',
      'hover:text-white hover:border-[#6366f1] hover:bg-[#6366f1]/10',
    ].join(' '),

    ghost: [
      'bg-transparent border-transparent text-slate-400',
      'hover:text-white hover:bg-white/5',
    ].join(' '),
  };

  const sizes: Record<string, string> = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Chargement...</span>
        </>
      ) : children}
    </button>
  );
};
