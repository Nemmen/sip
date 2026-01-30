'use client';

import { useAuth } from '@/lib/auth-context';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Don't show layout on auth pages or landing page
  const isAuthPage = pathname.startsWith('/auth/');
  const isLandingPage = pathname === '/';
  
  if (isAuthPage || isLandingPage || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
