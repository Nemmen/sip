import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (typeof window !== 'undefined') {
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    try {
                        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                            refreshToken,
                        });

                        localStorage.setItem('accessToken', data.accessToken);
                        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

                        return apiClient(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, logout
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('userRole');
                        window.location.href = '/auth/login';
                    }
                } else {
                    window.location.href = '/auth/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    register: (data: any) => apiClient.post('/auth/register', data),
    login: (data: any) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    getProfile: () => apiClient.get('/users/me'),
};

// Users API
export const usersApi = {
    getProfile: () => apiClient.get('/users/me'),
    updateProfile: (data: any) => apiClient.patch('/users/me', data),
    updateStudentProfile: (data: any) => apiClient.put('/users/profile/student', data),
    updateEmployerProfile: (data: any) => apiClient.put('/users/profile/employer', data),
    getAll: () => apiClient.get('/users'),
};

// Internships API
export const internshipsApi = {
    getAll: (params?: any) => apiClient.get('/internships', { params }),
    getOne: (id: string) => apiClient.get(`/internships/${id}`),
    create: (data: any) => apiClient.post('/internships', data),
    update: (id: string, data: any) => apiClient.patch(`/internships/${id}`, data),
    publish: (id: string) => apiClient.put(`/internships/${id}/publish`),
    close: (id: string) => apiClient.put(`/internships/${id}/close`),
    delete: (id: string) => apiClient.delete(`/internships/${id}`),
    getMyInternships: () => apiClient.get('/internships/employer/my-internships'),
    getApplications: (id: string) => apiClient.get(`/internships/${id}/applications`),
};

// Applications API
export const applicationsApi = {
    create: (data: any) => apiClient.post('/applications', data),
    getMyApplications: () => apiClient.get('/applications/my-applications'),
    getEmployerApplications: () => apiClient.get('/applications/employer/my-applications'),
    getOne: (id: string) => apiClient.get(`/applications/${id}`),
    getInternshipApplications: (internshipId: string) =>
        apiClient.get(`/applications/internship/${internshipId}`),
    updateStatus: (id: string, status: string, interviewDate?: string, interviewNotes?: string) =>
        apiClient.put(`/applications/${id}/status`, { status, interviewDate, interviewNotes }),
    withdraw: (id: string) => apiClient.put(`/applications/${id}/withdraw`),
};

// KYC API
export const kycApi = {
    submit: (data: any) => apiClient.post('/kyc/submit', data),
    getMyDocuments: () => apiClient.get('/kyc/my-documents'),
    getPending: () => apiClient.get('/kyc/pending'),
    review: (id: string, data: any) => apiClient.put(`/kyc/review/${id}`, data),
};

// Escrow API
export const escrowApi = {
    createMilestone: (data: any) => apiClient.post('/escrow/milestones', data),
    getMilestones: (applicationId: string) =>
        apiClient.get(`/escrow/milestones/${applicationId}`),
    fund: (data: any) => apiClient.post('/escrow/fund', data),
    approve: (milestoneId: string) => apiClient.put(`/escrow/approve/${milestoneId}`),
};

// Messages API
export const messagesApi = {
    getConversations: () => apiClient.get('/messages/conversations'),
    getMessages: (otherUserId: string) =>
        apiClient.get(`/messages/conversation/${otherUserId}`),
    send: (data: any) => apiClient.post('/messages/send', data),
    markAsRead: (id: string) => apiClient.put(`/messages/${id}/read`),
};

// Notifications API
export const notificationsApi = {
    getAll: (unreadOnly = false) =>
        apiClient.get('/notifications', { params: { unreadOnly } }),
    getUnreadCount: () => apiClient.get('/notifications/unread-count'),
    markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};

// Storage API
export const storageApi = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/storage/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Audit API
export const auditApi = {
    getUserLogs: (userId: string, limit?: number) =>
        apiClient.get(`/audit/user/${userId}`, { params: { limit } }),
    getResourceLogs: (resource: string, resourceId: string) =>
        apiClient.get(`/audit/resource/${resource}/${resourceId}`),
    getMyActivity: (limit?: number) =>
        apiClient.get('/audit/my-activity', { params: { limit } }),
    getApplicationLogs: (applicationId: string) =>
        apiClient.get(`/audit/application/${applicationId}`),
};

// Admin API
export const adminApi = {
    users: {
        getAll: (params?: any) => apiClient.get('/admin/users', { params }),
        create: (data: any) => apiClient.post('/admin/users', data),
        update: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
        suspend: (id: string) => apiClient.put(`/admin/users/${id}/suspend`),
        activate: (id: string) => apiClient.put(`/admin/users/${id}/activate`),
        delete: (id: string) => apiClient.delete(`/admin/users/${id}`),
    },
    internships: {
        getAll: (params?: any) => apiClient.get('/admin/internships', { params }),
        delete: (id: string) => apiClient.delete(`/admin/internships/${id}`),
    },
    applications: {
        getAll: (params?: any) => apiClient.get('/admin/applications', { params }),
    },
    kyc: {
        getAll: (params?: any) => apiClient.get('/admin/kyc', { params }),
        review: (id: string, data: any) => apiClient.put(`/kyc/review/${id}`, data),
    },
    stats: {
        getAll: () => apiClient.get('/admin/stats'),
    },
};

export default apiClient;
