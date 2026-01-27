'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { applicationsApi } from '@/lib/api';

export default function StudentAnalyticsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <AnalyticsContent />
    </RouteGuard>
  );
}

function AnalyticsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await applicationsApi.getMyApplications();
      setApplications(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = {
    totalApplications: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    underReview: applications.filter(a => a.status === 'UNDER_REVIEW').length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
    withdrawn: applications.filter(a => a.status === 'WITHDRAWN').length,
  };

  // Calculate rates
  const successRate = metrics.totalApplications > 0 
    ? ((metrics.accepted / metrics.totalApplications) * 100).toFixed(1) 
    : '0';

  const responseRate = metrics.totalApplications > 0 
    ? (((metrics.accepted + metrics.rejected + metrics.shortlisted) / metrics.totalApplications) * 100).toFixed(1) 
    : '0';

  const shortlistRate = metrics.totalApplications > 0 
    ? (((metrics.shortlisted + metrics.accepted) / metrics.totalApplications) * 100).toFixed(1) 
    : '0';

  // Recent applications
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5);

  // Status distribution
  const statusDistribution = [
    { status: 'PENDING', count: metrics.pending, color: 'bg-yellow-500' },
    { status: 'UNDER_REVIEW', count: metrics.underReview, color: 'bg-blue-500' },
    { status: 'SHORTLISTED', count: metrics.shortlisted, color: 'bg-purple-500' },
    { status: 'ACCEPTED', count: metrics.accepted, color: 'bg-green-500' },
    { status: 'REJECTED', count: metrics.rejected, color: 'bg-red-500' },
  ].filter(item => item.count > 0);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    SHORTLISTED: 'bg-purple-100 text-purple-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    WITHDRAWN: 'bg-gray-100 text-gray-800',
  };

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
              <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
              <p className="text-gray-600 mt-1">Track your application performance</p>
            </div>
            <Link href="/student/dashboard">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <div className="p-6">
                <p className="text-sm text-blue-700 font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{metrics.totalApplications}</p>
              </div>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <div className="p-6">
                <p className="text-sm text-green-700 font-medium">Accepted</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{metrics.accepted}</p>
              </div>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <div className="p-6">
                <p className="text-sm text-purple-700 font-medium">Shortlisted</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{metrics.shortlisted}</p>
              </div>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="p-6">
                <p className="text-sm text-yellow-700 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{metrics.pending + metrics.underReview}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-green-600">{successRate}%</p>
                  <p className="text-sm text-gray-600 pb-1">applications → accepted</p>
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full" 
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-2">Shortlist Rate</p>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-purple-600">{shortlistRate}%</p>
                  <p className="text-sm text-gray-600 pb-1">got shortlisted</p>
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: `${shortlistRate}%` }}
                  />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-2">Response Rate</p>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-blue-600">{responseRate}%</p>
                  <p className="text-sm text-gray-600 pb-1">got responses</p>
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${responseRate}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Application Status Distribution */}
        {metrics.totalApplications > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Distribution</h2>
            <Card>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {statusDistribution.map(item => (
                    <div key={item.status} className="text-center">
                      <div className={`${item.color} w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl mb-2`}>
                        {item.count}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.status.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-600">
                        {((item.count / metrics.totalApplications) * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Visual bar */}
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden flex">
                  {statusDistribution.map(item => (
                    <div
                      key={item.status}
                      className={item.color}
                      style={{ width: `${(item.count / metrics.totalApplications) * 100}%` }}
                      title={`${item.status}: ${item.count}`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recent Applications */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Applications</h2>
          <Card>
            {recentApplications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentApplications.map((app: any) => (
                  <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {app.internship?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {app.internship?.company} • {app.internship?.location}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Applied on {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[app.status] || 'bg-gray-100 text-gray-800'}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                        <Link href={`/student/applications/${app.id}`}>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Details →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-600">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">No applications yet</p>
                <p className="text-sm mt-2">Start applying to internships to see your analytics</p>
                <Link href="/student/internships">
                  <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Browse Internships
                  </button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
