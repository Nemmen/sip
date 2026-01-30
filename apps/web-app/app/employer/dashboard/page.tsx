'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useEmployerInternships, useEmployerApplications, useNotifications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Timeline } from '@/components/ui/Timeline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/RouteGuard';

export default function EmployerDashboard() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <DashboardContent />
    </RouteGuard>
  );
}


function DashboardContent() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { data: internships, loading: internshipsLoading } = useEmployerInternships();
  const { data: applications, loading: applicationsLoading } = useEmployerApplications();
  const { unreadCount } = useNotifications();

  // Refresh user data on mount to ensure KYC status is current
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Calculate comprehensive stats
  const stats = {
    activeInternships: internships?.filter((i: any) => i.status === 'PUBLISHED').length || 0,
    totalApplications: applications?.length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    hired: applications?.filter((a: any) => a.status === 'ACCEPTED').length || 0,
  };

  // Get hiring funnel data
  const funnelData = [
    { stage: 'Applied', count: applications?.filter((a: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length || 0 },
    { stage: 'Shortlisted', count: stats.shortlisted },
    { stage: 'Interview', count: applications?.filter((a: any) => a.status === 'INTERVIEW_SCHEDULED').length || 0 },
    { stage: 'Hired', count: stats.hired },
  ];

  // Get recent candidates
  const getRecentCandidates = () => {
    if (!applications) return [];
    return applications
      .slice(0, 5)
      .map((app: any) => ({
        id: app.id,
        title: `New application from ${app.student?.studentProfile?.fullName || app.student?.email}`,
        description: app.internship?.title,
        timestamp: app.createdAt,
        status: app.status === 'ACCEPTED' ? 'success' : app.status === 'REJECTED' ? 'error' : 'info',
        actor: app.student?.studentProfile?.fullName || app.student?.email,
      }));
  };

  if (internshipsLoading && applicationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar 
                name={user?.companyProfile?.companyName}
                email={user?.email}
                size="xl"
              />
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {user?.companyProfile?.companyName || 'Your Company'} 🏢
                </h1>
                <p className="text-indigo-100">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.kycStatus === 'APPROVED' && (
                <div className="flex items-center gap-2 bg-green-500 bg-opacity-20 px-4 py-2 rounded-lg border border-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Verified Company</span>
                </div>
              )}
              <Button 
                variant="primary" 
                onClick={() => router.push('/employer/internships/new')}
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                + Post Internship
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Alert */}
      {user?.kycStatus !== 'APPROVED' && (
        <div className={`mb-6 p-5 rounded-lg border ${
          user?.kycStatus === 'REJECTED' 
            ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
              user?.kycStatus === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              {user?.kycStatus === 'REJECTED' ? '❌' : '⚠️'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {user?.kycStatus === 'PENDING' && 'KYC Verification Pending'}
                {user?.kycStatus === 'UNDER_REVIEW' && 'KYC Under Review'}
                {user?.kycStatus === 'REJECTED' && 'KYC Verification Rejected'}
                {!user?.kycStatus && 'Complete KYC to Post Internships'}
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {!user?.kycStatus 
                  ? 'Verified companies get 5x more applications. Complete your KYC to unlock all features.'
                  : user?.kycStatus === 'REJECTED'
                  ? 'Your KYC was rejected. Please resubmit with correct documents.'
                  : 'Your KYC is being reviewed. This usually takes 24-48 hours.'}
              </p>
              {(!user?.kycStatus || user?.kycStatus === 'REJECTED') && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => router.push('/employer/kyc')}
                >
                  {user?.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Internships"
          value={stats.activeInternships}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          change={{ value: 10, isPositive: true }}
        />
        <StatCard
          title="Applications Received"
          value={stats.totalApplications}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          change={{ value: 25, isPositive: true }}
        />
        <StatCard
          title="Shortlisted Candidates"
          value={stats.shortlisted}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          change={{ value: 18, isPositive: true }}
        />
        <StatCard
          title="Hires"
          value={stats.hired}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          change={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hiring Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Hiring Funnel</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Candidate progression through your pipeline</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, index) => {
                  const percentage = stats.totalApplications > 0 ? (stage.count / stats.totalApplications) * 100 : 0;
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-green-500'];
                  
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                        <span className="text-sm font-bold text-gray-900">{stage.count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[index]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Internships */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Internships</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage and track your postings</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/employer/internships')}
                >
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {internshipsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : internships && internships.length > 0 ? (
                <div className="space-y-4">
                  {internships.slice(0, 5).map((internship: any) => (
                    <div
                      key={internship.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => router.push(`/employer/internships/${internship.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                            {internship.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {internship._count?.applications || 0} applications
                          </p>
                        </div>
                        <StatusBadge status={internship.status} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {internship.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {internship.duration} months
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(internship.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/employer/internships/${internship.id}/edit`);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/employer/internships/${internship.id}/kanban`);
                          }}
                        >
                          View Kanban
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  title="No internships yet"
                  description="Post your first internship to start hiring talented students"
                  action={{
                    label: "Post Internship",
                    onClick: () => router.push('/employer/internships/new')
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Timeline */}
          {applications && applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Candidate Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={getRecentCandidates()} />
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
                  onClick={() => router.push('/employer/internships/new')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Internship
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/employer/applications')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  View Candidates
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/employer/messages')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/employer/analytics')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ATS Pipeline Preview */}
          {internships && internships.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ATS Pipeline</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/employer/internships')}
                  >
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['SUBMITTED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED'].map((status) => {
                    const count = applications?.filter((a: any) => a.status === status).length || 0;
                    return (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={status} size="sm" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium text-gray-900">{user?.companyProfile?.companyName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="font-medium text-gray-900">{user?.companyProfile?.industry || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={user?.kycStatus || 'PENDING'} size="sm" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  fullWidth
                  onClick={() => router.push('/employer/profile')}
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
