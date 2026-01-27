'use client';

import NotificationsPage from '@/components/NotificationCenter';
import { RouteGuard } from '@/components/RouteGuard';

export default function StudentNotificationsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <NotificationsPage />
    </RouteGuard>
  );
}
