'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useInternships } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { FilterBar } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function BrowseInternshipsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <BrowseInternshipsContent />
    </RouteGuard>
  );
}

function BrowseInternshipsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    location: '',
    minStipend: '',
    mode: '',
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const { data: internships, loading } = useInternships(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      skills: '',
      location: '',
      minStipend: '',
      mode: '',
    });
    setActiveFilters([]);
  };

  // Get active filter count
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value !== '').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/student/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        
        <Card className="bg-[var(--primary)] text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Explore Internships 🚀</h1>
                <p className="text-white/70 text-lg">
                  {internships?.length || 0} opportunities waiting for you
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/70">Your Profile</div>
                <div className="mt-2">
                  <UserAvatar 
                    name={user?.studentProfile?.fullName}
                    email={user?.email}
                    size="md"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filter Internships</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all ({activeFilterCount})
              </Button>
            )}
          </div>
          <FilterBar
            filters={[
              {
                type: 'search',
                placeholder: 'Search by title or company...',
                value: filters.search,
                onChange: (value) => handleFilterChange('search', value),
              },
              {
                type: 'text',
                label: 'Skills',
                placeholder: 'e.g., React, Python',
                value: filters.skills,
                onChange: (value) => handleFilterChange('skills', value),
              },
              {
                type: 'text',
                label: 'Location',
                placeholder: 'City or Remote',
                value: filters.location,
                onChange: (value) => handleFilterChange('location', value),
              },
              {
                type: 'select',
                label: 'Work Mode',
                value: filters.mode,
                onChange: (value) => handleFilterChange('mode', value),
                options: [
                  { label: 'All Modes', value: '' },
                  { label: 'In-office', value: 'IN_OFFICE' },
                  { label: 'Remote', value: 'REMOTE' },
                  { label: 'Hybrid', value: 'HYBRID' },
                ],
              },
              {
                type: 'number',
                label: 'Min Stipend',
                placeholder: '₹5,000',
                value: filters.minStipend,
                onChange: (value) => handleFilterChange('minStipend', value),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : internships && internships.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {internships.map((internship: any) => (
            <Card 
              key={internship.id} 
              className="hover:shadow-xl hover:border-[var(--accent)] transition-all cursor-pointer group"
              onClick={() => router.push(`/student/internships/${internship.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <UserAvatar 
                        name={internship.company?.companyName}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--primary)] group-hover:text-[var(--accent)] transition mb-1">
                          {internship.title}
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-2">
                          {internship.company?.companyName || 'Company Name'}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                          {internship.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={internship.status} />
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)] mb-4 ml-20">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {internship.duration} months
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {internship.mode || 'In-office'}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Starts {new Date(internship.startDate).toLocaleDateString()}
                  </div>
                </div>

                {internship.requiredSkills && internship.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 ml-20">
                    {internship.requiredSkills.slice(0, 5).map((skill: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--primary)] text-xs font-semibold border border-[var(--accent)]/30"
                      >
                        {skill}
                      </span>
                    ))}
                    {internship.requiredSkills.length > 5 && (
                      <span className="px-3 py-1 bg-[var(--background)] text-[var(--text-secondary)] text-xs border border-[var(--border)]">
                        +{internship.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-3 ml-20">
                  <Button 
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/student/internships/${internship.id}`);
                    }}
                  >
                    View Details →
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/student/internships/${internship.id}/apply`);
                    }}
                  >
                    Quick Apply
                  </Button>
                  {internship._count?.applications && (
                    <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)] px-3 py-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {internship._count.applications} applicants
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No internships found"
          description="Try adjusting your filters or check back later for new opportunities"
          action={{
            label: "Clear Filters",
            onClick: clearFilters
          }}
        />
      )}
    </div>
  );
}
