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
        // Convert null to empty string to prevent React warning
        const safeValue = value === null ? '' : value;
        
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={clsx(
                            'w-full px-4 py-2.5 border rounded-lg transition-colors duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                            'disabled:bg-gray-100 disabled:cursor-not-allowed',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 hover:border-gray-400',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        value={safeValue}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
                {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
