'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { internshipsApi } from '@/lib/api';

export default function NewInternshipPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <NewInternshipContent />
    </RouteGuard>
  );
}

function NewInternshipContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'REMOTE',
    location: '',
    duration: '',
    stipend: '',
    requiredSkills: '',
    preferredSkills: '',
    responsibilities: '',
    benefits: '',
    applicationDeadline: '',
    startDate: '',
    maxApplicants: '50',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.location || !formData.duration || !formData.stipend) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Validate dates
      const deadline = new Date(formData.applicationDeadline);
      const start = new Date(formData.startDate);
      if (deadline >= start) {
        setError('Application deadline must be before start date');
        setSubmitting(false);
        return;
      }

      // Parse array fields (comma-separated strings to arrays)
      const requiredSkills = formData.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const preferredSkills = formData.preferredSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const responsibilities = formData.responsibilities
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const benefits = formData.benefits
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Prepare data for backend
      const internshipData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        duration: parseInt(formData.duration, 10),
        stipend: parseFloat(formData.stipend),
        requiredSkills,
        preferredSkills,
        responsibilities,
        benefits,
        applicationDeadline: new Date(formData.applicationDeadline).toISOString(),
        startDate: new Date(formData.startDate).toISOString(),
        maxApplicants: parseInt(formData.maxApplicants, 10),
      };

      // Submit to backend
      await internshipsApi.create(internshipData);

      // Redirect to internships list on success
      router.push('/employer/internships');
    } catch (err: any) {
      console.error('Failed to create internship:', err);
      setError(err.response?.data?.message || 'Failed to create internship. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Post New Internship</h1>
              <p className="text-sm text-[var(--text-secondary)]">Create a new internship opportunity</p>
            </div>
            <Link href="/employer/internships">
              <Button variant="outline" size="sm">← Cancel</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {/* KYC Warning */}
          {user?.kycStatus !== 'APPROVED' && (
            <Alert variant="warning" className="mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold mb-1">KYC Verification Required</h3>
                  <p className="text-sm mb-2">
                    You can create a draft internship, but you'll need approved KYC to publish it.
                  </p>
                  <Link href="/employer/kyc">
                    <Button variant="primary" size="sm">
                      Complete KYC Verification
                    </Button>
                  </Link>
                </div>
              </div>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Internship Title *
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Full Stack Developer Intern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the internship role, expectations, and what the intern will learn..."
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                        Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="REMOTE">Remote</option>
                        <option value="HYBRID">Hybrid</option>
                        <option value="ON_SITE">On-site</option>
                        <option value="FULL_TIME">Full-time</option>
                        <option value="PART_TIME">Part-time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                        Location *
                      </label>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Mumbai, India"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                        Duration (months) *
                      </label>
                      <Input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="3"
                        min="1"
                        max="12"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                        Stipend (₹/month) *
                      </label>
                      <Input
                        type="number"
                        name="stipend"
                        value={formData.stipend}
                        onChange={handleChange}
                        placeholder="15000"
                        min="0"
                        step="1000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                        Max Applicants
                      </label>
                      <Input
                        type="number"
                        name="maxApplicants"
                        value={formData.maxApplicants}
                        onChange={handleChange}
                        placeholder="50"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Requirements & Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Required Skills (comma-separated)
                    </label>
                    <Input
                      name="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={handleChange}
                      placeholder="React, Node.js, TypeScript, MongoDB"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Separate skills with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Preferred Skills (comma-separated)
                    </label>
                    <Input
                      name="preferredSkills"
                      value={formData.preferredSkills}
                      onChange={handleChange}
                      placeholder="AWS, Docker, GraphQL"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Optional skills that are a plus
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Responsibilities (one per line)
                    </label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                      placeholder="Develop and maintain web applications&#10;Collaborate with team members&#10;Participate in code reviews&#10;Write clean, maintainable code"
                      rows={5}
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Enter each responsibility on a new line
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Benefits (one per line)
                    </label>
                    <textarea
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleChange}
                      placeholder="Certificate of completion&#10;Letter of recommendation&#10;Flexible working hours&#10;Mentorship from senior developers"
                      rows={4}
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Enter each benefit on a new line
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Application Deadline *
                    </label>
                    <Input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Last date to accept applications
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      When the internship will begin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/employer/internships">
                <Button variant="outline" type="button" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Creating Draft...</span>
                  </>
                ) : (
                  'Create Draft Internship'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
