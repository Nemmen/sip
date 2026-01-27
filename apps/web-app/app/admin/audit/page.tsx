'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { auditApi, usersApi, apiClient } from '@/lib/api';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

type AxiosError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function AdminAuditLogsPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AuditLogsContent />
    </RouteGuard>
  );
}

function AuditLogsContent() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [limit, setLimit] = useState(100);

  const loadUsers = useCallback(async () => {
    try {
      // Use admin endpoint or fallback to regular users endpoint
      const response = await apiClient.get('/admin/users').catch(() => 
        usersApi.getAll()
      );
      setUsers(response.data || []);
    } catch (err) {
      const error = err as AxiosError;
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  }, []);

  const loadMyActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getMyActivity(limit);
      setLogs(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadUserLogs = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getUserLogs(userId, limit);
      setLogs(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.response?.data?.message || 'Failed to load user audit logs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadUsers();
    loadMyActivity();
  }, [loadUsers, loadMyActivity]);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    if (userId) {
      loadUserLogs(userId);
    } else {
      loadMyActivity();
    }
  };

  const getActionBadgeVariant = (action: string): string => {
    const actionMap: Record<string, string> = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'error',
      LOGIN: 'info',
      LOGOUT: 'default',
      STATUS_CHANGE: 'warning',
      PUBLISH: 'success',
      CLOSE: 'error',
      WITHDRAW: 'error',
    };
    return actionMap[action] || 'default';
  };

  const getUserName = (userId: string): string => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.email : userId;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">Track all system activities</p>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by User
                </label>
                <select
                  id="user-filter"
                  aria-label="Filter audit logs by user"
                  value={selectedUserId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Users (My Activity)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="limit-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Limit
                </label>
                <select
                  id="limit-filter"
                  aria-label="Select number of audit logs to display"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="50">50 logs</option>
                  <option value="100">100 logs</option>
                  <option value="500">500 logs</option>
                  <option value="1000">1000 logs</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => selectedUserId ? loadUserLogs(selectedUserId) : loadMyActivity()}
                  className="w-full"
                >
                  Refresh Logs
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Activity Log</h3>
              <Badge>{logs.length} entries</Badge>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Resource
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {getUserName(log.userId)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{log.resource}</div>
                            {log.resourceId && (
                              <div className="text-xs text-gray-600 truncate max-w-xs">
                                ID: {log.resourceId}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.metadata && (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800">
                                View metadata
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
