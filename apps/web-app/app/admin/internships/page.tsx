'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { adminApi } from '@/lib/api';

export default function AdminInternshipsPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminInternshipsContent />
    </RouteGuard>
  );
}

function AdminInternshipsContent() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInternships();
  }, [filter]);

  const loadInternships = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filter !== 'ALL') {
        params.status = filter;
      }
      const response = await adminApi.internships.getAll(params).catch(() => ({ data: { data: [] } }));
      const data = response?.data;
      const internshipsArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.internships) ? data.internships : []));
      setInternships(internshipsArray);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load internships');
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  // Only filter by search query client-side, status filtering is done server-side
  const filteredInternships = Array.isArray(internships) 
    ? internships.filter(internship => {
        const matchesSearch = 
          !searchQuery ||
          internship.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          internship.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          internship.location?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
    : [];

  const stats = {
    total: (internships || []).length,
    published: (internships || []).filter(i => i.status === 'PUBLISHED').length,
    draft: (internships || []).filter(i => i.status === 'DRAFT').length,
    closed: (internships || []).filter(i => i.status === 'CLOSED').length,
  };

  const statusColors: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-800',
    DRAFT: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-gray-100 text-gray-800',
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
              <h1 className="text-3xl font-bold text-gray-900">Internship Moderation</h1>
              <p className="text-gray-600 mt-1">Monitor and manage all internships</p>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={`cursor-pointer transition ${filter === 'ALL' ? 'ring-2 ring-blue-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('ALL')}>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'PUBLISHED' ? 'ring-2 ring-green-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('PUBLISHED')}>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'DRAFT' ? 'ring-2 ring-yellow-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('DRAFT')}>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </div>
          </Card>
          <Card className={`cursor-pointer transition ${filter === 'CLOSED' ? 'ring-2 ring-gray-600' : 'hover:shadow-md'}`}>
            <div className="p-4" onClick={() => setFilter('CLOSED')}>
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Internships Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internship</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInternships.length > 0 ? (
                  filteredInternships.map((internship: any) => (
                    <tr key={internship.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{internship.title}</p>
                          <p className="text-sm text-gray-600">
                            {internship.location} • {internship.type?.replace('_', ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{internship.company}</p>
                        <p className="text-sm text-gray-600">{internship.employer?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[internship.status] || 'bg-gray-100 text-gray-800'}>
                          {internship.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {internship._count?.applications || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(internship.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/internships/${internship.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                      No internships found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
