// ACL Middleware for API routes
// Enforces access control at the API layer

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type UserPayload } from '@/lib/auth';
import {
  DINKES_LEVEL_ROLES,
  type PermissionCode,
  type RoleCode,
  type UserContext
} from '@/types/acl';

// Error responses
export const UNAUTHORIZED = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export const FORBIDDEN = (reason?: string) =>
  NextResponse.json({ error: 'Forbidden', reason }, { status: 403 });

// Extract user from request
export async function getUserFromRequest(
  req: NextRequest
): Promise<UserPayload | null> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    // Check cookie as fallback
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Create user context from payload
export function createUserContext(payload: UserPayload): UserContext {
  return {
    userId: payload.userId,
    email: payload.email,
    roleCode: payload.roleCode as RoleCode,
    puskesmasId: payload.puskesmasId,
    wilayahId: payload.wilayahId,
    permissions: payload.permissions as PermissionCode[]
  };
}

// Check if user has specific permission
export function hasPermission(
  user: UserContext,
  permission: PermissionCode
): boolean {
  return user.permissions.includes(permission);
}

// Check if user can access all puskesmas
export function canAccessAllPuskesmas(user: UserContext): boolean {
  return DINKES_LEVEL_ROLES.includes(user.roleCode);
}

// Check if user can access specific puskesmas
export function canAccessPuskesmas(
  user: UserContext,
  puskesmasId: string
): boolean {
  // Dinkes level can access all
  if (canAccessAllPuskesmas(user)) return true;

  // Kepala Puskesmas can only access their own
  if (user.puskesmasId === puskesmasId) return true;

  return false;
}

// Check if user can view detail data (non-aggregated)
export function canViewDetailData(
  user: UserContext,
  puskesmasId?: string
): boolean {
  // Dinkes level can view all detail
  if (canAccessAllPuskesmas(user)) return true;

  // Kepala Puskesmas can view detail of their own puskesmas
  if (puskesmasId && user.puskesmasId === puskesmasId) return true;

  return false;
}

// Middleware factory for protecting routes
export function withAuth(
  handler: (req: NextRequest, user: UserContext) => Promise<NextResponse>,
  options?: {
    permissions?: PermissionCode[];
    requirePuskesmas?: boolean;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = createUserContext(payload);

    // Check required permissions
    if (options?.permissions) {
      const hasRequiredPermission = options.permissions.some((p) =>
        hasPermission(user, p)
      );
      if (!hasRequiredPermission) {
        return FORBIDDEN('Insufficient permissions');
      }
    }

    // Check if puskesmas context is required
    if (
      options?.requirePuskesmas &&
      !user.puskesmasId &&
      !canAccessAllPuskesmas(user)
    ) {
      return FORBIDDEN('Puskesmas context required');
    }

    return handler(req, user);
  };
}

// Filter puskesmas query based on user context
export function filterByUserAccess(user: UserContext): {
  puskesmasId?: string;
  wilayahId?: string;
} {
  if (canAccessAllPuskesmas(user)) {
    return {}; // No filter for dinkes level
  }

  return {
    puskesmasId: user.puskesmasId,
    wilayahId: user.wilayahId
  };
}

// Log audit event
export async function logAudit(
  user: UserContext,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  req?: NextRequest
) {
  const { db } = await import('@/lib/db');

  await db.auditLog.create({
    data: {
      userId: user.userId,
      action,
      resource,
      resourceId,
      details: details ?? undefined,
      ipAddress:
        req?.headers.get('x-forwarded-for') ??
        req?.headers.get('x-real-ip') ??
        undefined,
      userAgent: req?.headers.get('user-agent') ?? undefined
    }
  });
}
