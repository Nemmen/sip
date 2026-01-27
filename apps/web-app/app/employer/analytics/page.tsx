'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { internshipsApi, applicationsApi } from '@/lib/api';

export default function EmployerAnalyticsPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <AnalyticsContent />
    </RouteGuard>
  );
}

function AnalyticsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const internshipsRes = await internshipsApi.getMyInternships();
      const allInternships = internshipsRes.data || [];
      setInternships(allInternships);

      // Load applications for all internships
      const applicationsPromises = allInternships.map((internship: any) =>
        applicationsApi.getInternshipApplications(internship.id).catch(() => ({ data: [] }))
      );
      const applicationsResults = await Promise.all(applicationsPromises);
      const allApplications = applicationsResults.flatMap(res => res.data || []);
      setApplications(allApplications);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = {
    totalInternships: internships.length,
    activeInternships: internships.filter(i => i.status === 'PUBLISHED').length,
    draftInternships: internships.filter(i => i.status === 'DRAFT').length,
    closedInternships: internships.filter(i => i.status === 'CLOSED').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length,
    shortlistedApplications: applications.filter(a => a.status === 'SHORTLISTED').length,
    acceptedApplications: applications.filter(a => a.status === 'ACCEPTED').length,
    rejectedApplications: applications.filter(a => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length,
    totalViews: internships.reduce((sum, i) => sum + (i.viewCount || 0), 0),
  };

  // Calculate conversion rates
  const conversionRate = metrics.totalApplications > 0 
    ? ((metrics.acceptedApplications / metrics.totalApplications) * 100).toFixed(1) 
    : '0';

  const shortlistRate = metrics.totalApplications > 0 
    ? ((metrics.shortlistedApplications / metrics.totalApplications) * 100).toFixed(1) 
    : '0';

  // Top performing internships
  const topInternships = [...internships]
    .sort((a, b) => (b._count?.applications || 0) - (a._count?.applications || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your internship performance</p>
            </div>
            <Link href="/employer/dashboard">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Overview Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <div className="p-6">
                <p className="text-sm text-blue-700 font-medium">Total Internships</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{metrics.totalInternships}</p>
              </div>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <div className="p-6">
                <p className="text-sm text-green-700 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{metrics.activeInternships}</p>
              </div>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="p-6">
                <p className="text-sm text-yellow-700 font-medium">Draft</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{metrics.draftInternships}</p>
              </div>
            </Card>
            <Card className="bg-gray-50 border-gray-200">
              <div className="p-6">
                <p className="text-sm text-gray-700 font-medium">Closed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.closedInternships}</p>
              </div>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <div className="p-6">
                <p className="text-sm text-purple-700 font-medium">Total Views</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{metrics.totalViews}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Application Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="bg-indigo-50 border-indigo-200">
              <div className="p-6">
                <p className="text-sm text-indigo-700 font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-indigo-900 mt-2">{metrics.totalApplications}</p>
              </div>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="p-6">
                <p className="text-sm text-yellow-700 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{metrics.pendingApplications}</p>
              </div>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <div className="p-6">
                <p className="text-sm text-blue-700 font-medium">Shortlisted</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{metrics.shortlistedApplications}</p>
              </div>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <div className="p-6">
                <p className="text-sm text-green-700 font-medium">Accepted</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{metrics.acceptedApplications}</p>
              </div>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <div className="p-6">
                <p className="text-sm text-red-700 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900 mt-2">{metrics.rejectedApplications}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Conversion Rates */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-blue-600">{conversionRate}%</p>
                  <p className="text-sm text-gray-600 pb-1">applications → accepted</p>
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${conversionRate}%` }}
                  />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-2">Shortlist Rate</p>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-purple-600">{shortlistRate}%</p>
                  <p className="text-sm text-gray-600 pb-1">applications → shortlisted</p>
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: `${shortlistRate}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Top Performing Internships */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Internships</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internship</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topInternships.length > 0 ? (
                    topInternships.map((internship: any) => (
                      <tr key={internship.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{internship.title}</p>
                            <p className="text-sm text-gray-600">{internship.location}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            internship.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                            internship.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {internship.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {internship._count?.applications || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{internship.viewCount || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/employer/internships/${internship.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View Details →
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                        No internships posted yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
