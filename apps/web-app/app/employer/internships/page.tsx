'use client';

import { useRouter } from 'next/navigation';
import { useEmployerInternships } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { useState } from 'react';

export default function EmployerInternshipsPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <EmployerInternshipsContent />
    </RouteGuard>
  );
}

function EmployerInternshipsContent() {
  const router = useRouter();
  const { data: internships, loading } = useEmployerInternships();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInternships = (internships || []).filter((internship: any) => {
    const matchesFilter = filter === 'ALL' || internship.status === filter;
    const matchesSearch = !searchQuery || 
      internship.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: internships?.length || 0,
    published: internships?.filter((i: any) => i.status === 'PUBLISHED').length || 0,
    draft: internships?.filter((i: any) => i.status === 'DRAFT').length || 0,
    closed: internships?.filter((i: any) => i.status === 'CLOSED').length || 0,
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
                <h1 className="text-3xl font-bold mb-2">My Internships 📋</h1>
                <p className="text-indigo-100 text-lg">
                  Manage your internship postings and track applications
                </p>
              </div>
              <Button 
                variant="primary"
                onClick={() => router.push('/employer/internships/new')}
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                + Post New Internship
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Internships"
          value={stats.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          title="Published"
          value={stats.published}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Drafts"
          value={stats.draft}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <FilterBar
            filters={[
              {
                type: 'search',
                placeholder: 'Search internships...',
                value: searchQuery,
                onChange: setSearchQuery,
              },
              {
                type: 'select',
                label: 'Status',
                value: filter,
                onChange: setFilter,
                options: [
                  { label: 'All Status', value: 'ALL' },
                  { label: 'Published', value: 'PUBLISHED' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Closed', value: 'CLOSED' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Internships List */}
      {filteredInternships.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredInternships.map((internship: any) => (
            <Card 
              key={internship.id}
              className="hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer"
              onClick={() => router.push(`/employer/internships/${internship.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {internship.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {internship.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ₹{internship.stipend?.toLocaleString()}/month
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {internship.duration} months
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {internship._count?.applications || 0} applications
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={internship.status} />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/employer/internships/${internship.id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/employer/internships/${internship.id}/edit`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/employer/internships/${internship.id}/kanban`);
                    }}
                  >
                    Kanban Board
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title={searchQuery ? "No internships match your search" : "No internships yet"}
          description={searchQuery ? "Try adjusting your search criteria" : "Post your first internship to start hiring talented students"}
          action={{
            label: searchQuery ? "Clear Search" : "Post Internship",
            onClick: () => searchQuery ? setSearchQuery('') : router.push('/employer/internships/new')
          }}
        />
      )}
    </div>
  );
}
