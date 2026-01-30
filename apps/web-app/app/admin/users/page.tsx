'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FilterBar } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminApi } from '@/lib/api';

export default function AdminUsersPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminUsersContent />
    </RouteGuard>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.users.getAll().catch(() => ({ data: { data: [] } }));
      setAllUsers(data.data || data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      setActionLoading(userId);
      await adminApi.users.suspend(userId);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to suspend user:', error);
      alert(error.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminApi.users.activate(userId);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to activate user:', error);
      alert(error.response?.data?.message || 'Failed to activate user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      setActionLoading(userId);
      await adminApi.users.delete(userId);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter by role and search query client-side
  const filteredUsers = (allUsers || []).filter((user: any) => {
    const matchesRole = filter === 'ALL' || user.role === filter;
    const matchesSearch = !searchQuery ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.studentProfile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.companyProfile?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const stats = {
    total: allUsers.length,
    students: allUsers.filter((u: any) => u.role === 'STUDENT').length,
    employers: allUsers.filter((u: any) => u.role === 'EMPLOYER').length,
    admins: allUsers.filter((u: any) => u.role === 'ADMIN').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        
        <Card className="bg-[var(--primary)] text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">User Management 👥</h1>
                <p className="text-purple-100 text-lg">
                  {stats.total} total users on the platform
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Students"
          value={stats.students}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          }
        />
        <StatCard
          title="Employers"
          value={stats.employers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <FilterBar
            filters={[
              {
                type: 'search',
                placeholder: 'Search users by name or email...',
                value: searchQuery,
                onChange: setSearchQuery,
              },
              {
                type: 'select',
                label: 'Role',
                value: filter,
                onChange: setFilter,
                options: [
                  { label: 'All Roles', value: 'ALL' },
                  { label: 'Students', value: 'STUDENT' },
                  { label: 'Employers', value: 'EMPLOYER' },
                  { label: 'Admins', value: 'ADMIN' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">User</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left p-4 font-semibold text-gray-700">KYC Status</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Joined</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.role === 'STUDENT' 
                              ? user.studentProfile?.fullName 
                              : user.companyProfile?.companyName}
                            email={user.email}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.role === 'STUDENT' 
                                ? user.studentProfile?.fullName || 'No Name' 
                                : user.companyProfile?.companyName || 'No Company'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{user.email}</td>
                      <td className="p-4">
                        <StatusBadge status={user.role === 'STUDENT' ? 'SUBMITTED' : user.role === 'EMPLOYER' ? 'UNDER_REVIEW' : 'APPROVED'} size="sm" />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={user.kycStatus || 'PENDING'} size="sm" />
                      </td>
                      <td className="p-4 text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            View
                          </Button>
                          {user.status === 'SUSPENDED' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleActivateUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspendUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              Suspend
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title="No users found"
          description="No users match your search criteria"
          action={{
            label: "Clear Filters",
            onClick: () => { setSearchQuery(''); setFilter('ALL'); }
          }}
        />
      )}
    </div>
  );
}
