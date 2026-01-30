import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
    const paddingClasses = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    // Check if className contains a background override
    const hasCustomBg = className?.includes('bg-');

    return (
        <div
            className={clsx(
                !hasCustomBg && 'bg-white',
                'border border-[var(--border)] shadow-sm',
                hover && 'transition-all duration-200 hover:shadow-md hover:border-[var(--accent)]',
                paddingClasses[padding],
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={clsx('border-b border-[var(--border)] pb-4 mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h3 className={clsx('text-lg font-bold text-[var(--primary)]', className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={clsx(className)}>{children}</div>;
}
