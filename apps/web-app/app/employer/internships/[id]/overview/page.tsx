'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/ui/Timeline';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function InternshipOverview() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <OverviewContent />
    </RouteGuard>
  );
}

function OverviewContent() {
  const params = useParams();
  const router = useRouter();
  const [internship, setInternship] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadInternshipData();
    }
  }, [params.id]);

  const loadInternshipData = async () => {
    try {
      setLoading(true);
      const [internshipRes, applicationsRes] = await Promise.all([
        apiClient.get(`/internships/${params.id}`),
        apiClient.get(`/internships/${params.id}/applications`).catch(() => ({ data: [] })),
      ]);

      setInternship(internshipRes.data);
      setApplications(applicationsRes.data || []);

      // Calculate stats
      const apps = applicationsRes.data || [];
      setStats({
        total: apps.length,
        submitted: apps.filter((a: any) => a.status === 'SUBMITTED').length,
        underReview: apps.filter((a: any) => a.status === 'UNDER_REVIEW').length,
        shortlisted: apps.filter((a: any) => a.status === 'SHORTLISTED').length,
        interviewed: apps.filter((a: any) => a.status === 'INTERVIEW_SCHEDULED').length,
        accepted: apps.filter((a: any) => a.status === 'ACCEPTED').length,
        rejected: apps.filter((a: any) => a.status === 'REJECTED').length,
      });
    } catch (error) {
      console.error('Failed to load internship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiClient.patch(`/internships/${params.id}`, { status: newStatus });
      loadInternshipData();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update internship status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="p-6">
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Internship not found"
          description="This internship does not exist or you don't have access to it"
          action={{
            label: "Back to Internships",
            onClick: () => router.push('/employer/internships')
          }}
        />
      </div>
    );
  }

  // Generate activity timeline
  const activityEvents = [
    {
      id: '1',
      title: 'Internship published',
      description: `Posted on ${new Date(internship.createdAt).toLocaleDateString()}`,
      timestamp: internship.createdAt,
      status: 'success' as const,
      actor: 'You',
    },
    ...applications.slice(0, 5).map((app: any, index: number) => ({
      id: `app-${index}`,
      title: `New application from ${app.student?.studentProfile?.fullName || app.student?.email}`,
      description: app.status,
      timestamp: app.createdAt,
      status: 'info' as const,
      actor: app.student?.studentProfile?.fullName || 'Student',
    }))
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/employer/internships')}
          className="mb-4"
        >
          ← Back to Internships
        </Button>
        
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{internship.title}</h1>
                <p className="text-indigo-100 text-lg">
                  {internship.company?.companyName || 'Your Company'}
                </p>
              </div>
              <StatusBadge status={internship.status} size="lg" />
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {internship.location}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ₹{internship.stipend?.toLocaleString()}/month
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {internship.duration} months
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {internship.mode || 'In-office'}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                variant="primary" 
                onClick={() => router.push(`/employer/internships/${params.id}/edit`)}
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                Edit Internship
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/employer/internships/${params.id}/kanban`)}
                className="border-white text-white hover:bg-white hover:text-indigo-600"
              >
                View Kanban
              </Button>
              {internship.status === 'PUBLISHED' ? (
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange('CLOSED')}
                  className="border-white text-white hover:bg-white hover:text-indigo-600"
                >
                  Close Internship
                </Button>
              ) : internship.status === 'DRAFT' ? (
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange('PUBLISHED')}
                  className="border-white text-white hover:bg-white hover:text-indigo-600"
                >
                  Publish Now
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Applications"
          value={stats?.total || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Shortlisted"
          value={stats?.shortlisted || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatCard
          title="Interview Scheduled"
          value={stats?.interviewed || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Accepted"
          value={stats?.accepted || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Internship Details */}
          <Card>
            <CardHeader>
              <CardTitle>Internship Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{internship.description}</p>
                </div>

                {internship.responsibilities && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Responsibilities</h3>
                    <p className="text-gray-700 whitespace-pre-line">{internship.responsibilities}</p>
                  </div>
                )}

                {internship.requiredSkills && internship.requiredSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {internship.requiredSkills.map((skill: string, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {internship.preferredSkills && internship.preferredSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Preferred Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {internship.preferredSkills.map((skill: string, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Start Date</h4>
                    <p className="text-gray-900">{new Date(internship.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">End Date</h4>
                    <p className="text-gray-900">{new Date(internship.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Openings</h4>
                    <p className="text-gray-900">{internship.openings} positions</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Application Deadline</h4>
                    <p className="text-gray-900">{new Date(internship.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={activityEvents} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Application Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Submitted', count: stats?.submitted, color: 'bg-blue-500' },
                  { label: 'Under Review', count: stats?.underReview, color: 'bg-yellow-500' },
                  { label: 'Shortlisted', count: stats?.shortlisted, color: 'bg-purple-500' },
                  { label: 'Interview', count: stats?.interviewed, color: 'bg-indigo-500' },
                  { label: 'Accepted', count: stats?.accepted, color: 'bg-green-500' },
                  { label: 'Rejected', count: stats?.rejected, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{item.count || 0}</span>
                  </div>
                ))}
              </div>
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
                  variant="primary" 
                  fullWidth
                  onClick={() => router.push(`/employer/internships/${params.id}/applications`)}
                >
                  View All Applications
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push(`/employer/internships/${params.id}/kanban`)}
                >
                  Open Kanban Board
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push(`/employer/internships/${params.id}/messages`)}
                >
                  Message Candidates
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => router.push(`/employer/internships/${params.id}/analytics`)}
                >
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Internship Info */}
          <Card>
            <CardHeader>
              <CardTitle>Internship Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(internship.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(internship.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="font-medium text-gray-900">{internship.views || 0}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="font-medium text-gray-900">
                    {internship.views ? ((stats?.total / internship.views) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
