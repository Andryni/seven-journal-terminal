import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full group">
        {label && (
          <label className="text-[9px] uppercase tracking-[0.14em] text-[#a0aec0] font-sans font-bold transition-colors duration-150 group-focus-within:text-[#0075ff]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={[
            'bg-[#0f143c]/40 border border-bloomberg-border rounded-xl px-3 py-2',
            'text-xs font-mono text-white placeholder-bloomberg-text-muted',
            'focus:outline-none focus:border-[#0075ff] input-focus-ring',
            'transition-colors duration-150',
            error ? 'border-bloomberg-red focus:border-bloomberg-red' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="text-[9px] text-bloomberg-red-light font-mono animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-bloomberg-red inline-block" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full group">
        {label && (
          <label className="text-[9px] uppercase tracking-[0.14em] text-[#a0aec0] font-sans font-bold transition-colors duration-150 group-focus-within:text-[#0075ff]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={[
              'w-full bg-[#0f143c]/40 border border-bloomberg-border rounded-xl px-3 py-2',
              'text-xs font-mono text-white',
              'focus:outline-none focus:border-[#0075ff] input-focus-ring',
              'transition-colors duration-150 appearance-none cursor-pointer',
              'pr-7',
              error ? 'border-bloomberg-red' : '',
              className,
            ].join(' ')}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0b0f29]">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-3 h-3 text-[#a0aec0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <span className="text-[9px] text-bloomberg-red-light font-mono animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-bloomberg-red inline-block" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full group">
        {label && (
          <label className="text-[9px] uppercase tracking-[0.14em] text-[#a0aec0] font-sans font-bold transition-colors duration-150 group-focus-within:text-[#0075ff]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={[
            'bg-[#0f143c]/40 border border-bloomberg-border rounded-xl px-3 py-2.5',
            'text-xs font-mono text-white placeholder-bloomberg-text-muted',
            'focus:outline-none focus:border-[#0075ff] input-focus-ring',
            'transition-colors duration-150 min-h-[80px] resize-y',
            error ? 'border-bloomberg-red' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="text-[9px] text-bloomberg-red-light font-mono animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-bloomberg-red inline-block" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
