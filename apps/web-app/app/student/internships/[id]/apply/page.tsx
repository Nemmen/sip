'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import ResumeUpload from '@/components/ui/ResumeUpload';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { internshipsApi, applicationsApi } from '@/lib/api';
import {
  canApplyToInternship,
  getBlockReasonMessage,
  getExistingApplication,
  getApplicationStatusBadgeVariant,
} from '@/lib/applicationRules';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Student Application Form Page
 * 
 * Purpose: Allow students to submit applications for published internships
 * with duplicate prevention and comprehensive eligibility checks.
 * 
 * Features:
 * - Duplicate application prevention (checks existing applications)
 * - Internship status validation (must be PUBLISHED)
 * - Deadline validation (must not be passed)
 * - Application form with cover letter, resume URL, notes
 * - Loading, error, and success states
 * - Redirect to /student/applications on success
 * 
 * Safety:
 * - Prevents duplicate applications
 * - Validates eligibility before showing form
 * - Backend also validates (defense in depth)
 * - No backend modifications
 * - No employer page changes
 */

export default function ApplyInternshipPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <ApplyInternshipContent />
    </RouteGuard>
  );
}

function ApplyInternshipContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Data state
  const [internship, setInternship] = useState<any>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    coverLetter: '',
    resumeUrl: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load internship and student's applications
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch both internship and student's applications in parallel
      const [internshipResponse, applicationsResponse] = await Promise.all([
        internshipsApi.getOne(id),
        applicationsApi.getMyApplications(),
      ]);

      setInternship(internshipResponse.data);
      setMyApplications(applicationsResponse.data || []);
    } catch (err: unknown) {
      console.error('Failed to load data:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to load internship details';
      setError(errorMessage || 'Failed to load internship details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Cover letter is required
    if (!formData.coverLetter.trim()) {
      errors.coverLetter = 'Cover letter is required';
    } else if (formData.coverLetter.trim().length < 50) {
      errors.coverLetter = 'Cover letter must be at least 50 characters';
    }

    // Resume URL validation (optional but if provided, must be valid URL or text)
    if (formData.resumeUrl && formData.resumeUrl.trim().length < 5) {
      errors.resumeUrl = 'Please provide a valid resume URL or details';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    // Double-check internship status before submitting
    if (internship?.status !== 'PUBLISHED') {
      setError('This internship is not accepting applications.');
      return;
    }

    // Check deadline again
    if (internship?.applicationDeadline) {
      const deadline = new Date(internship.applicationDeadline);
      if (deadline < new Date()) {
        setError('The application deadline has passed.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');

      // Submit application
      await applicationsApi.create({
        internshipId: id,
        coverLetter: formData.coverLetter.trim(),
        resumeUrl: formData.resumeUrl.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      setSubmitSuccess(true);

      // Redirect to applications page after short delay
      setTimeout(() => {
        router.push('/student/applications');
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to submit application:', err);
      
      let errorMessage = 'Failed to submit application. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const responseErr = err as any;
        errorMessage = responseErr.response?.data?.message || 
                      responseErr.response?.data?.error || 
                      errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate eligibility using helper function
  const eligibilityCheck = internship && myApplications
    ? canApplyToInternship(internship, myApplications)
    : { canApply: false, reason: '' };

  const existingApplication = internship
    ? getExistingApplication(myApplications, internship.id)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-4">
            <Link href="/student/internships">
              <Button variant="outline" size="sm">
                ← Back to Browse
              </Button>
            </Link>
          </div>
        </header>
        <div className="container-custom py-8">
          <Alert variant="error">Internship not found</Alert>
        </div>
      </div>
    );
  }

  // If student already applied, show status instead of form
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/student/internships/${id}`}>
                  <Button variant="outline" size="sm">
                    ← Back to Internship
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--primary)]">
                    Already Applied
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    You have already submitted an application
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container-custom py-8 max-w-4xl">
          {/* Already Applied Card */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="info">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div className="flex-1">
                    <strong>You have already applied to this internship.</strong>
                    <p className="text-sm mt-1">
                      You can track your application status in your applications dashboard.
                    </p>
                  </div>
                </div>
              </Alert>

              {/* Internship Summary */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-[var(--primary)] mb-4">
                  {internship.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {internship.employer?.companyProfile?.companyName || 'Company'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Location</p>
                    <p className="text-sm font-medium">{internship.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Duration</p>
                    <p className="text-sm font-medium">{internship.duration} months</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Stipend</p>
                    <p className="text-sm font-medium">₹{internship.stipend?.toLocaleString()}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Your Status</p>
                    <Badge 
                      variant={getApplicationStatusBadgeVariant(existingApplication.status) as any}
                      size="lg"
                    >
                      {existingApplication.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-[var(--primary)] mb-3">
                  Application Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Applied On:</span>
                    <span className="font-medium">
                      {new Date(existingApplication.appliedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {existingApplication.aiMatchScore && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Match Score:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${existingApplication.aiMatchScore}%` }}
                          />
                        </div>
                        <span className="font-medium">
                          {Math.round(existingApplication.aiMatchScore)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <Link href="/student/applications" className="flex-1">
                  <Button variant="primary" fullWidth>
                    Go to My Applications →
                  </Button>
                </Link>
                <Link href="/student/internships" className="flex-1">
                  <Button variant="outline" fullWidth>
                    Browse More Internships
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If cannot apply for other reasons, show block message
  if (!eligibilityCheck.canApply) {
    const blockMessage = getBlockReasonMessage(eligibilityCheck.reason, internship);

    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/student/internships/${id}`}>
                  <Button variant="outline" size="sm">
                    ← Back to Internship
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--primary)]">
                    Cannot Apply
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    This internship is not accepting applications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container-custom py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-[var(--primary)] mb-3">
                Application Not Available
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                {blockMessage}
              </p>

              {/* Internship Summary */}
              <div className="border-t border-b py-4 my-6">
                <h3 className="text-lg font-semibold text-[var(--primary)] mb-2">
                  {internship.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {internship.employer?.companyProfile?.companyName || 'Company'}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href={`/student/internships/${id}`}>
                  <Button variant="outline">View Internship Details</Button>
                </Link>
                <Link href="/student/internships">
                  <Button variant="primary">Browse Other Opportunities</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show application form (only if eligible)
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/student/internships/${id}`}>
                <Button variant="outline" size="sm">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">
                  Apply for Internship
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Submit your application
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8 max-w-4xl">
        {/* Success Message */}
        {submitSuccess && (
          <Alert variant="success" className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <div>
                <strong>Application submitted successfully!</strong>
                <p className="text-sm mt-1">
                  Redirecting you to your applications page...
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Error Message */}
        {error && !submitSuccess && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Internship Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Internship Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-semibold text-[var(--primary)]">
                  {internship.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {internship.employer?.companyProfile?.companyName || 'Company'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Location</p>
                  <p className="text-sm font-medium text-[var(--primary)]">
                    {internship.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Duration</p>
                  <p className="text-sm font-medium text-[var(--primary)]">
                    {internship.duration} months
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Stipend</p>
                  <p className="text-sm font-medium text-[var(--primary)]">
                    ₹{internship.stipend?.toLocaleString()}/mo
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Deadline</p>
                  <p className="text-sm font-medium text-red-600">
                    {internship.applicationDeadline
                      ? new Date(internship.applicationDeadline).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                          }
                        )
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                  Cover Letter *
                </label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  placeholder="Tell us why you're a great fit for this internship. Highlight relevant skills, experience, and what you hope to learn..."
                  required
                  rows={10}
                  disabled={submitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none ${
                    formErrors.coverLetter
                      ? 'border-red-500'
                      : 'border-[var(--border)]'
                  } ${submitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {formErrors.coverLetter && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.coverLetter}
                  </p>
                )}
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Minimum 50 characters. Current: {formData.coverLetter.length}
                </p>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                  Resume
                </label>
                <ResumeUpload
                  onUploadSuccess={(url) => setFormData(prev => ({ ...prev, resumeUrl: url }))}
                  currentResumeUrl={formData.resumeUrl}
                  disabled={submitting}
                />
                {formErrors.resumeUrl && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.resumeUrl}
                  </p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information you'd like to share (portfolio links, achievements, etc.)"
                  rows={4}
                  disabled={submitting}
                  className={`w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none ${
                    submitting ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Optional: Add any extra details that might strengthen your
                  application
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t">
                <Link href={`/student/internships/${id}`} className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={submitting || submitSuccess}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Submitting...</span>
                    </>
                  ) : submitSuccess ? (
                    '✓ Submitted'
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>

              {/* Show error if submission fails */}
              {error && !submitSuccess && (
                <Alert variant="error" className="mt-4">
                  <strong>Submission Failed</strong>
                  <p className="text-sm mt-1">{error}</p>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-semibold text-[var(--primary)] mb-2">
                  Application Tips
                </h4>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>
                    • <strong>Be specific:</strong> Mention relevant projects,
                    skills, or coursework
                  </li>
                  <li>
                    • <strong>Show enthusiasm:</strong> Explain why you&apos;re excited
                    about this opportunity
                  </li>
                  <li>
                    • <strong>Proofread:</strong> Check for spelling and grammar
                    errors
                  </li>
                  <li>
                    • <strong>Be concise:</strong> Keep it focused and easy to read
                  </li>
                  <li>
                    • <strong>Highlight fit:</strong> Connect your skills to the
                    required skills listed
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
