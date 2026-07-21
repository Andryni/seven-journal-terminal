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
          <label className="text-xs font-semibold text-slate-400 group-focus-within:text-[#6366f1] transition-colors">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={[
            'bg-[#121318] border border-[#262833] rounded-xl px-3.5 py-2.5',
            'text-xs font-medium text-white placeholder-slate-500',
            'focus:outline-none focus:border-[#6366f1] input-focus-ring',
            'transition-colors duration-150',
            error ? 'border-red-500 focus:border-red-500' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
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
          <label className="text-xs font-semibold text-slate-400 group-focus-within:text-[#6366f1] transition-colors">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={[
              'w-full bg-[#121318] border border-[#262833] rounded-xl px-3.5 py-2.5',
              'text-xs font-medium text-white',
              'focus:outline-none focus:border-[#6366f1] input-focus-ring',
              'transition-colors duration-150 appearance-none cursor-pointer',
              'pr-9',
              error ? 'border-red-500' : '',
              className,
            ].join(' ')}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#181920]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <span className="text-xs text-red-400 animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
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
          <label className="text-xs font-semibold text-slate-400 group-focus-within:text-[#6366f1] transition-colors">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={[
            'bg-[#121318] border border-[#262833] rounded-xl px-3.5 py-2.5',
            'text-xs font-medium text-white placeholder-slate-500',
            'focus:outline-none focus:border-[#6366f1] input-focus-ring',
            'transition-colors duration-150 min-h-[85px] resize-y',
            error ? 'border-red-500' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
