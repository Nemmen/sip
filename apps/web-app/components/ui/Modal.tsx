import React from 'react';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-[var(--primary-dark)] bg-opacity-80"
                    onClick={onClose}
                ></div>

                {/* Center modal */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div
                    className={clsx(
                        'relative inline-block align-bottom bg-white text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full z-50 border-2 border-[var(--primary)]',
                        sizeClasses[size]
                    )}
                >
                    {title && (
                        <div className="px-6 py-4 border-b-2 border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
                            <h3 className="text-lg font-bold text-[var(--primary)]">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1 hover:bg-[var(--primary)]/10"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}
                    <div className="px-6 py-5">{children}</div>
                </div>
            </div>
        </div>
    );
}
