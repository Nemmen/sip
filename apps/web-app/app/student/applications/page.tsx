'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useApplications } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';

export default function TrackApplicationsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <TrackApplicationsContent />
    </RouteGuard>
  );
}

function TrackApplicationsContent() {
  const { user } = useAuth();
  const { data: applications, loading } = useApplications();
  const [filter, setFilter] = useState<string>('all');

  const filteredApplications = applications?.filter((app: any) => {
    if (filter === 'all') return true;
    return app.status === filter;
  }) || [];

  const statusCounts = {
    total: applications?.length || 0,
    pending: applications?.filter((a: any) => a.status === 'PENDING').length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    accepted: applications?.filter((a: any) => a.status === 'ACCEPTED').length || 0,
    rejected: applications?.filter((a: any) => a.status === 'REJECTED').length || 0,
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Track Applications</h1>
              <p className="text-sm text-[var(--text-secondary)]">Monitor your application status</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className={filter === 'all' ? 'ring-2 ring-[var(--primary)]' : ''}>
            <CardContent className="p-4 cursor-pointer" onClick={() => setFilter('all')}>
              <p className="text-sm text-[var(--text-secondary)]">Total</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{statusCounts.total}</p>
            </CardContent>
          </Card>
          <Card className={filter === 'PENDING' ? 'ring-2 ring-[var(--primary)]' : ''}>
            <CardContent className="p-4 cursor-pointer" onClick={() => setFilter('PENDING')}>
              <p className="text-sm text-[var(--text-secondary)]">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card className={filter === 'SHORTLISTED' ? 'ring-2 ring-[var(--primary)]' : ''}>
            <CardContent className="p-4 cursor-pointer" onClick={() => setFilter('SHORTLISTED')}>
              <p className="text-sm text-[var(--text-secondary)]">Shortlisted</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.shortlisted}</p>
            </CardContent>
          </Card>
          <Card className={filter === 'ACCEPTED' ? 'ring-2 ring-[var(--primary)]' : ''}>
            <CardContent className="p-4 cursor-pointer" onClick={() => setFilter('ACCEPTED')}>
              <p className="text-sm text-[var(--text-secondary)]">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
            </CardContent>
          </Card>
          <Card className={filter === 'REJECTED' ? 'ring-2 ring-[var(--primary)]' : ''}>
            <CardContent className="p-4 cursor-pointer" onClick={() => setFilter('REJECTED')}>
              <p className="text-sm text-[var(--text-secondary)]">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'All Applications' : `${filter} Applications`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredApplications.length > 0 ? (
              <div className="space-y-4">
                {filteredApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[var(--primary)] mb-1">
                          {app.internship?.title}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {app.internship?.employer?.companyProfile?.companyName || 'Company'}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-[var(--text-secondary)] mb-3">
                      <span>📍 {app.internship?.location}</span>
                      <span>💰 ₹{app.internship?.stipend?.toLocaleString()}/mo</span>
                      <span>📅 Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span>🔄 Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {app.coverLetter && (
                      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                        <strong>Cover Letter:</strong> {app.coverLetter}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/student/applications/${app.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      {app.status === 'ACCEPTED' && (
                        <Link href={`/student/internships/${app.internshipId}/milestones`}>
                          <Button variant="primary" size="sm">View Milestones</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">No applications found</p>
                <p className="text-sm mt-2">
                  {filter === 'all' 
                    ? "Start applying to internships to see them here"
                    : `No ${filter.toLowerCase()} applications`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
