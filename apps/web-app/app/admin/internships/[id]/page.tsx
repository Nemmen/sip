'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { internshipsApi } from '@/lib/api';

export default function AdminInternshipDetailsPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminInternshipDetailsContent />
    </RouteGuard>
  );
}

function AdminInternshipDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const internshipId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInternshipDetails();
  }, [internshipId]);

  const loadInternshipDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [internshipRes, applicationsRes] = await Promise.all([
        internshipsApi.getOne(internshipId),
        internshipsApi.getApplications(internshipId).catch(() => ({ data: [] })),
      ]);

      setInternship(internshipRes.data);
      setApplications(applicationsRes.data || []);
    } catch (err: any) {
      console.error('Failed to load internship:', err);
      setError(err.response?.data?.message || 'Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      if (newStatus === 'PUBLISHED') {
        await internshipsApi.publish(internshipId);
      } else if (newStatus === 'CLOSED') {
        await internshipsApi.close(internshipId);
      }
      await loadInternshipDetails();
    } catch (err: any) {
      console.error('Failed to change status:', err);
      alert(err.response?.data?.message || 'Failed to change status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this internship? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await internshipsApi.delete(internshipId);
      router.push('/admin/internships');
    } catch (err: any) {
      console.error('Failed to delete internship:', err);
      alert(err.response?.data?.message || 'Failed to delete internship');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="p-6">
        <Alert variant="error">Internship not found</Alert>
        <Button onClick={() => router.push('/admin/internships')} className="mt-4">
          ← Back to Internships
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/internships')}
          className="mb-4"
        >
          ← Back to Internships
        </Button>
        
        <Card className="bg-[var(--primary)] text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{internship.title}</h1>
                  <StatusBadge status={internship.status} />
                </div>
                <p className="text-white/80">
                  {internship.company || internship.employer?.companyProfile?.companyName} • {internship.location}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {internship.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={() => handleStatusChange('PUBLISHED')}
                disabled={actionLoading}
              >
                ✓ Publish Internship
              </Button>
            )}
            {internship.status === 'PUBLISHED' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('CLOSED')}
                disabled={actionLoading}
              >
                🔒 Close Internship
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/internships/${internshipId}/edit`)}
            >
              ✏️ Edit Details
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              🗑️ Delete Internship
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{internship.description}</p>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {internship.responsibilities && internship.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {internship.responsibilities.map((resp: string, index: number) => (
                    <li key={index} className="text-gray-700">{resp}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Skills Required */}
          {internship.requiredSkills && internship.requiredSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {internship.requiredSkills.map((skill: string, index: number) => (
                    <Badge key={index} variant="primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Applications ({applications.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/internships/${internshipId}/applications`)}
                >
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-gray-600">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app: any) => (
                    <div key={app.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {app.student?.studentProfile?.fullName || app.student?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Applied {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                    </div>
                  ))}
                  {applications.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      and {applications.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Details */}
          <Card>
            <CardHeader>
              <CardTitle>Key Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900">{internship.type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">{internship.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{internship.duration} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stipend</p>
                  <p className="font-semibold text-gray-900">₹{internship.stipend?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={internship.status} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="font-semibold text-gray-900">
                    {internship.company || internship.employer?.companyProfile?.companyName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm text-gray-900">{internship.employer?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">KYC Status</p>
                  <StatusBadge status={internship.employer?.kycStatus || 'NOT_SUBMITTED'} size="sm" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => router.push(`/admin/users/${internship.employerId}`)}
                >
                  View Employer Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Posted On</p>
                  <p className="text-sm text-gray-900">
                    {new Date(internship.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {internship.applicationDeadline && (
                  <div>
                    <p className="text-sm text-gray-600">Application Deadline</p>
                    <p className="text-sm text-gray-900">
                      {new Date(internship.applicationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {internship.startDate && (
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(internship.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(internship.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Applications</span>
                  <span className="text-lg font-bold text-gray-900">{applications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Shortlisted</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {applications.filter(a => a.status === 'SHORTLISTED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Accepted</span>
                  <span className="text-lg font-bold text-green-600">
                    {applications.filter(a => a.status === 'ACCEPTED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="text-lg font-bold text-red-600">
                    {applications.filter(a => a.status === 'REJECTED').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
