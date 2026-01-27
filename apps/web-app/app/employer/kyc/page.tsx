'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function EmployerKYCPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <EmployerKYCContent />
    </RouteGuard>
  );
}

function EmployerKYCContent() {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'GST_CERTIFICATE',
    documentNumber: '',
    documentUrl: '',
  });

  useEffect(() => {
    loadKYC();
  }, []);

  const loadKYC = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/kyc/my-documents');
      // Get the latest KYC document
      if (Array.isArray(data) && data.length > 0) {
        setKycData(data[0]);
      } else if (data && !Array.isArray(data)) {
        setKycData(data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load KYC:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.post('/kyc/submit', formData);
      await loadKYC();
      await refreshUser();
      alert('KYC submitted successfully! It will be reviewed within 24-48 hours.');
    } catch (error) {
      console.error('Failed to submit KYC:', error);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Company KYC Verification</h1>
              <p className="text-sm text-[var(--text-secondary)]">Verify your company</p>
            </div>
            <Link href="/employer/dashboard">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {kycData && kycData.status === 'APPROVED' && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Company Verified!</h3>
                    <p className="text-sm text-green-700 mb-4">Your company has been verified. You can now post and publish internships.</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-600 mb-1">Document Type</p>
                        <p className="font-medium text-green-900">{kycData.documentType}</p>
                      </div>
                      <div>
                        <p className="text-green-600 mb-1">Document Number</p>
                        <p className="font-medium text-green-900">{kycData.documentNumber}</p>
                      </div>
                      <div>
                        <p className="text-green-600 mb-1">Submitted</p>
                        <p className="font-medium text-green-900">{new Date(kycData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      {kycData.reviewedAt && (
                        <div>
                          <p className="text-green-600 mb-1">Approved On</p>
                          <p className="font-medium text-green-900">{new Date(kycData.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {kycData && (kycData.status === 'PENDING' || kycData.status === 'UNDER_REVIEW') && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">⏳ Verification Pending</h3>
                    <p className="text-sm text-orange-700 mb-4">Your KYC is under review. You'll be notified within 24-48 hours. You can create draft internships, but publishing requires KYC approval.</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-orange-600 mb-1">Document Type</p>
                        <p className="font-medium text-orange-900">{kycData.documentType}</p>
                      </div>
                      <div>
                        <p className="text-orange-600 mb-1">Document Number</p>
                        <p className="font-medium text-orange-900">{kycData.documentNumber}</p>
                      </div>
                      <div>
                        <p className="text-orange-600 mb-1">Submitted</p>
                        <p className="font-medium text-orange-900">{new Date(kycData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-orange-600 mb-1">Status</p>
                        <Badge variant={getStatusBadgeVariant(kycData.status)}>{kycData.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {kycData && kycData.status === 'REJECTED' && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">❌ KYC Rejected</h3>
                    <p className="text-sm text-red-700 mb-4">Your KYC submission was rejected. Please review the reason below and resubmit with correct information.</p>
                    
                    {kycData.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{kycData.rejectionReason}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-red-600 mb-1">Submitted</p>
                        <p className="font-medium text-red-900">{new Date(kycData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      {kycData.reviewedAt && (
                        <div>
                          <p className="text-red-600 mb-1">Reviewed On</p>
                          <p className="font-medium text-red-900">{new Date(kycData.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(!kycData || kycData.status === 'REJECTED') && (
            <Card>
              <CardHeader>
                <CardTitle>{kycData ? 'Resubmit Company KYC' : 'Submit Company KYC'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="info" className="mb-6">
                  <p className="font-medium mb-2">Required Documents:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>GST Certificate or Company Registration Certificate</li>
                    <li>PAN Card of the Company</li>
                    <li>Address Proof (Utility Bill/Rent Agreement)</li>
                  </ul>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Document Type</label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="GST_CERTIFICATE">GST Certificate</option>
                      <option value="COMPANY_PAN">Company PAN</option>
                      <option value="REGISTRATION_CERTIFICATE">Registration Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Document Number</label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Document URL</label>
                    <input
                      type="url"
                      value={formData.documentUrl}
                      onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="https://..."
                      required
                    />
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Upload document to cloud and paste public link
                    </p>
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={submitting}>
                    {kycData ? 'Resubmit KYC' : 'Submit KYC'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {kycData && kycData.status === 'APPROVED' && (
            <Alert variant="success">
              <p className="font-medium mb-2">✅ Company Verified!</p>
              <p className="text-sm">Your company has been verified. You can now post internships.</p>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
