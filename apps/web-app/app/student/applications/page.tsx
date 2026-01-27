'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useApplications } from '@/lib/hooks';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { applicationsApi } from '@/lib/api';

export default function TrackApplicationsPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <TrackApplicationsContent />
    </RouteGuard>
  );
}

function TrackApplicationsContent() {
  const { user } = useAuth();
  const { data: applications, loading, refetch } = useApplications();
  const [filter, setFilter] = useState<string>('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const handleWithdrawClick = (app: any) => {
    setSelectedApp(app);
    setShowWithdrawModal(true);
    setWithdrawError(null);
  };

  const handleWithdraw = async () => {
    if (!selectedApp) return;
    
    try {
      setWithdrawing(true);
      setWithdrawError(null);
      await applicationsApi.withdraw(selectedApp.id);
      setShowWithdrawModal(false);
      setSelectedApp(null);
      await refetch(); // Refresh the list
    } catch (err: any) {
      setWithdrawError(err.response?.data?.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  const filteredApplications = applications?.filter((app: any) => {
    if (filter === 'all') return true;
    return app.status === filter;
  }) || [];

  const statusCounts = {
    total: applications?.length || 0,
    pending: applications?.filter((a: any) => a.status === 'PENDING').length || 0,
    underReview: applications?.filter((a: any) => a.status === 'UNDER_REVIEW').length || 0,
    shortlisted: applications?.filter((a: any) => a.status === 'SHORTLISTED').length || 0,
    accepted: applications?.filter((a: any) => a.status === 'ACCEPTED').length || 0,
    rejected: applications?.filter((a: any) => a.status === 'REJECTED').length || 0,
    withdrawn: applications?.filter((a: any) => a.status === 'WITHDRAWN').length || 0,
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    SHORTLISTED: 'bg-purple-100 text-purple-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    WITHDRAWN: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Track Applications</h1>
              <p className="text-sm text-[var(--text-secondary)]">Monitor your application status</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card className={`cursor-pointer transition ${filter === 'all' ? 'ring-2 ring-blue-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('all')}>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.total}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'PENDING' ? 'ring-2 ring-yellow-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('PENDING')}>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'UNDER_REVIEW' ? 'ring-2 ring-blue-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('UNDER_REVIEW')}>
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.underReview}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'SHORTLISTED' ? 'ring-2 ring-purple-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('SHORTLISTED')}>
              <p className="text-sm text-gray-600">Shortlisted</p>
              <p className="text-2xl font-bold text-purple-600">{statusCounts.shortlisted}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'ACCEPTED' ? 'ring-2 ring-green-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('ACCEPTED')}>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'REJECTED' ? 'ring-2 ring-red-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('REJECTED')}>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'WITHDRAWN' ? 'ring-2 ring-gray-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('WITHDRAWN')}>
              <p className="text-sm text-gray-600">Withdrawn</p>
              <p className="text-2xl font-bold text-gray-600">{statusCounts.withdrawn}</p>
            </div>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {filter === 'all' ? 'All Applications' : `${filter.replace('_', ' ')} Applications`}
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredApplications.length > 0 ? (
              <div className="space-y-4">
                {filteredApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-600 mb-1 text-lg">
                          {app.internship?.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {app.internship?.company || 'Company'}
                        </p>
                      </div>
                      <Badge className={statusColors[app.status] || 'bg-gray-100 text-gray-800'}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                      <span>📍 {app.internship?.location}</span>
                      <span>💰 {app.internship?.stipend ? `₹${app.internship.stipend.toLocaleString()}/mo` : 'Unpaid'}</span>
                      <span>📅 Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span>🔄 Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {app.coverLetter && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        <strong>Cover Letter:</strong> {app.coverLetter}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/student/applications/${app.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                      {(app.status === 'PENDING' || app.status === 'UNDER_REVIEW') && (
                        <Button 
                          onClick={() => handleWithdrawClick(app)}
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          Withdraw
                        </Button>
                      )}
                      {app.status === 'ACCEPTED' && (
                        <Link href={`/student/internships/${app.internshipId}/milestones`}>
                          <Button className="bg-blue-600 hover:bg-blue-700">View Milestones</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">No applications found</p>
                <p className="text-sm mt-2">
                  {filter === 'all' 
                    ? "Start applying to internships to see them here"
                    : `No ${filter.toLowerCase().replace('_', ' ')} applications`}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Withdraw Confirmation Modal */}
        <Modal
          isOpen={showWithdrawModal}
          onClose={() => !withdrawing && setShowWithdrawModal(false)}
          title="Withdraw Application"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to withdraw your application for{' '}
              <strong>{selectedApp?.internship?.title}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. You will need to reapply if you change your mind.
            </p>

            {withdrawError && <Alert variant="error">{withdrawError}</Alert>}

            <div className="flex gap-3 justify-end">
              <Button 
                onClick={() => setShowWithdrawModal(false)}
                variant="outline"
                disabled={withdrawing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleWithdraw}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={withdrawing}
              >
                {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
