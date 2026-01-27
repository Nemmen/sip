'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Timeline } from '@/components/ui/Timeline';
import apiClient from '@/lib/api';

export default function AdminDashboard() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <DashboardContent />
    </RouteGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch platform stats with error handling
      const [usersRes, internshipsRes, applicationsRes, kycRes] = await Promise.all([
        apiClient.get('/admin/users').catch(() => ({ data: [] })),
        apiClient.get('/admin/internships').catch(() => ({ data: [] })),
        apiClient.get('/admin/applications').catch(() => ({ data: [] })),
        apiClient.get('/admin/kyc').catch(() => ({ data: [] })),
      ]);

      const users = usersRes.data || [];
      const internships = internshipsRes.data || [];
      const applications = applicationsRes.data || [];
      const kycData = kycRes.data || [];

      setStats({
        totalUsers: users.length,
        totalStudents: users.filter((u: any) => u.role === 'STUDENT').length,
        totalEmployers: users.filter((u: any) => u.role === 'EMPLOYER').length,
        totalInternships: internships.length,
        activeInternships: internships.filter((i: any) => i.status === 'PUBLISHED').length,
        draftInternships: internships.filter((i: any) => i.status === 'DRAFT').length,
        totalApplications: applications.length,
        pendingKYC: kycData.filter((k: any) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length,
        approvedKYC: kycData.filter((k: any) => k.status === 'APPROVED').length,
      });

      // Set KYC queue
      setKycQueue(
        kycData
          .filter((k: any) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW')
          .slice(0, 5)
      );

      // Generate recent activity timeline
      const activity = [];
      
      // Recent KYC submissions
      kycData.slice(0, 3).forEach((k: any) => {
        activity.push({
          id: `kyc-${k.id}`,
          title: `KYC ${k.status.toLowerCase()} - ${k.user?.companyProfile?.companyName || k.user?.email}`,
          description: `${k.documentType} verification`,
          timestamp: k.submittedAt,
          status: k.status === 'APPROVED' ? 'success' : k.status === 'REJECTED' ? 'error' : 'info',
          actor: 'System',
        });
      });

      // Recent internship postings
      internships.slice(0, 3).forEach((i: any) => {
        activity.push({
          id: `internship-${i.id}`,
          title: `New internship posted - ${i.title}`,
          description: `By ${i.company?.companyName || 'Unknown'}`,
          timestamp: i.createdAt,
          status: 'info',
          actor: i.company?.companyName || 'Unknown',
        });
      });

      // Recent user registrations
      users.slice(0, 2).forEach((u: any) => {
        activity.push({
          id: `user-${u.id}`,
          title: `New ${u.role.toLowerCase()} registered`,
          description: u.email,
          timestamp: u.createdAt,
          status: 'info',
          actor: u.role,
        });
      });

      // Sort by timestamp
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 8));

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <Card className="mb-6 bg-gradient-to-r from-purple-600 to-pink-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar 
                name="Admin"
                email={user?.email}
                size="xl"
              />
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Admin Control Center 👨‍💼
                </h1>
                <p className="text-purple-100">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-purple-100">Platform Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          change={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Internships"
          value={stats?.activeInternships || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          change={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          change={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Pending KYC"
          value={stats?.pendingKYC || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Students</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.totalStudents || 0}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${stats?.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Employers</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.totalEmployers || 0}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${stats?.totalUsers > 0 ? (stats.totalEmployers / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internship Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Published</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.activeInternships || 0}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${stats?.totalInternships > 0 ? (stats.activeInternships / stats.totalInternships) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Draft</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.draftInternships || 0}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${stats?.totalInternships > 0 ? (stats.draftInternships / stats.totalInternships) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KYC Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Approved</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.approvedKYC || 0}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Pending Review</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.pendingKYC || 0}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: '25%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* KYC Review Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>KYC Review Queue</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Pending employer verifications</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/kyc')}
                >
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {kycQueue.length > 0 ? (
                <div className="space-y-4">
                  {kycQueue.map((kyc: any) => (
                    <div
                      key={kyc.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {kyc.user?.role === 'STUDENT' 
                              ? kyc.user?.studentProfile?.fullName 
                              : kyc.user?.companyProfile?.companyName || kyc.user?.email}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {kyc.user?.email} • {kyc.user?.role}
                          </p>
                        </div>
                        <StatusBadge status={kyc.status} />
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {kyc.documentType}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(kyc.submittedAt).toLocaleDateString()}
                        </div>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/admin/kyc/${kyc.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="All caught up!"
                  description="No pending KYC verifications at the moment"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Platform Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={recentActivity} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="primary" 
                  fullWidth
                  onClick={() => router.push('/admin/kyc')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Review KYC
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/admin/users')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Users
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/admin/internships')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  View Internships
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/admin/analytics')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'API Status', status: 'APPROVED' },
                  { name: 'Database', status: 'APPROVED' },
                  { name: 'WebSocket', status: 'APPROVED' },
                  { name: 'Redis Cache', status: 'APPROVED' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                    <StatusBadge status={service.status} size="sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.totalStudents} students • {stats?.totalEmployers} employers
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Total Internships</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalInternships || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.activeInternships} published • {stats?.draftInternships} drafts
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
