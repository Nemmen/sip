'use client';

import NotificationsPage from '@/components/NotificationCenter';
import { RouteGuard } from '@/components/RouteGuard';

export default function AdminNotificationsPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <NotificationsPage />
    </RouteGuard>
  );
}
