'use client';

import { useEffect, useState } from 'react';
import { apiClient } from './api';
import { wsService } from './websocket';

// Generic hook for data fetching
export function useQuery<T>(endpoint: string, deps: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(endpoint);
            setData(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, deps);

    return { data, loading, error, refetch };
}

// Internships hook
export function useInternships(filters?: {
    search?: string;
    skills?: string[];
    location?: string;
    minStipend?: number;
    maxStipend?: number;
}) {
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInternships = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
            if (filters?.location) params.append('location', filters.location);
            if (filters?.minStipend) params.append('minStipend', filters.minStipend.toString());
            if (filters?.maxStipend) params.append('maxStipend', filters.maxStipend.toString());

            const response = await apiClient.get(`/internships?${params.toString()}`);
            setInternships(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch internships');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, [JSON.stringify(filters)]);

    return { internships, loading, error, refetch: fetchInternships };
}

// Re-export employer-specific hook
export { useEmployerInternships } from './hooks/useEmployerInternships';

// Applications hook with real-time updates
export function useApplications() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/applications/my-applications');
            setApplications(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();

        // Subscribe to real-time updates
        const handleApplicationUpdate = (data: any) => {
            setApplications((prev) =>
                prev.map((app) => (app.id === data.id ? { ...app, ...data } : app)),
            );
        };

        wsService.onApplicationUpdate(handleApplicationUpdate);

        return () => {
            wsService.off('application:update', handleApplicationUpdate);
        };
    }, []);

    return { applications, loading, error, refetch: fetchApplications };
}

// Messages hook with real-time updates
export function useMessages(otherUserId?: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = async () => {
        try {
            const response = await apiClient.get('/messages/conversations');
            setConversations(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch conversations');
        }
    };

    const fetchMessages = async () => {
        if (!otherUserId) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/messages/conversation/${otherUserId}`);
            setMessages(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (content: string, applicationId?: string) => {
        if (!otherUserId) return;
        try {
            await apiClient.post('/messages/send', {
                receiverId: otherUserId,
                content,
                applicationId,
            });
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to send message');
        }
    };

    useEffect(() => {
        fetchConversations();
        if (otherUserId) {
            fetchMessages();
        }

        // Subscribe to real-time messages
        const handleNewMessage = (data: any) => {
            if (data.senderId === otherUserId || data.receiverId === otherUserId) {
                setMessages((prev) => [...prev, data]);
            }
            fetchConversations(); // Refresh conversation list
        };

        wsService.onMessage(handleNewMessage);

        return () => {
            wsService.off('message', handleNewMessage);
        };
    }, [otherUserId]);

    return {
        messages,
        conversations,
        loading,
        error,
        sendMessage,
        refetch: fetchMessages,
    };
}

// Notifications hook with real-time updates
export function useNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const [notifResponse, countResponse] = await Promise.all([
                apiClient.get('/notifications'),
                apiClient.get('/notifications/unread-count'),
            ]);
            setNotifications(notifResponse.data);
            setUnreadCount(countResponse.data.count);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await apiClient.put(`/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to mark all as read');
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        const handleNewNotification = (data: any) => {
            setNotifications((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);
        };

        wsService.onNotification(handleNewNotification);

        return () => {
            wsService.off('notification', handleNewNotification);
        };
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}

// KYC hook
export function useKYC() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/kyc/my-documents');
            setDocuments(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch KYC documents');
        } finally {
            setLoading(false);
        }
    };

    const submitDocument = async (formData: FormData) => {
        try {
            await apiClient.post('/kyc/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            await fetchDocuments();
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to submit document');
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    return { documents, loading, error, submitDocument, refetch: fetchDocuments };
}

// Milestones hook with real-time updates
export function useMilestones(applicationId?: string) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMilestones = async () => {
        if (!applicationId) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/escrow/milestones/${applicationId}`);
            setMilestones(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch milestones');
        } finally {
            setLoading(false);
        }
    };

    const approveMilestone = async (milestoneId: string) => {
        try {
            await apiClient.put(`/escrow/approve/${milestoneId}`);
            await fetchMilestones();
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to approve milestone');
        }
    };

    useEffect(() => {
        if (applicationId) {
            fetchMilestones();

            // Subscribe to real-time updates
            const handleMilestoneUpdate = (data: any) => {
                if (data.applicationId === applicationId) {
                    setMilestones((prev) =>
                        prev.map((m) => (m.id === data.id ? { ...m, ...data } : m)),
                    );
                }
            };

            wsService.onMilestoneUpdate(handleMilestoneUpdate);

            return () => {
                wsService.off('milestone:update', handleMilestoneUpdate);
            };
        }
    }, [applicationId]);

    return { milestones, loading, error, approveMilestone, refetch: fetchMilestones };
}
