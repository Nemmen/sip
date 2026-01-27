'use client';

import NotificationsPage from '@/components/NotificationCenter';
import { RouteGuard } from '@/components/RouteGuard';

export default function EmployerNotificationsPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <NotificationsPage />
    </RouteGuard>
  );
}
