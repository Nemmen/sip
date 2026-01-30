import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses = 'font-semibold transition-all duration-200 inline-flex items-center justify-center border-2 uppercase tracking-wide';

    const variantClasses = {
        primary: 'bg-[var(--primary)] border-[var(--primary)] text-white hover:bg-[var(--primary-light)] hover:border-[var(--primary-light)] active:bg-[var(--primary-dark)] disabled:bg-gray-300 disabled:border-gray-300',
        secondary: 'bg-[var(--accent)] border-[var(--accent)] text-[var(--primary-dark)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] active:bg-[var(--accent-hover)] disabled:bg-gray-300 disabled:border-gray-300',
        outline: 'border-[var(--primary)] text-[var(--primary)] bg-transparent hover:bg-[var(--primary)] hover:text-white disabled:border-gray-300 disabled:text-gray-400 disabled:bg-transparent',
        danger: 'bg-[var(--error)] border-[var(--error)] text-white hover:bg-red-700 hover:border-red-700 active:bg-red-800 disabled:bg-gray-300 disabled:border-gray-300',
        ghost: 'border-transparent text-[var(--primary)] bg-transparent hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/20 disabled:text-gray-400',
    };

    const sizeClasses = {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
    };

    return (
        <button
            className={clsx(
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && 'w-full',
                disabled && 'cursor-not-allowed opacity-60',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            )}
            {children}
        </button>
    );
}
