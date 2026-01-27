'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { notificationsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT', 'EMPLOYER', 'ADMIN']}>
      <NotificationsContent />
    </RouteGuard>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.getAll(filter === 'unread');
      setNotifications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      // Navigate to link if provided
      if (link) {
        router.push(link);
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      APPLICATION_SUBMITTED: '📝',
      APPLICATION_SHORTLISTED: '⭐',
      APPLICATION_REJECTED: '❌',
      APPLICATION_ACCEPTED: '✅',
      NEW_APPLICATION: '📬',
      INTERNSHIP_PUBLISHED: '🚀',
      INTERNSHIP_CLOSED: '🔒',
      KYC_APPROVED: '✅',
      KYC_REJECTED: '❌',
      MESSAGE_RECEIVED: '💬',
      MILESTONE_APPROVED: '💰',
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      APPLICATION_SUBMITTED: 'bg-blue-50 border-blue-200',
      APPLICATION_SHORTLISTED: 'bg-green-50 border-green-200',
      APPLICATION_REJECTED: 'bg-red-50 border-red-200',
      APPLICATION_ACCEPTED: 'bg-green-50 border-green-200',
      NEW_APPLICATION: 'bg-purple-50 border-purple-200',
      INTERNSHIP_PUBLISHED: 'bg-blue-50 border-blue-200',
      INTERNSHIP_CLOSED: 'bg-gray-50 border-gray-200',
      KYC_APPROVED: 'bg-green-50 border-green-200',
      KYC_REJECTED: 'bg-red-50 border-red-200',
      MESSAGE_RECEIVED: 'bg-blue-50 border-blue-200',
      MILESTONE_APPROVED: 'bg-green-50 border-green-200',
    };
    return colorMap[type] || 'bg-gray-50 border-gray-200';
  };

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'EMPLOYER') return '/employer/dashboard';
    return '/student/dashboard';
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            <Link href={getDashboardPath()}>
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {/* Filters & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking...' : 'Mark All as Read'}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                You'll receive notifications about applications, messages, and updates
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${!notification.read ? 'border-l-4 border-l-blue-600' : ''} ${
                  getNotificationTypeColor(notification.type)
                } transition-all hover:shadow-md`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="text-gray-700 mt-1 text-sm">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge className="flex-shrink-0">New</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {notification.link && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleMarkAsRead(notification.id, notification.link)}
                          >
                            View Details
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
