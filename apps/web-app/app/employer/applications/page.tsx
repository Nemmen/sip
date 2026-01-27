'use client';

import { useApplications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';

export default function EmployerApplicationsPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <EmployerApplicationsContent />
    </RouteGuard>
  );
}

function EmployerApplicationsContent() {
  const { data: applications, loading } = useApplications();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--primary)]">All Applications</h1>
            <Link href="/employer/dashboard">
              <Button variant="outline" size="sm">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <Card>
          <CardHeader>
            <CardTitle>Applications Received</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div key={app.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-[var(--primary)]">
                          {app.student?.studentProfile?.fullName || app.student?.email}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {app.internship?.title}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                    <Link href={`/employer/applications/${app.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No applications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
