import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload, hasRequiredRole } from '../auth';
import { UserRole } from '../../types';

// In-Memory Rate Limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

export function extractAuth(req: NextRequest): TokenPayload | null {
  // Check Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Check HttpOnly session cookie
  const cookieToken = req.cookies.get('gameverse_session')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

export function requireAuth(req: NextRequest): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const user = extractAuth(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}

export function requireRole(
  req: NextRequest,
  requiredRole: UserRole
): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse) return { user: null, errorResponse };

  if (!user || !hasRequiredRole(user.role, requiredRole)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Requires role '${requiredRole}', but current role is '${user?.role}'.`,
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

export function requireOwnership(
  req: NextRequest,
  resourceOwnerId: string
): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse) return { user: null, errorResponse };

  // Super Admins and Admins bypass tenant ownership for platform support
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return { user, errorResponse: null };
  }

  if (user?.userId !== resourceOwnerId) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Cross-developer data access violation. You do not own this resource.',
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}
