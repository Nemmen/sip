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

export default function EmployerProfilePage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <EmployerProfileContent />
    </RouteGuard>
  );
}

function EmployerProfileContent() {
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
      setProfile(data.companyProfile || {
        companyName: '',
        industry: '',
        companySize: '',
        website: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: '',
        contactPerson: '',
        contactPhone: '',
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
      await apiClient.patch('/users/me', { companyProfile: profile });
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
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Company Profile</h1>
              <p className="text-sm text-[var(--text-secondary)]">Manage your company information</p>
            </div>
            <Link href="/employer/dashboard">
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
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    required
                  />
                  <Input
                    label="Industry"
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    placeholder="e.g., Technology, Finance"
                  />
                  <Input
                    label="Company Size"
                    value={profile.companySize}
                    onChange={(e) => setProfile({ ...profile, companySize: e.target.value })}
                    placeholder="e.g., 10-50, 100-500"
                  />
                  <Input
                    label="Website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Input
                  label="Company Description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  helperText="Tell students about your company"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                  <Input
                    label="State"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  />
                  <Input
                    label="Country"
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Person"
                    value={profile.contactPerson}
                    onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })}
                  />
                  <Input
                    label="Contact Phone"
                    type="tel"
                    value={profile.contactPhone}
                    onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={user?.email}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Save Changes
              </Button>
              <Link href="/employer/kyc">
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
