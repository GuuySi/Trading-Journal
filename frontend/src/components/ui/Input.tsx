import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface-3 border rounded-lg px-3 py-2 text-zinc-100 text-sm',
            'placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:border-accent transition-colors',
            error
              ? 'border-loss focus:ring-loss'
              : 'border-border focus:ring-accent',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
        {!error && hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface-3 border rounded-lg px-3 py-2 text-zinc-100 text-sm',
            'focus:outline-none focus:ring-1 focus:border-accent transition-colors appearance-none',
            error
              ? 'border-loss focus:ring-loss'
              : 'border-border focus:ring-accent',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface-3 border rounded-lg px-3 py-2 text-zinc-100 text-sm',
            'placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:border-accent transition-colors resize-none',
            error
              ? 'border-loss focus:ring-loss'
              : 'border-border focus:ring-accent',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
