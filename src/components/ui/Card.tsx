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
    gold:  'before:bg-gradient-to-r before:from-transparent before:via-[#0075ff]/40 before:to-transparent',
    green: 'before:bg-gradient-to-r before:from-transparent before:via-bloomberg-green/40 before:to-transparent',
    red:   'before:bg-gradient-to-r before:from-transparent before:via-bloomberg-red/40 before:to-transparent',
    none:  '',
  };

  return (
    <div
      className={[
        'relative glass-panel rounded-[20px] flex flex-col',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold-sm hover:border-[#0075ff]/20',
        'before:absolute before:top-0 before:left-5 before:right-5 before:h-px before:content-[""] before:pointer-events-none',
        accent !== 'none' ? accentMap[accent] : '',
        animate ? 'animate-fade-in-up' : '',
        className,
      ].join(' ')}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-[#ffffff]/5 px-5 py-3">
          {title && (
            <h3 className="text-[10px] uppercase font-bold text-white tracking-[0.15em] flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#0075ff] rounded-full opacity-90 shrink-0" />
              {title}
            </h3>
          )}
          {headerAction && (
            <div className="text-xs opacity-75 hover:opacity-100 transition-opacity">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  );
};
