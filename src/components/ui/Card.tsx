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
  animate = true,
}) => {
  return (
    <div
      className={[
        'bg-[#181920] border border-[#262833] rounded-xl flex flex-col',
        'transition-all duration-200 hover:border-[#363948]',
        animate ? 'animate-fade-in-up' : '',
        className,
      ].join(' ')}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-[#262833] px-5 py-3.5">
          {title && (
            <h3 className="text-xs uppercase font-bold text-slate-200 tracking-wider flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#6366f1] rounded-full shrink-0" />
              {title}
            </h3>
          )}
          {headerAction && (
            <div className="text-xs text-slate-400 hover:text-white transition-colors">
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
