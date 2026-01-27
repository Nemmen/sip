'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function AdminUsersPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminUsersContent />
    </RouteGuard>
  );
}

function AdminUsersContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/users');
      const filtered = filter === 'ALL' ? data : data.filter((u: any) => u.role === filter);
      setUsers(filtered);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--primary)]">User Management</h1>
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="flex gap-2 mb-6">
          <Button variant={filter === 'ALL' ? 'primary' : 'outline'} onClick={() => setFilter('ALL')}>
            All
          </Button>
          <Button variant={filter === 'STUDENT' ? 'primary' : 'outline'} onClick={() => setFilter('STUDENT')}>
            Students
          </Button>
          <Button variant={filter === 'EMPLOYER' ? 'primary' : 'outline'} onClick={() => setFilter('EMPLOYER')}>
            Employers
          </Button>
          <Button variant={filter === 'ADMIN' ? 'primary' : 'outline'} onClick={() => setFilter('ADMIN')}>
            Admins
          </Button>
        </div>

        <Card>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">KYC Status</th>
                      <th className="text-left p-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {user.role === 'STUDENT' 
                            ? user.studentProfile?.fullName 
                            : user.companyProfile?.companyName || 'N/A'}
                        </td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <Badge variant="info">{user.role}</Badge>
                        </td>
                        <td className="p-3">{user.kycStatus}</td>
                        <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
