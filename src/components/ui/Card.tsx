import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  accent?: 'gold' | 'green' | 'red' | 'none';
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  headerAction,
  className = '',
  accent = 'gold',
  animate = true,
}) => {
  const accentMap = {
    gold:  'before:bg-gradient-to-r before:from-transparent before:via-bloomberg-gold/50 before:to-transparent',
    green: 'before:bg-gradient-to-r before:from-transparent before:via-bloomberg-green/50 before:to-transparent',
    red:   'before:bg-gradient-to-r before:from-transparent before:via-bloomberg-red/50 before:to-transparent',
    none:  '',
  };

  return (
    <div
      className={[
        'relative bg-bloomberg-surface border border-bloomberg-border rounded-none flex flex-col',
        'transition-all duration-200 hover:border-bloomberg-border-bright hover:shadow-inner-dark',
        // Top accent line via pseudo-element fallback using gradient border-top trick
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:content-[""] before:pointer-events-none',
        accent !== 'none' ? accentMap[accent] : '',
        animate ? 'animate-fade-in' : '',
        className,
      ].join(' ')}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-bloomberg-border px-4 py-2.5">
          {title && (
            <h3 className="text-[10px] uppercase font-bold text-bloomberg-gold tracking-[0.15em] flex items-center gap-2">
              <span className="w-1 h-3 bg-bloomberg-gold rounded-full opacity-80 shrink-0" />
              {title}
            </h3>
          )}
          {headerAction && (
            <div className="text-xs opacity-70 hover:opacity-100 transition-opacity">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
};
