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
          {kycData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current KYC Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Status:</span>
                    <Badge variant={getStatusBadgeVariant(kycData.status)} size="lg">
                      {kycData.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Document Type:</span>
                    <span className="font-medium">{kycData.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Submitted:</span>
                    <span className="font-medium">{new Date(kycData.submittedAt).toLocaleString()}</span>
                  </div>
                  {kycData.rejectionReason && (
                    <Alert variant="error" className="mt-4">
                      <strong>Rejection Reason:</strong> {kycData.rejectionReason}
                    </Alert>
                  )}
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
