'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function AdminDashboard() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <DashboardContent />
    </RouteGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch platform stats
      const [usersRes, internshipsRes, applicationsRes, kycRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/internships'),
        apiClient.get('/applications'),
        apiClient.get('/kyc'),
      ]);

      setStats({
        totalUsers: usersRes.data.length,
        totalStudents: usersRes.data.filter((u: any) => u.role === 'STUDENT').length,
        totalEmployers: usersRes.data.filter((u: any) => u.role === 'EMPLOYER').length,
        totalInternships: internshipsRes.data.length,
        activeInternships: internshipsRes.data.filter((i: any) => i.status === 'OPEN').length,
        totalApplications: applicationsRes.data.length,
        pendingKYC: kycRes.data.filter((k: any) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length,
      });

      // Set KYC queue
      setKycQueue(
        kycRes.data
          .filter((k: any) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW')
          .slice(0, 10)
      );
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCAction = async (kycId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await apiClient.patch(`/kyc/${kycId}/approve`);
      } else {
        await apiClient.patch(`/kyc/${kycId}/reject`, {
          rejectionReason: 'Documents do not meet verification standards',
        });
      }
      
      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error(`Failed to ${action} KYC:`, error);
      alert(`Failed to ${action} KYC verification`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">SIP Admin</h1>
              <p className="text-sm text-[var(--text-secondary)]">Platform Management</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/notifications">
                <div className="relative inline-block">
                  <Button variant="ghost" size="sm">
                    🔔
                  </Button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
              <Link href="/admin/profile">
                <Button variant="outline" size="sm">
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--primary)] mb-2">
            Admin Dashboard 👨‍💼
          </h2>
          <p className="text-[var(--text-secondary)]">
            Monitor and manage the SIP platform
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-[var(--primary)]">{stats?.totalUsers || 0}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {stats?.totalStudents} students, {stats?.totalEmployers} employers
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-1">Total Internships</p>
                      <p className="text-3xl font-bold text-[var(--accent)]">{stats?.totalInternships || 0}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {stats?.activeInternships} active
                      </p>
                    </div>
                    <div className="text-4xl">📋</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-1">Applications</p>
                      <p className="text-3xl font-bold text-green-600">{stats?.totalApplications || 0}</p>
                    </div>
                    <div className="text-4xl">📝</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-1">Pending KYC</p>
                      <p className="text-3xl font-bold text-orange-600">{stats?.pendingKYC || 0}</p>
                    </div>
                    <div className="text-4xl">⏳</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* KYC Review Queue */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>KYC Review Queue</CardTitle>
                      <Link href="/admin/kyc">
                        <Button variant="ghost" size="sm">
                          View All →
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {kycQueue.length > 0 ? (
                      <div className="space-y-4">
                        {kycQueue.map((kyc: any) => (
                          <div
                            key={kyc.id}
                            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-[var(--primary)]">
                                  {kyc.user?.role === 'STUDENT' 
                                    ? kyc.user?.studentProfile?.fullName 
                                    : kyc.user?.companyProfile?.companyName || kyc.user?.email}
                                </h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {kyc.user?.email} • {kyc.user?.role}
                                </p>
                              </div>
                              <Badge variant={getStatusBadgeVariant(kyc.status)}>
                                {kyc.status}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 text-xs text-[var(--text-secondary)] mb-3">
                              <span>📄 {kyc.documentType}</span>
                              <span>📅 {new Date(kyc.submittedAt).toLocaleDateString()}</span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleKYCAction(kyc.id, 'approve')}
                              >
                                ✓ Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleKYCAction(kyc.id, 'reject')}
                              >
                                ✗ Reject
                              </Button>
                              <Link href={`/admin/kyc/${kyc.id}`}>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-[var(--text-secondary)] py-8">
                        No pending KYC verifications
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link href="/admin/kyc">
                        <Button variant="outline" fullWidth>
                          🔍 Review KYC
                        </Button>
                      </Link>
                      <Link href="/admin/users">
                        <Button variant="outline" fullWidth>
                          👥 Manage Users
                        </Button>
                      </Link>
                      <Link href="/admin/internships">
                        <Button variant="outline" fullWidth>
                          📋 View Internships
                        </Button>
                      </Link>
                      <Link href="/admin/escrow">
                        <Button variant="outline" fullWidth>
                          💰 Escrow Logs
                        </Button>
                      </Link>
                      <Link href="/admin/disputes">
                        <Button variant="outline" fullWidth>
                          ⚖️ Disputes
                        </Button>
                      </Link>
                      <Link href="/admin/analytics">
                        <Button variant="outline" fullWidth>
                          📊 Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">API Status</span>
                        <Badge variant="success">Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Database</span>
                        <Badge variant="success">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">WebSocket</span>
                        <Badge variant="success">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Redis Cache</span>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
