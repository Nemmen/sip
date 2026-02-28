'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useInternships, useApplications, useNotifications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Timeline } from '@/components/ui/Timeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/RouteGuard';

export default function StudentDashboard() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <DashboardContent />
    </RouteGuard>
  );
}


function DashboardContent() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { data: internships, loading: internshipsLoading } = useInternships({ limit: 6 });
  const { data: applications, loading: applicationsLoading } = useApplications();
  const { unreadCount } = useNotifications();

  // Refresh user data on mount to ensure KYC status is current
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    if (!user?.studentProfile) return 0;
    
    let score = 0;
    const profile = user.studentProfile;
    
    if (profile.fullName) score += 15;
    if (profile.phone) score += 10;
    if (profile.bio) score += 10;
    if (profile.college) score += 10;
    if (profile.degree) score += 10;
    if (profile.resume) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.linkedin || profile.github) score += 10;
    
    return score;
  };

  const profileCompleteness = calculateProfileCompleteness();

  // Calculate stats
  const stats = {
    applied: applications?.filter((a: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    interview: applications?.filter((a: any) => a.status === 'INTERVIEW_SCHEDULED').length || 0,
    accepted: applications?.filter((a: any) => a.status === 'ACCEPTED').length || 0,
  };

  // Get recent activity timeline
  const getRecentActivity = () => {
    if (!applications) return [];
    
    return applications
      .slice(0, 5)
      .map((app: any) => ({
        id: app.id,
        title: `Applied to ${app.internship?.title}`,
        description: app.internship?.employer?.companyProfile?.companyName || 'Company',
        timestamp: app.createdAt,
        status: app.status === 'ACCEPTED' ? 'success' : app.status === 'REJECTED' ? 'error' : 'info',
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
      {/* Welcome Card */}
      <Card className="mb-6 bg-[var(--primary)] text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar 
                name={user?.studentProfile?.fullName}
                email={user?.email}
                size="xl"
              />
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Welcome back, {user?.studentProfile?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-white/70">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            {user?.kycStatus === 'APPROVED' && (
              <div className="flex items-center gap-2 bg-green-500 bg-opacity-20 px-4 py-2 border border-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Verified Profile</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Completeness Alert */}
      {profileCompleteness < 100 && (
        <div className="mb-6 p-5 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border-2 border-[var(--accent)]/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-2xl flex-shrink-0">
              📊
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[var(--primary)]">
                  Complete your profile
                </h3>
                <span className="text-2xl font-bold text-yellow-600">{profileCompleteness}%</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                A complete profile increases your chances of getting hired by 3x
              </p>
              <div className="mb-4">
                <div className="h-3 bg-[var(--background-alt)] overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] transition-all duration-500" 
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => router.push('/student/profile')}
              >
                Complete Now →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Alert */}
      {user?.kycStatus !== 'APPROVED' && (
        <div className={`mb-6 p-5 border-2 ${
          user?.kycStatus === 'REJECTED' 
            ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
            : user?.kycStatus === 'UNDER_REVIEW'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            : user?.kycStatus === 'PENDING'
            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0 ${
              user?.kycStatus === 'REJECTED' 
                ? 'bg-red-100 text-red-600' 
                : user?.kycStatus === 'UNDER_REVIEW'
                ? 'bg-blue-100 text-blue-600'
                : user?.kycStatus === 'PENDING'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              {user?.kycStatus === 'REJECTED' ? '❌' : user?.kycStatus === 'UNDER_REVIEW' ? '⏳' : user?.kycStatus === 'PENDING' ? '📋' : '⚠️'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--primary)] mb-1">
                {user?.kycStatus === 'PENDING' && 'KYC Verification Pending'}
                {user?.kycStatus === 'UNDER_REVIEW' && 'KYC Under Review'}
                {user?.kycStatus === 'REJECTED' && 'KYC Verification Rejected'}
                {!user?.kycStatus && 'Verify your profile to unlock all features'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {!user?.kycStatus 
                  ? 'Verified profiles get 3x more responses from employers'
                  : user?.kycStatus === 'REJECTED'
                  ? 'Your KYC was rejected. Please resubmit with correct documents.'
                  : user?.kycStatus === 'PENDING'
                  ? 'Your KYC submission is pending review.'
                  : 'Your KYC is being reviewed by our team. This usually takes 24-48 hours.'}
              </p>
              {(!user?.kycStatus || user?.kycStatus === 'REJECTED') && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => router.push('/student/profile/kyc')}
                >
                  {user?.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Verify Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Applied"
          value={stats.applied}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          change={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          change={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Interview"
          value={stats.interview}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          change={{ value: 15, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Internships */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended for You</CardTitle>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Based on your profile and interests</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/student/internships')}
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
                  {internships.slice(0, 4).map((internship: any) => (
                    <div
                      key={internship.id}
                      className="p-4 border-2 border-[var(--border)] hover:border-[var(--accent)] hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => router.push(`/student/internships/${internship.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[var(--primary)] group-hover:text-[var(--accent)] transition">
                            {internship.title}
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {internship.employer?.companyProfile?.companyName || 'Company'}
                          </p>
                        </div>
                        <StatusBadge status={internship.status} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {internship.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ₹{internship.stipend?.toLocaleString()}/mo
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {internship.duration} months
                        </div>
                      </div>
                      {internship.skills && internship.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {internship.skills.slice(0, 4).map((skill: string) => (
                            <span key={skill} className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--primary)] text-xs border border-[var(--accent)]/30">
                              {skill}
                            </span>
                          ))}
                          {internship.skills.length > 4 && (
                            <span className="px-2 py-1 bg-[var(--background)] text-[var(--text-secondary)] text-xs border border-[var(--border)]">
                              +{internship.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
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
                  title="No internships available"
                  description="Check back later for new opportunities"
                  action={{
                    label: "Browse All",
                    onClick: () => router.push('/student/internships')
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Timeline */}
          {applications && applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={getRecentActivity()} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Applications</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/student/applications')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app: any) => (
                    <div
                      key={app.id}
                      className="p-3 border-2 border-[var(--border)] hover:border-[var(--accent)] transition cursor-pointer"
                      onClick={() => router.push(`/student/applications/${app.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-[var(--primary)] line-clamp-1">
                          {app.internship?.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="No applications yet"
                  description="Start applying to internships"
                  action={{
                    label: "Browse Internships",
                    onClick: () => router.push('/student/internships')
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/student/internships')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Internships
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/student/profile')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/student/messages')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push('/student/analytics')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          {applications && applications.filter((a: any) => a.internship?.applicationDeadline && new Date(a.internship.applicationDeadline) > new Date()).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications
                    .filter((a: any) => a.internship?.applicationDeadline && new Date(a.internship.applicationDeadline) > new Date())
                    .slice(0, 3)
                    .map((app: any) => (
                      <div key={app.id} className="flex items-center gap-3 p-2 bg-[var(--background)]">
                        <div className="w-10 h-10 bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                          {new Date(app.internship.applicationDeadline).getDate()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--primary)] truncate">
                            {app.internship.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(app.internship.applicationDeadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
