'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { internshipsApi, applicationsApi } from '@/lib/api';
import {
  ApplicationStatus,
  UserRole,
  canTransition,
  getAllowedActions,
  isTerminalStatus,
  getTransitionBlockReason,
} from '@/domain/application';

// ============================================================================
// COMPONENT
// ============================================================================

export default function InternshipDetailPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
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
  const [actionLoading, setActionLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  
  // Bulk actions state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadInternship();
    }
  }, [id]);

  useEffect(() => {
    if (internship && (internship.status === 'PUBLISHED' || internship.status === 'CLOSED')) {
      loadApplications();
    }
  }, [internship?.status]);

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

  const refreshInternship = async () => {
    try {
      const response = await internshipsApi.getOne(id);
      setInternship(response.data);
    } catch (err: any) {
      console.error('Failed to refresh internship:', err);
      setError(err.response?.data?.message || 'Failed to refresh internship details');
    }
  };

  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await applicationsApi.getInternshipApplications(id);
      setApplications(response.data || []);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      // Don't show error for applications - it's secondary data
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      await internshipsApi.publish(id);
      router.push('/employer/internships');
    } catch (err: any) {
      console.error('Failed to publish internship:', err);
      setError(err.response?.data?.message || 'Failed to publish internship. Make sure your KYC is approved.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      setActionLoading(true);
      await internshipsApi.close(id);
      setShowCloseModal(false);
      // Reload internship data to show updated status without full page loading
      await refreshInternship();
    } catch (err: any) {
      console.error('Failed to close internship:', err);
      setError(err.response?.data?.message || 'Failed to close internship');
      setShowCloseModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await internshipsApi.delete(id);
      setShowDeleteModal(false);
      router.push('/employer/internships');
    } catch (err: any) {
      console.error('Failed to delete internship:', err);
      setError(err.response?.data?.message || 'Failed to delete internship');
      setShowDeleteModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const getApplicationStatusBadgeVariant = (status: string) => {
    const statusMap: Record<string, any> = {
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      SHORTLISTED: 'success',
      INTERVIEW_SCHEDULED: 'info',
      ACCEPTED: 'success',
      REJECTED: 'danger',
      WITHDRAWN: 'default',
    };
    return statusMap[status] || 'default';
  };

  /**
   * Render status badge with terminal state indicator.
   */
  const renderStatusBadge = (status: string) => {
    const variant = getApplicationStatusBadgeVariant(status);
    const isTerminal = isTerminalStatus(status);
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={variant}>
          {status.replace(/_/g, ' ')}
        </Badge>
        {isTerminal && (
          <span className="text-xs text-gray-500" title="Final status - no further actions">
            🔒
          </span>
        )}
      </div>
    );
  };

  const handleStatusChange = async (applicationId: string, newStatus: string, interviewDateTime?: string, notes?: string) => {
    try {
      setUpdatingAppId(applicationId);
      await applicationsApi.updateStatus(applicationId, newStatus, interviewDateTime, notes);
      
      // Update local state optimistically
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus, interviewDate: interviewDateTime, interviewNotes: notes } : app
        )
      );
      
      // Close modals
      setShowRejectModal(false);
      setShowAcceptModal(false);
      setShowInterviewModal(false);
      setSelectedApplication(null);
      setInterviewDate('');
      setInterviewNotes('');
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const openRejectModal = (application: any) => {
    setSelectedApplication(application);
    setShowRejectModal(true);
  };

  const openAcceptModal = (application: any) => {
    setSelectedApplication(application);
    setShowAcceptModal(true);
  };

  const openInterviewModal = (application: any) => {
    setSelectedApplication(application);
    // Set default interview date to tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setInterviewDate(tomorrow.toISOString().slice(0, 16));
    setInterviewNotes('');
    setShowInterviewModal(true);
  };

  // Bulk action handlers
  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const toggleSelectApplication = (appId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApplications(newSelected);
  };

  const handleBulkAction = async (targetStatus: string) => {
    if (selectedApplications.size === 0) return;

    const confirmMessage = `Are you sure you want to ${targetStatus.toLowerCase().replace('_', ' ')} ${selectedApplications.size} application(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      setBulkActionLoading(true);
      setError('');

      // Update all selected applications
      await Promise.all(
        Array.from(selectedApplications).map(appId =>
          applicationsApi.updateStatus(appId, targetStatus)
        )
      );

      // Refresh applications list
      await loadApplications();
      setSelectedApplications(new Set());
    } catch (err: any) {
      console.error('Bulk action failed:', err);
      setError(err.response?.data?.message || 'Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'SUBMITTED') return app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW';
    if (statusFilter === 'SHORTLISTED') return app.status === 'SHORTLISTED';
    if (statusFilter === 'INTERVIEW') return app.status === 'INTERVIEW_SCHEDULED';
    if (statusFilter === 'ACCEPTED') return app.status === 'ACCEPTED';
    if (statusFilter === 'REJECTED') return app.status === 'REJECTED' || app.status === 'WITHDRAWN';
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'PUBLISHED') return 'success';
    if (status === 'DRAFT') return 'warning';
    if (status === 'CLOSED') return 'default';
    return 'default';
  };

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
            <Link href="/employer/internships">
              <Button variant="outline" size="sm">← Back to Internships</Button>
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
              <Link href="/employer/internships">
                <Button variant="outline" size="sm">← Back</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">{internship.title}</h1>
                <p className="text-sm text-[var(--text-secondary)]">Manage internship details</p>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(internship.status)} size="lg">
              {internship.status}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/employer/internships/${id}/kanban`}>
                    <Button variant="primary">
                      📋 Kanban Board
                    </Button>
                  </Link>
                  <Link href={`/employer/internships/${id}/edit`}>
                    <Button variant="outline">
                      ✏️ Edit Internship
                    </Button>
                  </Link>
                  {internship.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      onClick={handlePublish}
                      disabled={actionLoading}
                    >
                      Publish
                    </Button>
                  )}
                  {internship.status === 'PUBLISHED' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCloseModal(true)}
                      disabled={actionLoading}
                    >
                      Close Internship
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Description</h3>
                    <p className="text-[var(--primary)] whitespace-pre-wrap">{internship.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Type</h3>
                      <p className="text-[var(--primary)]">{internship.type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Location</h3>
                      <p className="text-[var(--primary)]">{internship.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Duration</h3>
                      <p className="text-[var(--primary)]">{internship.duration} months</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Stipend</h3>
                      <p className="text-[var(--primary)]">₹{internship.stipend?.toLocaleString()}/month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {internship.requiredSkills && internship.requiredSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {internship.requiredSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="info">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {internship.preferredSkills && internship.preferredSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Preferred Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {internship.preferredSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="default">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {internship.responsibilities.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
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
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {internship.benefits.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-[var(--primary)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Application Deadline</h3>
                    <p className="text-[var(--primary)]">
                      {new Date(internship.applicationDeadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Start Date</h3>
                    <p className="text-[var(--primary)]">
                      {new Date(internship.startDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Posted On</h3>
                    <p className="text-[var(--primary)]">
                      {new Date(internship.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
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
                    <span className="text-sm text-[var(--text-secondary)]">Views</span>
                    <span className="font-semibold text-[var(--primary)]">{internship.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Applications</span>
                    <span className="font-semibold text-[var(--primary)]">
                      {internship._count?.applications || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Max Applicants</span>
                    <span className="font-semibold text-[var(--primary)]">{internship.maxApplicants}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* DRAFT Status Actions */}
                  {internship.status === 'DRAFT' && (
                    <>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handlePublish}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Publishing...</span>
                          </>
                        ) : (
                          '🚀 Publish Internship'
                        )}
                      </Button>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Make this internship visible to students
                      </p>
                    </>
                  )}

                  {/* PUBLISHED Status Actions */}
                  {internship.status === 'PUBLISHED' && (
                    <>
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => setShowCloseModal(true)}
                        disabled={actionLoading}
                      >
                        🔒 Close Applications
                      </Button>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Stop accepting new applications
                      </p>
                    </>
                  )}

                  {/* Edit Button (All Statuses) */}
                  <Link href={`/employer/internships/${id}/edit`}>
                    <Button variant="outline" fullWidth>
                      ✏️ Edit Details
                    </Button>
                  </Link>

                  {/* Kanban Board (PUBLISHED or CLOSED) */}
                  {(internship.status === 'PUBLISHED' || internship.status === 'CLOSED') && applications.length > 0 && (
                    <Link href={`/employer/internships/${id}/kanban`}>
                      <Button variant="outline" fullWidth>
                        📋 Kanban Board
                      </Button>
                    </Link>
                  )}

                  {/* Delete Button (DRAFT or CLOSED only) */}
                  {(internship.status === 'DRAFT' || internship.status === 'CLOSED') && (
                    <>
                      <hr className="my-2" />
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => setShowDeleteModal(true)}
                        disabled={actionLoading}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        🗑️ Delete Internship
                      </Button>
                      <p className="text-xs text-red-600">
                        This action cannot be undone
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Applications Pipeline Section */}
        {internship.status === 'PUBLISHED' || internship.status === 'CLOSED' ? (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Applications Pipeline</CardTitle>
                <Badge variant="info">{applications.length} Total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Filter Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                  { key: 'ALL', label: 'All', count: applications.length },
                  { key: 'SUBMITTED', label: 'Submitted', count: applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length },
                  { key: 'SHORTLISTED', label: 'Shortlisted', count: applications.filter(a => a.status === 'SHORTLISTED').length },
                  { key: 'INTERVIEW', label: 'Interview', count: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length },
                  { key: 'ACCEPTED', label: 'Accepted', count: applications.filter(a => a.status === 'ACCEPTED').length },
                  { key: 'REJECTED', label: 'Rejected', count: applications.filter(a => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                      statusFilter === tab.key
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Bulk Actions Bar */}
              {selectedApplications.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-blue-900">
                        {selectedApplications.size} selected
                      </span>
                      <button
                        onClick={() => setSelectedApplications(new Set())}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleBulkAction('SHORTLISTED')}
                        disabled={bulkActionLoading}
                        variant="outline"
                        size="sm"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        Shortlist
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('REJECTED')}
                        disabled={bulkActionLoading}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      {bulkActionLoading && <LoadingSpinner size="sm" />}
                    </div>
                  </div>
                </div>
              )}

              {/* Applications Table */}
              {applicationsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredApplications.map((app: any) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedApplications.has(app.id)}
                              onChange={() => toggleSelectApplication(app.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-[var(--primary)]">
                                {app.student?.studentProfile?.fullName || app.student?.email || 'Student'}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)]">
                                {app.student?.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {app.aiMatchScore ? (
                                <>
                                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: `${app.aiMatchScore}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{Math.round(app.aiMatchScore)}%</span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {renderStatusBadge(app.status)}
                              {app.status === 'INTERVIEW_SCHEDULED' && app.interviewDate && (
                                <div className="text-xs text-[var(--text-secondary)] mt-1">
                                  📅 {new Date(app.interviewDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-[var(--text-secondary)]">
                              {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              {updatingAppId === app.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  {/* Render action buttons using state machine */}
                                  {getAllowedActions(app.status, UserRole.EMPLOYER).map(action => {
                                    const isDisabled = updatingAppId !== null || !canTransition(app.status, action.targetStatus, UserRole.EMPLOYER);
                                    const blockReason = getTransitionBlockReason(app.status, action.targetStatus, UserRole.EMPLOYER);
                                    
                                    // Handle actions that require confirmation modals
                                    const handleClick = () => {
                                      if (action.confirmRequired) {
                                        if (action.targetStatus === 'ACCEPTED') {
                                          openAcceptModal(app);
                                        } else if (action.targetStatus === 'REJECTED') {
                                          openRejectModal(app);
                                        }
                                      } else if (action.targetStatus === 'INTERVIEW_SCHEDULED') {
                                        openInterviewModal(app);
                                      } else {
                                        handleStatusChange(app.id, action.targetStatus);
                                      }
                                    };
                                    
                                    return (
                                      <div key={action.targetStatus} className="relative group">
                                        <Button
                                          size="sm"
                                          variant={action.variant as any}
                                          onClick={handleClick}
                                          disabled={isDisabled}
                                          className={action.variant === 'danger' ? 'text-red-600 hover:bg-red-50 border-red-200' : ''}
                                          title={blockReason || `${action.label} this application`}
                                        >
                                          {action.icon} {action.label}
                                        </Button>
                                        
                                        {/* Tooltip for disabled buttons */}
                                        {isDisabled && blockReason && (
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            {blockReason}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Show message for terminal states */}
                                  {isTerminalStatus(app.status) && (
                                    <span className="text-xs text-gray-500 italic px-2 py-1">
                                      No actions available
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-[var(--text-secondary)]">
                    {statusFilter === 'ALL'
                      ? 'No applications received yet'
                      : `No applications in ${statusFilter.toLowerCase()} status`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Reject Application Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedApplication(null);
        }}
        title="Reject Application?"
      >
        <div className="space-y-4">
          <p className="text-red-600 font-semibold">⚠️ This will reject the candidate</p>
          {selectedApplication && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm">
                <strong>Student:</strong> {selectedApplication.student?.studentProfile?.fullName || selectedApplication.student?.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Status:</strong> {selectedApplication.status.replace(/_/g, ' ')}
              </p>
            </div>
          )}
          <p className="text-sm text-[var(--text-secondary)]">
            The student will be notified that their application was not successful.
            This action can be reversed later if needed.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowRejectModal(false);
                setSelectedApplication(null);
              }}
              disabled={updatingAppId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => selectedApplication && handleStatusChange(selectedApplication.id, 'REJECTED')}
              disabled={updatingAppId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {updatingAppId ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Rejecting...</span>
                </>
              ) : (
                'Yes, Reject Application'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accept Application Modal */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedApplication(null);
        }}
        title="Accept Application?"
      >
        <div className="space-y-4">
          <p className="text-green-600 font-semibold">✓ Congratulations on finding a great candidate!</p>
          {selectedApplication && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm">
                <strong>Student:</strong> {selectedApplication.student?.studentProfile?.fullName || selectedApplication.student?.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Match Score:</strong> {selectedApplication.aiMatchScore ? `${Math.round(selectedApplication.aiMatchScore)}%` : 'N/A'}
              </p>
            </div>
          )}
          <p className="text-sm text-[var(--text-secondary)]">
            The student will be notified of their acceptance. You can proceed with 
            onboarding and milestone setup after acceptance.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowAcceptModal(false);
                setSelectedApplication(null);
              }}
              disabled={updatingAppId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => selectedApplication && handleStatusChange(selectedApplication.id, 'ACCEPTED')}
              disabled={updatingAppId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {updatingAppId ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Accepting...</span>
                </>
              ) : (
                'Yes, Accept Application'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Confirmation Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Internship?"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Are you sure you want to close this internship? This will:
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Stop accepting new applications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Hide the internship from student searches</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Existing applications will remain accessible</span>
            </li>
          </ul>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCloseModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleClose}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Closing...</span>
                </>
              ) : (
                'Yes, Close Internship'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Internship?"
      >
        <div className="space-y-4">
          <p className="text-red-600 font-semibold">⚠️ Warning: This action cannot be undone!</p>
          <p className="text-[var(--text-secondary)]">
            Deleting this internship will permanently remove:
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>All internship details and settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>All associated applications (if any)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>Application history and data</span>
            </li>
          </ul>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Internship:</strong> {internship.title}
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                'Yes, Delete Permanently'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showInterviewModal}
        onClose={() => {
          setShowInterviewModal(false);
          setSelectedApplication(null);
          setInterviewDate('');
          setInterviewNotes('');
        }}
        title="Schedule Interview"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Schedule an interview with <strong>{selectedApplication?.student?.studentProfile?.fullName || selectedApplication?.student?.email}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Interview Date & Time *
            </label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              The candidate will receive a notification with the interview details
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Interview Notes (Optional)
            </label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder="Add meeting link, location, or any special instructions..."
              rows={4}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              e.g., "Join via Google Meet: meet.google.com/xyz" or "Office address: 123 Street"
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>📧 Notification:</strong> The candidate will be automatically notified about the interview via email and in-app notification.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowInterviewModal(false);
                setSelectedApplication(null);
                setInterviewDate('');
                setInterviewNotes('');
              }}
              disabled={updatingAppId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                if (!interviewDate) {
                  alert('Please select an interview date and time');
                  return;
                }
                handleStatusChange(selectedApplication.id, 'INTERVIEW_SCHEDULED', interviewDate, interviewNotes);
              }}
              disabled={updatingAppId !== null || !interviewDate}
            >
              {updatingAppId ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Scheduling...</span>
                </>
              ) : (
                '📅 Schedule Interview'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
