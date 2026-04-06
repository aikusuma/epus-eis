import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  filterByUserAccess
} from '@/lib/acl';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const payload = await getUserFromRequest(request);
    const accessFilter = payload
      ? filterByUserAccess(createUserContext(payload))
      : {};

    const where: any = {};
    if (accessFilter.puskesmasId) {
      // Locked user - return ONLY their puskesmas
      where.id = accessFilter.puskesmasId;
    }

    const puskesmas = await db.puskesmas.findMany({
      where,
      orderBy: { namaPuskesmas: 'asc' },
      select: {
        id: true,
        kodePuskesmas: true,
        namaPuskesmas: true,
        jenis: true
      },
      distinct: ['kodePuskesmas']
    });

    const uniquePuskesmas = Array.from(
      new Map(puskesmas.map((p) => [p.namaPuskesmas, p])).values()
    );

    // Return meta flag so frontend knows if user is locked
    return NextResponse.json({
      data: uniquePuskesmas,
      meta: {
        isLocked: !!accessFilter.puskesmasId,
        puskesmasId: accessFilter.puskesmasId || null
      }
    });
  } catch (error) {
    console.error('Error fetching puskesmas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puskesmas' },
      { status: 500 }
    );
  }
}
