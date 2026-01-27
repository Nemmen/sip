'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api';
import { wsService } from './websocket';

interface User {
    id: string;
    email: string;
    role: 'STUDENT' | 'EMPLOYER' | 'ADMIN' | 'TPO';
    kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    studentProfile?: {
        id: string;
        firstName: string;
        lastName: string;
        phone?: string;
        skills: string[];
        resume?: string;
    };
    employerProfile?: {
        id: string;
        companyName: string;
        industry: string;
        website?: string;
        trustScore: number;
    };
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        role: 'STUDENT' | 'EMPLOYER';
        firstName?: string;
        lastName?: string;
        companyName?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = async () => {
        try {
            const { data } = await apiClient.get('/users/me');
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const { data } = await apiClient.post('/auth/login', { email, password });

            const { accessToken, refreshToken, user: userData } = data;

            setAccessToken(accessToken);
            setUser(userData);

            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('userRole', userData.role);
            }

            // Connect WebSocket
            wsService.connect(accessToken);
            wsService.register(userData.id);

            // Redirect based on role
            const roleRoutes = {
                STUDENT: '/student/dashboard',
                EMPLOYER: '/employer/dashboard',
                ADMIN: '/admin/dashboard',
                TPO: '/admin/dashboard',
            };
            router.push(roleRoutes[userData.role as keyof typeof roleRoutes]);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const register = async (data: {
        email: string;
        password: string;
        role: 'STUDENT' | 'EMPLOYER';
        firstName?: string;
        lastName?: string;
        companyName?: string;
    }) => {
        try {
            const { data: responseData } = await apiClient.post('/auth/register', data);

            const { accessToken, refreshToken, user: userData } = responseData;

            setAccessToken(accessToken);
            setUser(userData);

            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('userRole', userData.role);
            }

            // Connect WebSocket
            wsService.connect(accessToken);
            wsService.register(userData.id);

            // Redirect based on role
            const roleRoutes = {
                STUDENT: '/student/dashboard',
                EMPLOYER: '/employer/dashboard',
            };
            router.push(roleRoutes[userData.role as keyof typeof roleRoutes]);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = async () => {
        try {
            // Optional: Call backend logout endpoint (fails silently if not implemented)
            await apiClient.post('/auth/logout').catch(() => {});
        } catch (error) {
            // Ignore logout API errors
        } finally {
            setUser(null);
            setAccessToken(null);
            wsService.disconnect();

            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRole');
            }

            router.push('/auth/login');
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    setAccessToken(token);
                    try {
                        const { data } = await apiClient.get('/users/me');
                        setUser(data);
                        wsService.connect(token);
                        wsService.register(data.id);
                    } catch (error) {
                        console.error('Failed to authenticate:', error);
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('userRole');
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const value = {
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
