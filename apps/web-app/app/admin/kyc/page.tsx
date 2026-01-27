'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function AdminKYCPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminKYCContent />
    </RouteGuard>
  );
}

function AdminKYCContent() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    loadKYC();
  }, [filter]);

  const loadKYC = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/kyc');
      const filtered = filter === 'ALL' 
        ? data 
        : data.filter((k: any) => k.status === filter || (filter === 'PENDING' && k.status === 'UNDER_REVIEW'));
      setKycList(filtered);
    } catch (error) {
      console.error('Failed to load KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (kycId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await apiClient.patch(`/kyc/${kycId}/approve`);
      } else {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        await apiClient.patch(`/kyc/${kycId}/reject`, { rejectionReason: reason });
      }
      loadKYC();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      alert(`Failed to ${action} KYC`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--primary)]">KYC Verification Queue</h1>
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="flex gap-2 mb-6">
          <Button variant={filter === 'PENDING' ? 'primary' : 'outline'} onClick={() => setFilter('PENDING')}>
            Pending
          </Button>
          <Button variant={filter === 'APPROVED' ? 'primary' : 'outline'} onClick={() => setFilter('APPROVED')}>
            Approved
          </Button>
          <Button variant={filter === 'REJECTED' ? 'primary' : 'outline'} onClick={() => setFilter('REJECTED')}>
            Rejected
          </Button>
          <Button variant={filter === 'ALL' ? 'primary' : 'outline'} onClick={() => setFilter('ALL')}>
            All
          </Button>
        </div>

        <Card>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : kycList.length > 0 ? (
              <div className="space-y-4">
                {kycList.map((kyc: any) => (
                  <div key={kyc.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-[var(--primary)]">
                          {kyc.user?.role === 'STUDENT' 
                            ? kyc.user?.studentProfile?.fullName 
                            : kyc.user?.companyProfile?.companyName || kyc.user?.email}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {kyc.user?.email} • {kyc.user?.role}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {kyc.documentType} - {kyc.documentNumber}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(kyc.status)}>{kyc.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      {kyc.status !== 'APPROVED' && (
                        <Button variant="primary" size="sm" onClick={() => handleAction(kyc.id, 'approve')}>
                          Approve
                        </Button>
                      )}
                      {kyc.status !== 'REJECTED' && (
                        <Button variant="danger" size="sm" onClick={() => handleAction(kyc.id, 'reject')}>
                          Reject
                        </Button>
                      )}
                      <a href={kyc.documentUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">View Document</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No KYC records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
