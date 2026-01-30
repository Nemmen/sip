'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatCard } from '@/components/ui/StatCard';
import { adminApi } from '@/lib/api';

export default function AdminAnalyticsPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminAnalyticsContent />
    </RouteGuard>
  );
}

function AdminAnalyticsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [usersRes, internshipsRes, applicationsRes, kycRes] = await Promise.all([
        adminApi.users.getAll().catch(() => ({ data: [] })),
        adminApi.internships.getAll().catch(() => ({ data: [] })),
        adminApi.applications.getAll().catch(() => ({ data: [] })),
        adminApi.kyc.getAll().catch(() => ({ data: [] })),
      ]);

      const users = usersRes.data?.data || usersRes.data || [];
      const internships = internshipsRes.data?.data || internshipsRes.data || [];
      const applications = applicationsRes.data?.data || applicationsRes.data || [];
      const kyc = kycRes.data?.data || kycRes.data || [];

      // Calculate growth metrics (mock data for demonstration)
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentUsers = users.filter((u: any) => new Date(u.createdAt) >= last30Days).length;
      const recentInternships = internships.filter((i: any) => new Date(i.createdAt) >= last30Days).length;
      const recentApplications = applications.filter((a: any) => new Date(a.createdAt) >= last30Days).length;

      // Calculate conversion rates
      const conversionRate = internships.length > 0 
        ? ((applications.length / internships.length) * 100).toFixed(1)
        : '0';

      const acceptanceRate = applications.length > 0
        ? ((applications.filter((a: any) => a.status === 'ACCEPTED').length / applications.length) * 100).toFixed(1)
        : '0';

      // User distribution
      const students = users.filter((u: any) => u.role === 'STUDENT');
      const employers = users.filter((u: any) => u.role === 'EMPLOYER');

      // Application status distribution
      const applicationsByStatus = {
        submitted: applications.filter((a: any) => a.status === 'SUBMITTED').length,
        underReview: applications.filter((a: any) => a.status === 'UNDER_REVIEW').length,
        shortlisted: applications.filter((a: any) => a.status === 'SHORTLISTED').length,
        interviewScheduled: applications.filter((a: any) => a.status === 'INTERVIEW_SCHEDULED').length,
        accepted: applications.filter((a: any) => a.status === 'ACCEPTED').length,
        rejected: applications.filter((a: any) => a.status === 'REJECTED').length,
      };

      // Internship distribution
      const internshipsByStatus = {
        published: internships.filter((i: any) => i.status === 'PUBLISHED').length,
        draft: internships.filter((i: any) => i.status === 'DRAFT').length,
        closed: internships.filter((i: any) => i.status === 'CLOSED').length,
      };

      // Top employers by internships
      const employerStats = employers.map((emp: any) => ({
        name: emp.companyProfile?.companyName || emp.email,
        internships: internships.filter((i: any) => i.employerId === emp.id).length,
        applications: applications.filter((a: any) => a.internship?.employerId === emp.id).length,
      })).sort((a, b) => b.internships - a.internships).slice(0, 5);

      setData({
        users: {
          total: users.length,
          students: students.length,
          employers: employers.length,
          growth: recentUsers,
        },
        internships: {
          total: internships.length,
          ...internshipsByStatus,
          growth: recentInternships,
        },
        applications: {
          total: applications.length,
          ...applicationsByStatus,
          growth: recentApplications,
        },
        kyc: {
          total: kyc.length,
          approved: kyc.filter((k: any) => k.status === 'APPROVED').length,
          pending: kyc.filter((k: any) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length,
          rejected: kyc.filter((k: any) => k.status === 'REJECTED').length,
        },
        metrics: {
          conversionRate,
          acceptanceRate,
        },
        topEmployers: employerStats,
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
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
          onClick={() => router.push('/admin/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        
        <Card className="bg-[var(--primary)] text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Platform Analytics 📊</h1>
                <p className="text-blue-100 text-lg">
                  Comprehensive platform insights and metrics
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">Last Updated</div>
                <div className="text-lg font-medium">{new Date().toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={data?.users.total || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          change={{ value: data?.users.growth || 0, isPositive: true, label: 'this month' }}
        />
        <StatCard
          title="Total Internships"
          value={data?.internships.total || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          change={{ value: data?.internships.growth || 0, isPositive: true, label: 'this month' }}
        />
        <StatCard
          title="Total Applications"
          value={data?.applications.total || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          change={{ value: data?.applications.growth || 0, isPositive: true, label: 'this month' }}
        />
        <StatCard
          title="Conversion Rate"
          value={`${data?.metrics.conversionRate}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Charts and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Students</span>
                  <span className="text-lg font-bold text-blue-600">{data?.users.students}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${data?.users.total > 0 ? (data.users.students / data.users.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data?.users.total > 0 ? ((data.users.students / data.users.total) * 100).toFixed(1) : 0}% of total users
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Employers</span>
                  <span className="text-lg font-bold text-purple-600">{data?.users.employers}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${data?.users.total > 0 ? (data.users.employers / data.users.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data?.users.total > 0 ? ((data.users.employers / data.users.total) * 100).toFixed(1) : 0}% of total users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internship Status */}
        <Card>
          <CardHeader>
            <CardTitle>Internship Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Published</p>
                  <p className="text-xs text-gray-500">Active internships</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{data?.internships.published}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Draft</p>
                  <p className="text-xs text-gray-500">Pending publish</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{data?.internships.draft}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Closed</p>
                  <p className="text-xs text-gray-500">No longer active</p>
                </div>
                <p className="text-2xl font-bold text-gray-600">{data?.internships.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Pipeline */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Application Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{data?.applications.submitted}</p>
              <p className="text-xs text-gray-600 mt-1">Submitted</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{data?.applications.underReview}</p>
              <p className="text-xs text-gray-600 mt-1">Under Review</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{data?.applications.shortlisted}</p>
              <p className="text-xs text-gray-600 mt-1">Shortlisted</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{data?.applications.interviewScheduled}</p>
              <p className="text-xs text-gray-600 mt-1">Interview</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{data?.applications.accepted}</p>
              <p className="text-xs text-gray-600 mt-1">Accepted</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{data?.applications.rejected}</p>
              <p className="text-xs text-gray-600 mt-1">Rejected</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[var(--background)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Acceptance Rate</p>
                <p className="text-xs text-gray-500">Accepted / Total Applications</p>
              </div>
              <p className="text-3xl font-bold text-[var(--primary)]">{data?.metrics.acceptanceRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Employers */}
      {data?.topEmployers && data.topEmployers.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Employers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topEmployers.map((employer: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{employer.name}</p>
                      <p className="text-xs text-gray-500">
                        {employer.internships} internships • {employer.applications} applications
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{employer.internships}</p>
                    <p className="text-xs text-gray-500">internships</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{data?.kyc.approved}</p>
                </div>
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{data?.kyc.pending}</p>
                </div>
                <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{data?.kyc.rejected}</p>
                </div>
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
