'use client';

import { useAuth } from '@/lib/auth-context';
import { useInternships, useApplications, useNotifications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';

export default function StudentDashboard() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <DashboardContent />
    </RouteGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { data: internships, loading: internshipsLoading } = useInternships({ limit: 6 });
  const { data: applications, loading: applicationsLoading } = useApplications();
  const { unreadCount } = useNotifications();

  // Calculate stats
  const stats = {
    applied: applications?.filter((a: any) => a.status === 'PENDING' || a.status === 'REVIEWING').length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    offered: applications?.filter((a: any) => a.status === 'OFFERED').length || 0,
    rejected: applications?.filter((a: any) => a.status === 'REJECTED').length || 0,
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">SIP</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/student/notifications">
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
              <Link href="/student/profile">
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
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-[var(--text-secondary)]">
            Find your dream internship and kickstart your career
          </p>
        </div>

        {/* KYC Alert */}
        {user?.kycStatus !== 'APPROVED' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Complete your profile verification
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Verified profiles get 3x more responses from employers
                </p>
                <Link href="/student/profile/kyc">
                  <Button variant="primary" size="sm">
                    Verify Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Applied</p>
                  <p className="text-3xl font-bold text-[var(--primary)]">{stats.applied}</p>
                </div>
                <div className="text-4xl">📝</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Shortlisted</p>
                  <p className="text-3xl font-bold text-[var(--accent)]">{stats.shortlisted}</p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Offered</p>
                  <p className="text-3xl font-bold text-green-600">{stats.offered}</p>
                </div>
                <div className="text-4xl">🎉</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommended Internships */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recommended for You</CardTitle>
                  <Link href="/student/internships">
                    <Button variant="ghost" size="sm">
                      View All →
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {internshipsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : internships && internships.length > 0 ? (
                  <div className="space-y-4">
                    {internships.slice(0, 5).map((internship: any) => (
                      <Link
                        key={internship.id}
                        href={`/student/internships/${internship.id}`}
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
                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                          {internship.employer?.companyProfile?.companyName || 'Company'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                          <span>📍 {internship.location}</span>
                          <span>💰 ₹{internship.stipend?.toLocaleString()}/month</span>
                          <span>📅 {internship.duration} months</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[var(--text-secondary)] py-8">
                    No internships available at the moment
                  </p>
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
                        href={`/student/applications/${app.id}`}
                        className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium text-[var(--primary)] line-clamp-1">
                            {app.internship?.title}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[var(--text-secondary)]">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-[var(--text-secondary)] py-8">
                    No applications yet. Start applying!
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
                  <Link href="/student/internships">
                    <Button variant="outline" fullWidth>
                      🔍 Browse Internships
                    </Button>
                  </Link>
                  <Link href="/student/profile">
                    <Button variant="outline" fullWidth>
                      📄 Edit Profile
                    </Button>
                  </Link>
                  <Link href="/student/messages">
                    <Button variant="outline" fullWidth>
                      💬 Messages
                    </Button>
                  </Link>
                  <Link href="/student/applications">
                    <Button variant="outline" fullWidth>
                      📊 Track Applications
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
