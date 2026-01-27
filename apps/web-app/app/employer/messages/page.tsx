'use client';

import MessagesInterface from '@/components/MessagesInterface';
import { RouteGuard } from '@/components/RouteGuard';

export default function EmployerMessagesPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <MessagesInterface />
    </RouteGuard>
  );
}
