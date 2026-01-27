'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import apiClient from '@/lib/api';

export default function StudentProfilePage() {
  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <StudentProfileContent />
    </RouteGuard>
  );
}

function StudentProfileContent() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/users/me');
      setProfile(data.studentProfile || {
        fullName: '',
        phone: '',
        dateOfBirth: '',
        college: '',
        degree: '',
        major: '',
        graduationYear: '',
        cgpa: '',
        skills: [],
        bio: '',
        resume: '',
        linkedin: '',
        github: '',
        portfolio: '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');

    try {
      await apiClient.patch('/users/me', { studentProfile: profile });
      setSuccessMessage('Profile updated successfully!');
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
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
              <h1 className="text-2xl font-bold text-[var(--primary)]">My Profile</h1>
              <p className="text-sm text-[var(--text-secondary)]">Manage your information</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {successMessage && (
            <Alert variant="success" className="mb-6">
              {successMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={profile.dateOfBirth?.split('T')[0] || ''}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={user?.email}
                    disabled
                  />
                </div>
                <Input
                  label="Bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  helperText="Tell us about yourself"
                />
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="College/University"
                    value={profile.college}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                  />
                  <Input
                    label="Degree"
                    value={profile.degree}
                    onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                    placeholder="e.g., B.Tech, B.Sc"
                  />
                  <Input
                    label="Major/Specialization"
                    value={profile.major}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  />
                  <Input
                    label="Graduation Year"
                    type="number"
                    value={profile.graduationYear}
                    onChange={(e) => setProfile({ ...profile, graduationYear: e.target.value })}
                  />
                  <Input
                    label="CGPA/Percentage"
                    type="number"
                    step="0.01"
                    value={profile.cgpa}
                    onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills & Links */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Skills"
                  value={profile.skills?.join(', ') || ''}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map((s: string) => s.trim()) })}
                  placeholder="React, Node.js, Python, etc."
                  helperText="Separate skills with commas"
                />
                <Input
                  label="Resume URL"
                  value={profile.resume}
                  onChange={(e) => setProfile({ ...profile, resume: e.target.value })}
                  placeholder="https://..."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="LinkedIn"
                    value={profile.linkedin}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/..."
                  />
                  <Input
                    label="GitHub"
                    value={profile.github}
                    onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                    placeholder="github.com/..."
                  />
                  <Input
                    label="Portfolio"
                    value={profile.portfolio}
                    onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                    placeholder="yourportfolio.com"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Save Changes
              </Button>
              <Link href="/student/profile/kyc">
                <Button variant="outline">
                  Manage KYC
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
