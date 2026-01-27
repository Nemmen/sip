'use client';

import { useApplications } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function EmployerApplicationsPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <EmployerApplicationsContent />
    </RouteGuard>
  );
}

function EmployerApplicationsContent() {
  const router = useRouter();
  const { data: applications, loading } = useApplications();
  
  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a: any) => a.status === 'PENDING').length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    accepted: applications?.filter((a: any) => a.status === 'ACCEPTED').length || 0,
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
          onClick={() => router.push('/employer/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Applications 📨</h1>
                <p className="text-indigo-100">Manage all candidate applications</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{stats.total}</div>
                <div className="text-indigo-100">Total Applications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          valueColor="text-orange-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          valueColor="text-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          valueColor="text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Applications List */}
      {applications && applications.length > 0 ? (
        <div className="grid gap-4">
          {applications.map((app: any) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <UserAvatar 
                    name={app.student?.studentProfile?.fullName || app.student?.email || 'Unknown'} 
                    size="lg" 
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {app.student?.studentProfile?.fullName || app.student?.email || 'Unknown Applicant'}
                        </h3>
                        <p className="text-sm text-gray-600">{app.student?.email}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Position</p>
                        <p className="text-sm font-medium text-gray-900">{app.internship?.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Applied On</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(app.appliedAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/employer/applications/${app.id}`)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </Button>
                      {app.student?.studentProfile?.resumeUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(app.student.studentProfile.resumeUrl, '_blank')}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Applications Yet"
          description="Applications will appear here when students apply to your internships."
          actionLabel="View Internships"
          onAction={() => router.push('/employer/internships')}
        />
      )}
    </div>
  );
}
