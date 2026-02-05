// EIS API - ICD-10 search and lookup
// Search ICD-10 codes for autocomplete and filtering

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, createUserContext, UNAUTHORIZED } from '@/lib/acl';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/types/acl';

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = createUserContext(payload);

    if (!user.permissions.includes(PERMISSIONS.VIEW_DASHBOARD)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

    // Build query conditions using Prisma types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (q.length >= 2) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { display: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Query ICD-10 from Postgres
    const results = await db.icd10.findMany({
      where,
      take: limit,
      orderBy: [{ code: 'asc' }],
      select: {
        code: true,
        display: true,
        version: true
      }
    });

    // Get distinct versions for filter options
    const versions = await db.icd10.groupBy({
      by: ['version'],
      orderBy: { version: 'asc' }
    });

    return NextResponse.json({
      query: q,
      results: results.map((r: (typeof results)[number]) => ({
        code: r.code,
        name: r.display,
        displayName: `${r.code} - ${r.display}`,
        version: r.version
      })),
      total: results.length,
      filters: {
        versions: versions.map((v: (typeof versions)[number]) => v.version)
      }
    });
  } catch (error) {
    console.error('ICD-10 search API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
