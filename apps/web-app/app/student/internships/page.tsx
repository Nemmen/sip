'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useInternships } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';

export default function BrowseInternshipsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <BrowseInternshipsContent />
    </RouteGuard>
  );
}

function BrowseInternshipsContent() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    location: '',
    minStipend: '',
  });

  const { data: internships, loading } = useInternships(filters);

  const handleApplyFilters = () => {
    // Filters are already reactive through useInternships hook
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Browse Internships</h1>
              <p className="text-sm text-[var(--text-secondary)]">Find your perfect opportunity</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search internships..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Input
                placeholder="Skills (e.g., React, Python)"
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
              <Input
                placeholder="Min Stipend"
                type="number"
                value={filters.minStipend}
                onChange={(e) => setFilters({ ...filters, minStipend: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : internships && internships.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {internships.map((internship: any) => (
              <Card key={internship.id} className="hover:shadow-lg transition">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[var(--primary)] mb-2">
                        {internship.title}
                      </h3>
                      <p className="text-[var(--text-secondary)] mb-3">
                        {internship.employer?.companyProfile?.companyName || 'Company'}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">
                        {internship.description}
                      </p>
                    </div>
                    <Badge variant={internship.status === 'OPEN' ? 'success' : 'default'}>
                      {internship.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)] mb-4">
                    <span>📍 {internship.location}</span>
                    <span>💰 ₹{internship.stipend?.toLocaleString()}/month</span>
                    <span>⏱️ {internship.duration} months</span>
                    <span>📅 Start: {new Date(internship.startDate).toLocaleDateString()}</span>
                  </div>

                  {internship.skillsRequired && internship.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {internship.skillsRequired.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="info" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/student/internships/${internship.id}`}>
                      <Button variant="primary">View Details</Button>
                    </Link>
                    <Link href={`/student/internships/${internship.id}/apply`}>
                      <Button variant="outline">Apply Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-[var(--primary)] mb-2">
                No internships found
              </h3>
              <p className="text-[var(--text-secondary)]">
                Try adjusting your filters to see more results
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
