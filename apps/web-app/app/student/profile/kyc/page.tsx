'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function StudentKYCPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <StudentKYCContent />
    </RouteGuard>
  );
}

function StudentKYCContent() {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'AADHAR',
    documentNumber: '',
    documentUrl: '',
  });

  useEffect(() => {
    loadKYC();
  }, []);

  const loadKYC = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/kyc/my-kyc');
      setKycData(data);
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
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">KYC Verification</h1>
              <p className="text-sm text-[var(--text-secondary)]">Verify your identity</p>
            </div>
            <Link href="/student/profile">
              <Button variant="outline" size="sm">← Back to Profile</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Current Status */}
          {kycData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current KYC Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[var(--text-secondary)]">Status:</span>
                  <Badge variant={getStatusBadgeVariant(kycData.status)} size="lg">
                    {kycData.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[var(--text-secondary)]">Document Type:</span>
                  <span className="font-medium">{kycData.documentType}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[var(--text-secondary)]">Submitted At:</span>
                  <span className="font-medium">{new Date(kycData.submittedAt).toLocaleString()}</span>
                </div>
                {kycData.reviewedAt && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[var(--text-secondary)]">Reviewed At:</span>
                    <span className="font-medium">{new Date(kycData.reviewedAt).toLocaleString()}</span>
                  </div>
                )}
                {kycData.rejectionReason && (
                  <Alert variant="error" className="mt-4">
                    <strong>Rejection Reason:</strong> {kycData.rejectionReason}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit/Resubmit Form */}
          {(!kycData || kycData.status === 'REJECTED') && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {kycData ? 'Resubmit KYC Documents' : 'Submit KYC Documents'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="info" className="mb-6">
                  <p className="font-medium mb-2">Required Documents:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Valid Government ID (Aadhar, PAN, Passport, or Driver's License)</li>
                    <li>Clear photo or scan of the document</li>
                    <li>Document should be valid and not expired</li>
                  </ul>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Document Type
                    </label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      required
                    >
                      <option value="AADHAR">Aadhar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                    </select>
                  </div>

                  <Input
                    label="Document Number"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    placeholder="Enter document number"
                    required
                  />

                  <Input
                    label="Document URL"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    placeholder="https://... (Upload to cloud and paste link)"
                    helperText="Upload your document to a cloud service and paste the public link here"
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={submitting}
                    disabled={submitting}
                  >
                    {kycData ? 'Resubmit KYC' : 'Submit KYC'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Pending/Under Review */}
          {kycData && (kycData.status === 'PENDING' || kycData.status === 'UNDER_REVIEW') && (
            <Alert variant="info">
              <p className="font-medium mb-2">Your KYC is being reviewed</p>
              <p className="text-sm">
                Our team will verify your documents within 24-48 hours. You'll receive a notification once the review is complete.
              </p>
            </Alert>
          )}

          {/* Approved */}
          {kycData && kycData.status === 'APPROVED' && (
            <Alert variant="success">
              <p className="font-medium mb-2">✅ KYC Verified!</p>
              <p className="text-sm">
                Your identity has been verified. You can now apply for internships with escrow protection.
              </p>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
