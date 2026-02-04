import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthUser {
    userId: string;
    email: string;
    role: string;
}

export function verifyAuth(request: NextRequest): AuthUser | null {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    } catch {
        return null;
    }
}

export function requireAuth(request: NextRequest): { user: AuthUser } | NextResponse {
    const user = verifyAuth(request);
    
    if (!user) {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    return { user };
}

export function requireRole(request: NextRequest, roles: string[]): { user: AuthUser } | NextResponse {
    const result = requireAuth(request);
    
    if (result instanceof NextResponse) {
        return result;
    }

    if (!roles.includes(result.user.role)) {
        return NextResponse.json(
            { message: 'Forbidden' },
            { status: 403 }
        );
    }

    return result;
}
