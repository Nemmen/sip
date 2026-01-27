'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { internshipsApi, applicationsApi } from '@/lib/api';
import { ApplicationStatus } from '@/domain/application';

export default function KanbanBoardPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <KanbanBoardContent />
    </RouteGuard>
  );
}

function KanbanBoardContent() {
  const router = useRouter();
  const params = useParams();
  const internshipId = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draggedApp, setDraggedApp] = useState<any>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Kanban columns based on application statuses
  const columns = [
    { id: 'SUBMITTED', title: 'New', color: 'bg-gray-100 border-gray-300' },
    { id: 'UNDER_REVIEW', title: 'Under Review', color: 'bg-blue-100 border-blue-300' },
    { id: 'SHORTLISTED', title: 'Shortlisted', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'INTERVIEW_SCHEDULED', title: 'Interview', color: 'bg-purple-100 border-purple-300' },
    { id: 'ACCEPTED', title: 'Accepted', color: 'bg-green-100 border-green-300' },
    { id: 'REJECTED', title: 'Rejected', color: 'bg-red-100 border-red-300' },
  ];

  useEffect(() => {
    loadData();
  }, [internshipId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [internshipRes, applicationsRes] = await Promise.all([
        internshipsApi.getOne(internshipId),
        applicationsApi.getInternshipApplications(internshipId),
      ]);
      
      setInternship(internshipRes.data);
      setApplications(applicationsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, application: any) => {
    setDraggedApp(application);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedApp || draggedApp.status === newStatus) {
      setDraggedApp(null);
      return;
    }

    // Terminal statuses cannot be changed
    if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(draggedApp.status)) {
      alert('Cannot move applications in terminal status (Accepted/Rejected/Withdrawn)');
      setDraggedApp(null);
      return;
    }

    try {
      setUpdatingAppId(draggedApp.id);
      await applicationsApi.updateStatus(draggedApp.id, newStatus);
      
      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === draggedApp.id ? { ...app, status: newStatus } : app
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setDraggedApp(null);
      setUpdatingAppId(null);
    }
  };

  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusMap: Record<string, any> = {
      SUBMITTED: 'default',
      UNDER_REVIEW: 'info',
      SHORTLISTED: 'warning',
      INTERVIEW_SCHEDULED: 'info',
      ACCEPTED: 'success',
      REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{internship?.title}</h1>
              <p className="text-gray-600 mt-1">
                Kanban Board • {applications.length} Applications
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/employer/internships/${internshipId}`}>
                <Button variant="outline">← Back to Details</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        <Alert variant="info" className="mb-6">
          💡 Drag and drop applications between columns to update their status. Terminal statuses (Accepted/Rejected) cannot be changed.
        </Alert>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnApps = getApplicationsByStatus(column.id);
            
            return (
              <div
                key={column.id}
                className="flex flex-col min-h-[600px] rounded-lg border-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={`${column.color} p-4 rounded-t-lg border-b-2`}>
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{columnApps.length} applications</p>
                </div>

                {/* Column Body */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-gray-50">
                  {columnApps.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                      No applications
                    </div>
                  ) : (
                    columnApps.map((app) => (
                      <div
                        key={app.id}
                        draggable={!['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status)}
                        onDragStart={(e) => handleDragStart(e, app)}
                        className={`bg-white p-3 rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-all ${
                          updatingAppId === app.id ? 'opacity-50' : ''
                        } ${
                          draggedApp?.id === app.id ? 'opacity-50 rotate-2' : ''
                        } ${
                          ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status) ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      >
                        {/* Application Card */}
                        <div className="mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                              {app.student?.studentProfile?.fullName || app.student?.email || 'Unknown'}
                            </h4>
                            {updatingAppId === app.id && (
                              <LoadingSpinner size="sm" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {app.student?.email}
                          </p>
                        </div>

                        {app.coverLetter && (
                          <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                            "{app.coverLetter}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                          <Link
                            href={`/employer/internships/${internshipId}/applications/${app.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </div>

                        {['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <Badge variant={getStatusBadgeVariant(app.status)} className="text-xs">
                              🔒 {app.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
