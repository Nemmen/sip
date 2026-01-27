'use client';

import { useInternships } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth-context';

export default function EmployerInternshipsPage() {
  return (
    <RouteGuard allowedRoles={['EMPLOYER']}>
      <EmployerInternshipsContent />
    </RouteGuard>
  );
}

function EmployerInternshipsContent() {
  const { user } = useAuth();
  const { data: internships, loading } = useInternships({});
  
  const myInternships = internships?.filter((i: any) => i.employerId === user?.id) || [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--primary)]">My Internships</h1>
            <div className="flex gap-2">
              <Link href="/employer/internships/new">
                <Button variant="primary">+ Post New</Button>
              </Link>
              <Link href="/employer/dashboard">
                <Button variant="outline" size="sm">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <Card>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : myInternships.length > 0 ? (
              <div className="space-y-4">
                {myInternships.map((internship: any) => (
                  <div key={internship.id} className="p-4 border rounded-lg hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-[var(--primary)] mb-1">
                          {internship.title}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {internship.location} • ₹{internship.stipend?.toLocaleString()}/month
                        </p>
                      </div>
                      <Badge variant={internship.status === 'OPEN' ? 'success' : 'default'}>
                        {internship.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-[var(--text-secondary)] mb-3">
                      <span>📝 {internship._count?.applications || 0} applications</span>
                      <span>📅 Posted: {new Date(internship.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/employer/internships/${internship.id}`}>
                      <Button variant="outline" size="sm">Manage</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg text-[var(--text-secondary)] mb-4">
                  No internships posted yet
                </p>
                <Link href="/employer/internships/new">
                  <Button variant="primary">Post Your First Internship</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
