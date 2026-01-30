import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
    const variantClasses: Record<BadgeVariant, string> = {
        default: 'bg-[var(--background)] text-[var(--text-primary)] border-[var(--border)]',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center font-semibold border uppercase tracking-wide',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
        >
            {children}
        </span>
    );
}

export function getStatusBadgeVariant(
    status: string
): BadgeVariant {
    const statusMap: Record<string, BadgeVariant> = {
        PENDING: 'warning',
        VERIFIED: 'success',
        REJECTED: 'danger',
        UNDER_REVIEW: 'info',
        DRAFT: 'default',
        PUBLISHED: 'success',
        CLOSED: 'default',
        APPLIED: 'info',
        SHORTLISTED: 'info',
        REJECTED_APP: 'danger',
        ACCEPTED: 'success',
        WITHDRAWN: 'default',
        COMPLETED: 'success',
        FUNDS_HELD: 'warning',
        RELEASED: 'success',
        REFUNDED: 'info',
    };
    return statusMap[status] || 'default';
}
