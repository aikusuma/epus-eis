// Authentication API - Logout
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, createUserContext } from '@/lib/acl';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (payload) {
      const user = createUserContext(payload);

      // Fire-and-forget audit to avoid blocking logout
      db.auditLog
        .create({
          data: {
            userId: user.userId,
            action: 'logout',
            ipAddress:
              req.headers.get('x-forwarded-for') ??
              req.headers.get('x-real-ip') ??
              undefined,
            userAgent: req.headers.get('user-agent') ?? undefined
          }
        })
        .catch((err) => console.error('Audit log logout error', err));
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Always succeed
  }
}
