'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { adminApi, auditApi } from '@/lib/api';

export default function AdminUserDetailPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminUserDetailContent />
    </RouteGuard>
  );
}

function AdminUserDetailContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user details - get from users list endpoint
      const { data: usersData } = await adminApi.users.getAll();
      const users = usersData.data || usersData || [];
      const foundUser = users.find((u: any) => u.id === userId);

      if (!foundUser) {
        setError('User not found');
        return;
      }

      setUser(foundUser);

      // Fetch audit logs
      try {
        const { data: logsData } = await auditApi.getUserLogs(userId, 20);
        setLogs(Array.isArray(logsData) ? logsData : (logsData?.data || []));
      } catch (logError) {
        console.error('Failed to load audit logs:', logError);
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Failed to load user:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      setActionLoading(true);
      await adminApi.users.suspend(userId);
      await loadUserDetails();
      alert('User suspended successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActionLoading(true);
      await adminApi.users.activate(userId);
      await loadUserDetails();
      alert('User activated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      setActionLoading(true);
      await adminApi.users.delete(userId);
      alert('User deleted successfully');
      router.push('/admin/users');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
      setActionLoading(false);
    }
  };

  const getUserName = () => {
    if (!user) return 'User';
    if (user.studentProfile?.fullName) return user.studentProfile.fullName;
    if (user.employerProfile?.companyName) return user.employerProfile.companyName;
    return user.email;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-4">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">← Back to Users</Button>
            </Link>
          </div>
        </header>
        <div className="container-custom py-8">
          <Alert variant="error">{error || 'User not found'}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                <Link href="/admin/dashboard" className="hover:text-[var(--primary)]">Admin</Link>
                <span>/</span>
                <Link href="/admin/users" className="hover:text-[var(--primary)]">Users</Link>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium">{getUserName()}</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">User Details</h1>
            </div>
            <Link href="/admin/users">
              <Button variant="outline" size="sm">← Back to Users</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid gap-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Information</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={user.status} />
                  <Badge variant={user.role === 'ADMIN' ? 'warning' : user.role === 'EMPLOYER' ? 'info' : 'default'}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <UserAvatar 
                      name={getUserName()} 
                      size="lg"
                      role={user.role}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{getUserName()}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">User ID</label>
                    <p className="text-sm font-mono text-[var(--text-primary)] bg-gray-50 p-2 rounded">{user.id}</p>
                  </div>

                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Email Verified</label>
                    <p className="text-sm text-[var(--text-primary)]">
                      {user.emailVerified ? '✅ Yes' : '❌ No'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">KYC Status</label>
                    <div className="mt-1">
                      <StatusBadge status={user.kycStatus || 'PENDING'} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Joined</label>
                    <p className="text-sm text-[var(--text-primary)]">{new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>

                {/* Right Column - Profile Data */}
                <div className="space-y-4">
                  {user.role === 'STUDENT' && user.studentProfile && (
                    <>
                      <h4 className="font-semibold text-[var(--primary)] mb-3">Student Profile</h4>
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Full Name</label>
                        <p className="text-sm text-[var(--text-primary)]">{user.studentProfile.fullName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Phone</label>
                        <p className="text-sm text-[var(--text-primary)]">{user.studentProfile.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Skills</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.studentProfile.skills?.length > 0 ? (
                            user.studentProfile.skills.map((skill: string, idx: number) => (
                              <Badge key={idx} variant="default" size="sm">{skill}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-[var(--text-secondary)]">No skills listed</span>
                          )}
                        </div>
                      </div>
                      {user.studentProfile.resume && (
                        <div>
                          <label className="text-sm text-[var(--text-secondary)]">Resume</label>
                          <a 
                            href={user.studentProfile.resume} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--accent)] hover:underline"
                          >
                            View Resume →
                          </a>
                        </div>
                      )}
                    </>
                  )}

                  {user.role === 'EMPLOYER' && user.employerProfile && (
                    <>
                      <h4 className="font-semibold text-[var(--primary)] mb-3">Employer Profile</h4>
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Company Name</label>
                        <p className="text-sm text-[var(--text-primary)]">{user.employerProfile.companyName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Industry</label>
                        <p className="text-sm text-[var(--text-primary)]">{user.employerProfile.industry || '-'}</p>
                      </div>
                      {user.employerProfile.website && (
                        <div>
                          <label className="text-sm text-[var(--text-secondary)]">Website</label>
                          <a 
                            href={user.employerProfile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--accent)] hover:underline"
                          >
                            {user.employerProfile.website} →
                          </a>
                        </div>
                      )}
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Trust Score</label>
                        <p className="text-sm text-[var(--text-primary)]">{user.employerProfile.trustScore || 0}/100</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--border)]">
                {user.status === 'ACTIVE' ? (
                  <Button
                    variant="outline"
                    onClick={handleSuspend}
                    disabled={actionLoading}
                  >
                    Suspend User
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleActivate}
                    disabled={actionLoading}
                  >
                    Activate User
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-[var(--text-secondary)] py-8">No activity logs found</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log: any) => (
                    <div 
                      key={log.id} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="default" size="sm">{log.action}</Badge>
                          {log.resource && (
                            <span className="text-xs text-[var(--text-secondary)]">
                              {log.resource} {log.resourceId && `• ${log.resourceId.substring(0, 8)}...`}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-sm text-[var(--text-secondary)]">{log.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
