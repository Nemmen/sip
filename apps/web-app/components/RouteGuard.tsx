'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface RouteGuardProps {
    children: React.ReactNode;
    allowedRoles?: ('STUDENT' | 'EMPLOYER' | 'ADMIN' | 'TPO')[];
    requireKYC?: boolean;
}

export function RouteGuard({ children, allowedRoles, requireKYC = false }: RouteGuardProps) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            const roleRoutes = {
                STUDENT: '/student/dashboard',
                EMPLOYER: '/employer/dashboard',
                ADMIN: '/admin/dashboard',
                TPO: '/admin/dashboard',
            };
            router.push(roleRoutes[user.role]);
            return;
        }

        if (requireKYC && user?.role === 'EMPLOYER' && user.kycStatus !== 'APPROVED') {
            router.push('/employer/kyc');
            return;
        }
    }, [loading, isAuthenticated, user, router, pathname, allowedRoles, requireKYC]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return null;
    }

    if (requireKYC && user?.role === 'EMPLOYER' && user.kycStatus !== 'APPROVED') {
        return null;
    }

    return <>{children}</>;
}
