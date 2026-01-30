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
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function AdminKYCDetailPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminKYCDetailContent />
    </RouteGuard>
  );
}

function AdminKYCDetailContent() {
  const router = useRouter();
  const params = useParams();
  const kycId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [kycDocument, setKycDocument] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadKYCDetails();
  }, [kycId]);

  const loadKYCDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all KYC documents and find the specific one
      const { data } = await adminApi.kyc.getAll();
      const kycData = Array.isArray(data) ? data : (data.data || []);
      const foundKyc = kycData.find((k: any) => k.id === kycId);

      if (!foundKyc) {
        setError('KYC document not found');
        return;
      }

      setKycDocument(foundKyc);
    } catch (err: any) {
      console.error('Failed to load KYC:', err);
      setError(err.response?.data?.message || 'Failed to load KYC details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this KYC?')) return;

    try {
      setActionLoading(true);
      await adminApi.kyc.review(kycId, { approved: true });
      alert('KYC approved successfully');
      router.push('/admin/kyc');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.kyc.review(kycId, { approved: false, reason: rejectionReason });
      alert('KYC rejected');
      router.push('/admin/kyc');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject KYC');
      setActionLoading(false);
    }
  };

  const getUserName = () => {
    if (!kycDocument?.user) return 'Unknown User';
    if (kycDocument.user.employerProfile?.companyName) {
      return kycDocument.user.employerProfile.companyName;
    }
    return kycDocument.user.email;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !kycDocument) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-4">
            <Link href="/admin/kyc">
              <Button variant="outline" size="sm">← Back to KYC List</Button>
            </Link>
          </div>
        </header>
        <div className="container-custom py-8">
          <Alert variant="error">{error || 'KYC document not found'}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                <Link href="/admin/dashboard" className="hover:text-[var(--primary)]">Admin</Link>
                <span>/</span>
                <Link href="/admin/kyc" className="hover:text-[var(--primary)]">KYC</Link>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium">Review</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">KYC Document Review</h1>
            </div>
            <Link href="/admin/kyc">
              <Button variant="outline" size="sm">← Back to List</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid gap-6 max-w-4xl mx-auto">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>KYC Status</CardTitle>
                <StatusBadge status={kycDocument.status} size="lg" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-[var(--text-secondary)]">Submitted By:</span>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">{getUserName()}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{kycDocument.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-[var(--text-secondary)]">User Role:</span>
                  <Badge variant={kycDocument.user?.role === 'EMPLOYER' ? 'info' : 'default'}>
                    {kycDocument.user?.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-[var(--text-secondary)]">Submitted At:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {new Date(kycDocument.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {kycDocument.reviewedAt && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-[var(--text-secondary)]">Reviewed At:</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {new Date(kycDocument.reviewedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {kycDocument.rejectionReason && (
                  <Alert variant="error">
                    <strong>Rejection Reason:</strong>
                    <p className="mt-1">{kycDocument.rejectionReason}</p>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-[var(--text-secondary)]">Document Type:</span>
                  <Badge variant="default" size="lg">
                    {kycDocument.documentType?.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-[var(--text-secondary)]">Document Number:</span>
                  <span className="font-medium text-[var(--text-primary)] font-mono">
                    {kycDocument.documentNumber || 'N/A'}
                  </span>
                </div>

                {kycDocument.documentUrl && (
                  <div className="py-3">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Document URL:
                    </label>
                    <a
                      href={kycDocument.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline break-all"
                    >
                      {kycDocument.documentUrl}
                    </a>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        onClick={() => window.open(kycDocument.documentUrl, '_blank')}
                      >
                        🔗 Open Document in New Tab
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information (if employer) */}
          {kycDocument.user?.role === 'EMPLOYER' && kycDocument.user?.employerProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-[var(--text-secondary)]">Company Name:</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {kycDocument.user.employerProfile.companyName || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-[var(--text-secondary)]">Industry:</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {kycDocument.user.employerProfile.industry || 'N/A'}
                    </span>
                  </div>

                  {kycDocument.user.employerProfile.website && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-[var(--text-secondary)]">Website:</span>
                      <a
                        href={kycDocument.user.employerProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline"
                      >
                        {kycDocument.user.employerProfile.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {(kycDocument.status === 'PENDING' || kycDocument.status === 'UNDER_REVIEW') && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      '✅ Approve KYC'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    ❌ Reject KYC
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        title="Reject KYC Document"
      >
        <div className="space-y-4">
          <Alert variant="error">
            <p className="font-medium">⚠️ Warning: This action will reject the KYC verification</p>
          </Alert>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why the KYC is being rejected..."
              rows={4}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              required
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              The user will receive this reason and can resubmit their KYC
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Rejecting...</span>
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
