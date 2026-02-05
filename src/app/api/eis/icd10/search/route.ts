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
    const kategori = searchParams.get('kategori'); // 'PTM', 'menular', 'KIA', 'umum'
    const group = searchParams.get('group'); // 'ISPA', 'HIPERTENSI', etc.
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

    // Build query conditions using Prisma types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true
    };

    if (q.length >= 2) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (kategori) {
      where.kategoriProgram = kategori;
    }

    if (group) {
      where.groupCode = group;
    }

    // Query ICD-10 from Postgres
    const results = await db.icd10.findMany({
      where,
      take: limit,
      orderBy: [{ groupCode: 'asc' }, { code: 'asc' }],
      select: {
        code: true,
        name: true,
        groupCode: true,
        groupName: true,
        kategoriProgram: true
      }
    });

    // Get distinct groups for filter options
    const groups = await db.icd10.groupBy({
      by: ['groupCode', 'groupName'],
      where: kategori
        ? { kategoriProgram: kategori, isActive: true }
        : { isActive: true },
      orderBy: { groupCode: 'asc' }
    });

    // Get distinct categories
    const categories = await db.icd10.groupBy({
      by: ['kategoriProgram'],
      where: { isActive: true },
      orderBy: { kategoriProgram: 'asc' }
    });

    return NextResponse.json({
      query: q,
      results: results.map((r: (typeof results)[number]) => ({
        code: r.code,
        name: r.name,
        displayName: `${r.code} - ${r.name}`,
        groupCode: r.groupCode,
        groupName: r.groupName,
        kategori: r.kategoriProgram
      })),
      total: results.length,
      filters: {
        groups: groups.map((g: (typeof groups)[number]) => ({
          code: g.groupCode,
          name: g.groupName
        })),
        categories: categories
          .map((c: (typeof categories)[number]) => c.kategoriProgram)
          .filter(Boolean)
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
