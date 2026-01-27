'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { applicationsApi } from '@/lib/api';

type ApplicationStatus = 
  | 'PENDING' 
  | 'UNDER_REVIEW' 
  | 'SHORTLISTED' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'WITHDRAWN';

interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter: string;
  resumeUrl: string | null;
  appliedAt: string;
  updatedAt: string;
  internship: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    duration: string;
    stipend: number | null;
    description: string;
    requirements: string;
    status: string;
    employer: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const statusColors: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await applicationsApi.getOne(applicationId);
      setApplication(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      setWithdrawError(null);
      await applicationsApi.withdraw(applicationId);
      setShowWithdrawModal(false);
      await loadApplication();
    } catch (err: any) {
      setWithdrawError(err.response?.data?.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw = application?.status === 'PENDING' || application?.status === 'UNDER_REVIEW';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="error">{error}</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="error">Application not found</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="mb-4"
          >
            ← Back to Applications
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
          <p className="text-gray-600 mt-1">
            Applied on {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={statusColors[application.status]}>
          {application.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Internship Info */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Internship Information</h2>
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{application.internship.title}</h3>
            <p className="text-lg text-gray-700">{application.internship.company}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-3">
            <div>
              <span className="text-sm text-gray-600">Location</span>
              <p className="font-medium">{application.internship.location}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Type</span>
              <p className="font-medium">{application.internship.type}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Duration</span>
              <p className="font-medium">{application.internship.duration}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Stipend</span>
              <p className="font-medium">
                {application.internship.stipend 
                  ? `₹${application.internship.stipend.toLocaleString()}/month` 
                  : 'Unpaid'}
              </p>
            </div>
          </div>

          <div className="pt-3">
            <span className="text-sm text-gray-600 block mb-2">Description</span>
            <p className="text-gray-700 whitespace-pre-wrap">{application.internship.description}</p>
          </div>

          <div className="pt-3">
            <span className="text-sm text-gray-600 block mb-2">Requirements</span>
            <p className="text-gray-700 whitespace-pre-wrap">{application.internship.requirements}</p>
          </div>

          <div className="pt-3">
            <span className="text-sm text-gray-600">Employer</span>
            <p className="font-medium">{application.internship.employer.name}</p>
            <p className="text-sm text-gray-600">{application.internship.employer.email}</p>
          </div>
        </div>
      </Card>

      {/* Application Details */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Your Application</h2>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-600 block mb-2">Cover Letter</span>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {application.coverLetter}
            </p>
          </div>

          {application.resumeUrl && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Resume</span>
              <a 
                href={application.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Resume →
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-3">
            <div>
              <span className="text-sm text-gray-600">Applied On</span>
              <p className="font-medium">
                {new Date(application.appliedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Last Updated</span>
              <p className="font-medium">
                {new Date(application.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {canWithdraw && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <Button 
            onClick={() => setShowWithdrawModal(true)}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Withdraw Application
          </Button>
        </Card>
      )}

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => !withdrawing && setShowWithdrawModal(false)}
        title="Withdraw Application"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to withdraw your application for <strong>{application.internship.title}</strong>?
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
              className="bg-red-600 hover:bg-red-700"
              disabled={withdrawing}
            >
              {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
