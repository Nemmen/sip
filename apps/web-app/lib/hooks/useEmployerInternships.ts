'use client';

import { useEffect, useState } from 'react';
import { internshipsApi } from '../api';

/**
 * Hook for fetching employer's own internships
 * Calls GET /internships/employer/my-internships
 * Returns ALL statuses: DRAFT, PUBLISHED, CLOSED, CANCELLED
 * 
 * Different from useInternships() which fetches public PUBLISHED internships only
 */
export function useEmployerInternships() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInternships = async () => {
        setLoading(true);
        try {
            const response = await internshipsApi.getMyInternships();
            setData(response.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch your internships');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    return { 
        data, 
        loading, 
        error, 
        refetch: fetchInternships 
    };
}
