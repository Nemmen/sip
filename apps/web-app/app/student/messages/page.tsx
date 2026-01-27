'use client';

import MessagesInterface from '@/components/MessagesInterface';
import { RouteGuard } from '@/components/RouteGuard';

export default function StudentMessagesPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <MessagesInterface />
    </RouteGuard>
  );
}
