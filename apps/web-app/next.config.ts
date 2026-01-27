import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'sgp1.digitaloceanspaces.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    env: {
        API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
        WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    },
    turbopack: {},
};

export default withPWA(nextConfig);
