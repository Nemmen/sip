'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { internshipsApi } from '@/lib/api';

/**
 * Student Internship Detail Page
 * 
 * Purpose: Display detailed information about a specific internship
 * allowing students to review before applying.
 * 
 * Features:
 * - Fetch and display internship details
 * - Show company/employer information
 * - Display skills, responsibilities, benefits
 * - "Apply Now" button (disabled if not PUBLISHED)
 * - Responsive layout with clean design
 * 
 * Integration:
 * - Uses existing internshipsApi.getOne(id) endpoint
 * - Navigates to /student/internships/[id]/apply on apply
 * - Protected by RouteGuard (STUDENT role)
 * - Uses existing UI components (Card, Badge, Button)
 * 
 * Safety:
 * - No modifications to backend APIs
 * - No modifications to employer pages
 * - No modifications to shared hooks
 * - Isolated to student flow only
 */

export default function InternshipDetailPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <InternshipDetailContent />
    </RouteGuard>
  );
}

function InternshipDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadInternship();
    }
  }, [id]);

  const loadInternship = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await internshipsApi.getOne(id);
      setInternship(response.data);
    } catch (err: any) {
      console.error('Failed to load internship:', err);
      setError(err.response?.data?.message || 'Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyNow = () => {
    router.push(`/student/internships/${id}/apply`);
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'PUBLISHED') return 'success';
    if (status === 'DRAFT') return 'warning';
    if (status === 'CLOSED') return 'default';
    return 'default';
  };

  const canApply = internship?.status === 'PUBLISHED';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !internship) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-4">
            <Link href="/student/internships">
              <Button variant="outline" size="sm">← Back to Browse</Button>
            </Link>
          </div>
        </header>
        <div className="container-custom py-8">
          <Alert variant="error">{error}</Alert>
        </div>
      </div>
    );
  }

  if (!internship) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/student/internships">
                <Button variant="outline" size="sm">← Back</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">{internship.title}</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {internship.employer?.companyProfile?.companyName || 'Company'}
                </p>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(internship.status)} size="lg">
              {internship.status}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>About This Internship</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Description</h3>
                    <p className="text-[var(--primary)] whitespace-pre-wrap">{internship.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">📍 Location</h3>
                      <p className="text-[var(--primary)]">{internship.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">💼 Type</h3>
                      <p className="text-[var(--primary)]">{internship.type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">⏱️ Duration</h3>
                      <p className="text-[var(--primary)]">{internship.duration} months</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">💰 Stipend</h3>
                      <p className="text-[var(--primary)] font-semibold">
                        ₹{internship.stipend?.toLocaleString()}/month
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Required Skills */}
            {internship.requiredSkills && internship.requiredSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {internship.requiredSkills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="info" size="lg">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferred Skills */}
            {internship.preferredSkills && internship.preferredSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {internship.preferredSkills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="default" size="lg">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-3">
                    These skills are a plus but not mandatory
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Responsibilities */}
            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {internship.responsibilities.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-[var(--accent)] mt-1 text-lg">✓</span>
                        <span className="text-[var(--primary)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {internship.benefits && internship.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {internship.benefits.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-500 mt-1 text-lg">🎁</span>
                        <span className="text-[var(--primary)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apply Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Ready to Apply?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canApply ? (
                  <>
                    <Button
                      variant="primary"
                      fullWidth
                      size="lg"
                      onClick={handleApplyNow}
                    >
                      Apply Now →
                    </Button>
                    <p className="text-xs text-center text-[var(--text-secondary)]">
                      You'll be redirected to the application form
                    </p>
                  </>
                ) : (
                  <>
                    <Button variant="outline" fullWidth size="lg" disabled>
                      Applications Closed
                    </Button>
                    <Alert variant="warning" className="text-sm">
                      This internship is currently not accepting applications.
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {internship.applicationDeadline && (
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                      📅 Application Deadline
                    </h3>
                    <p className="text-[var(--primary)] font-semibold">
                      {new Date(internship.applicationDeadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {Math.ceil(
                        (new Date(internship.applicationDeadline).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days left
                    </p>
                  </div>
                )}

                {internship.startDate && (
                  <div className="pt-3 border-t">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                      🚀 Start Date
                    </h3>
                    <p className="text-[var(--primary)]">
                      {new Date(internship.startDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            {internship.employer?.companyProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>About the Company</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--primary)]">
                      {internship.employer.companyProfile.companyName}
                    </h3>
                    {internship.employer.companyProfile.industry && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {internship.employer.companyProfile.industry}
                      </p>
                    )}
                  </div>

                  {internship.employer.companyProfile.description && (
                    <p className="text-sm text-[var(--primary)]">
                      {internship.employer.companyProfile.description}
                    </p>
                  )}

                  {internship.employer.companyProfile.website && (
                    <a
                      href={internship.employer.companyProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      🌐 Visit website →
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Internship Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">👀 Views</span>
                  <span className="text-lg font-semibold text-[var(--primary)]">
                    {internship.viewCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-[var(--text-secondary)]">📝 Applications</span>
                  <span className="text-lg font-semibold text-[var(--primary)]">
                    {internship._count?.applications || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tip Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-[var(--primary)] mb-1">Pro Tip</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Review the required skills carefully and prepare your resume highlighting
                      relevant experience before applying.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
