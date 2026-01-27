'use client';

import { useAuth } from '@/lib/auth-context';
import { useInternships, useApplications, useNotifications, useKYC } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';

export default function EmployerDashboard() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <DashboardContent />
    </RouteGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { data: internships, loading: internshipsLoading } = useInternships({});
  const { data: applications, loading: applicationsLoading } = useApplications();
  const { data: kycData } = useKYC();
  const { unreadCount } = useNotifications();

  // Filter only employer's internships
  const myInternships = internships?.filter((i: any) => i.employerId === user?.id) || [];
  
  // Calculate stats
  const stats = {
    activeInternships: myInternships.filter((i: any) => i.status === 'OPEN').length,
    totalApplications: applications?.length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    pendingReview: applications?.filter((a: any) => a.status === 'PENDING' || a.status === 'REVIEWING').length || 0,
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">SIP</h1>
              <p className="text-sm text-[var(--text-secondary)]">Employer Portal</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/employer/notifications">
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
              <Link href="/employer/profile">
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
            Welcome, {user?.companyProfile?.companyName || 'Employer'}! 🏢
          </h2>
          <p className="text-[var(--text-secondary)]">
            Manage your internships and connect with talented students
          </p>
        </div>

        {/* KYC Status Alert */}
        {user?.kycStatus !== 'APPROVED' && (
          <Alert variant={user?.kycStatus === 'REJECTED' ? 'error' : 'warning'} className="mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{user?.kycStatus === 'REJECTED' ? '❌' : '⚠️'}</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {user?.kycStatus === 'PENDING' && 'KYC Verification Pending'}
                  {user?.kycStatus === 'UNDER_REVIEW' && 'KYC Under Review'}
                  {user?.kycStatus === 'REJECTED' && 'KYC Verification Rejected'}
                  {user?.kycStatus === 'NOT_SUBMITTED' && 'Complete KYC Verification'}
                </h3>
                <p className="text-sm mb-3">
                  {user?.kycStatus === 'NOT_SUBMITTED' 
                    ? 'Complete your KYC to post internships and access all features'
                    : user?.kycStatus === 'REJECTED'
                    ? 'Your KYC was rejected. Please resubmit with correct documents.'
                    : 'Your KYC is being reviewed. This usually takes 24-48 hours.'}
                </p>
                {(user?.kycStatus === 'NOT_SUBMITTED' || user?.kycStatus === 'REJECTED') && (
                  <Link href="/employer/kyc">
                    <Button variant="primary" size="sm">
                      {user?.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Active Internships</p>
                  <p className="text-3xl font-bold text-[var(--primary)]">{stats.activeInternships}</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-[var(--accent)]">{stats.totalApplications}</p>
                </div>
                <div className="text-4xl">📬</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Shortlisted</p>
                  <p className="text-3xl font-bold text-green-600">{stats.shortlisted}</p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingReview}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Internships */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Internships</CardTitle>
                  <Link href="/employer/internships/new">
                    <Button variant="primary" size="sm">
                      + Post New
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {internshipsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : myInternships.length > 0 ? (
                  <div className="space-y-4">
                    {myInternships.slice(0, 5).map((internship: any) => (
                      <Link
                        key={internship.id}
                        href={`/employer/internships/${internship.id}`}
                        className="block p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-[var(--primary)]">
                            {internship.title}
                          </h4>
                          <Badge variant={internship.status === 'OPEN' ? 'success' : 'default'}>
                            {internship.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                          <span>📝 {internship._count?.applications || 0} applications</span>
                          <span>📍 {internship.location}</span>
                          <span>💰 ₹{internship.stipend?.toLocaleString()}/mo</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)] mb-4">
                      No internships posted yet
                    </p>
                    <Link href="/employer/internships/new">
                      <Button variant="primary">
                        Post Your First Internship
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : applications && applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app: any) => (
                      <Link
                        key={app.id}
                        href={`/employer/applications/${app.id}`}
                        className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium text-[var(--primary)] line-clamp-1">
                            {app.student?.studentProfile?.fullName || app.student?.email}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">
                          {app.internship?.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[var(--text-secondary)]">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                            {app.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-[var(--text-secondary)] py-8">
                    No applications yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/employer/internships/new">
                    <Button variant="outline" fullWidth>
                      📋 Post Internship
                    </Button>
                  </Link>
                  <Link href="/employer/applications">
                    <Button variant="outline" fullWidth>
                      👥 Review Applications
                    </Button>
                  </Link>
                  <Link href="/employer/messages">
                    <Button variant="outline" fullWidth>
                      💬 Messages
                    </Button>
                  </Link>
                  <Link href="/employer/kyc">
                    <Button variant="outline" fullWidth>
                      🔒 KYC Status
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
