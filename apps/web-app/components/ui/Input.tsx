import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftIcon, rightIcon, className, value, ...props }, ref) => {
        // Convert null/undefined to empty string to prevent React warning about controlled/uncontrolled
        const safeValue = value == null ? '' : value;
        
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-[var(--primary)] mb-2">
                        {label}
                        {props.required && <span className="text-[var(--error)] ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={clsx(
                            'w-full px-4 py-3 border-2 transition-all duration-200',
                            'focus:outline-none focus:border-[var(--accent)] focus:ring-0',
                            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-[var(--text-muted)]',
                            'placeholder:text-[var(--text-muted)]',
                            error
                                ? 'border-[var(--error)] focus:border-[var(--error)]'
                                : 'border-[var(--border)] hover:border-[var(--primary)]',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        value={safeValue}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-2 text-sm font-medium text-[var(--error)]">{error}</p>}
                {helperText && !error && <p className="mt-2 text-sm text-[var(--text-secondary)]">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
