'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RouteGuard } from '@/components/RouteGuard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/lib/toast-context';
import { adminApi } from '@/lib/api';

export default function AdminKYCPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminKYCContent />
    </RouteGuard>
  );
}

function AdminKYCContent() {
  const router = useRouter();
  const toast = useToast();
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadKYC();
  }, [filter]);

  const loadKYC = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'ALL') {
        params.status = filter;
      }
      const { data } = await adminApi.kyc.getAll(params).catch(() => ({ data: [] }));
      const kycData = Array.isArray(data) ? data : (data.data || []);
      setKycList(kycData);
    } catch (error) {
      console.error('Failed to load KYC:', error);
      setKycList([]);
      toast.error('Failed to load KYC records', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (kycId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(kycId);
      
      if (action === 'approve') {
        await apiClient.put(`/kyc/review/${kycId}`, { approved: true });
        
        // Update the KYC status in local state
        setKycList(prevList => 
          prevList.map(kyc => 
            kyc.id === kycId 
              ? { ...kyc, status: 'APPROVED', reviewedAt: new Date().toISOString() }
              : kyc
          )
        );
        
        toast.success('KYC approved successfully', 'Success');
      } else {
        const reason = prompt('Enter rejection reason:');
        if (!reason) {
          setActionLoading(null);
          return;
        }
        
        await apiClient.put(`/kyc/review/${kycId}`, { approved: false, reason });
        
        // Update the KYC status in local state
        setKycList(prevList => 
          prevList.map(kyc => 
            kyc.id === kycId 
              ? { ...kyc, status: 'REJECTED', rejectionReason: reason, reviewedAt: new Date().toISOString() }
              : kyc
          )
        );
        
        toast.success('KYC rejected', 'Success');
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      toast.error(`Failed to ${action} KYC`, 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredKycList = kycList.filter((k: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return k.status === 'PENDING' || k.status === 'UNDER_REVIEW';
    return k.status === filter;
  });

  const stats = {
    total: kycList.length,
    pending: kycList.filter((k: any) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length,
    approved: kycList.filter((k: any) => k.status === 'APPROVED').length,
    rejected: kycList.filter((k: any) => k.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <Card className="bg-gradient-to-r from-purple-600 to-pink-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">KYC Verification Queue 📋</h1>
                <p className="text-purple-100">Review and manage employer KYC submissions</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{stats.pending}</div>
                <div className="text-purple-100">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Submissions"
          value={stats.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          valueColor="text-orange-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          valueColor="text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          valueColor="text-red-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Filter Tabs */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'PENDING' ? 'primary' : 'outline'} 
              onClick={() => setFilter('PENDING')}
              size="sm"
            >
              Pending ({stats.pending})
            </Button>
            <Button 
              variant={filter === 'APPROVED' ? 'primary' : 'outline'} 
              onClick={() => setFilter('APPROVED')}
              size="sm"
            >
              Approved ({stats.approved})
            </Button>
            <Button 
              variant={filter === 'REJECTED' ? 'primary' : 'outline'} 
              onClick={() => setFilter('REJECTED')}
              size="sm"
            >
              Rejected ({stats.rejected})
            </Button>
            <Button 
              variant={filter === 'ALL' ? 'primary' : 'outline'} 
              onClick={() => setFilter('ALL')}
              size="sm"
            >
              All ({stats.total})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KYC List */}
      {filteredKycList.length > 0 ? (
        <div className="grid gap-4">
          {filteredKycList.map((kyc: any) => {
            const userName = kyc.user?.employerProfile?.companyName || kyc.user?.email || 'Unknown User';
            const userEmail = kyc.user?.email || 'No email';
            
            return (
              <Card key={kyc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <UserAvatar name={userName} size="lg" />
                    
                    {/* KYC Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                          <p className="text-sm text-gray-600">{userEmail}</p>
                        </div>
                        <StatusBadge status={kyc.status} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Document Type</p>
                          <p className="text-sm font-medium text-gray-900">{kyc.documentType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Document Number</p>
                          <p className="text-sm font-medium text-gray-900">{kyc.documentNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Submitted</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(kyc.createdAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        {kyc.reviewedAt && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Reviewed</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(kyc.reviewedAt).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {kyc.rejectionReason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{kyc.rejectionReason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(kyc.documentUrl, '_blank')}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Document
                        </Button>
                        
                        {kyc.status !== 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(kyc.id, 'approve')}
                            disabled={actionLoading === kyc.id}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {actionLoading === kyc.id ? 'Processing...' : 'Approve'}
                          </Button>
                        )}
                        
                        {kyc.status !== 'REJECTED' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction(kyc.id, 'reject')}
                            disabled={actionLoading === kyc.id}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {actionLoading === kyc.id ? 'Processing...' : 'Reject'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No KYC Records Found"
          description={
            filter === 'PENDING' 
              ? "No pending KYC submissions at the moment."
              : `No ${filter.toLowerCase()} KYC records found.`
          }
          actionLabel="Refresh"
          onAction={loadKYC}
        />
      )}
    </div>
  );
}
