import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const puskesmas = await prisma.puskesmas.findMany({
      orderBy: { namaPuskesmas: 'asc' },
      select: {
        id: true,
        kodePuskesmas: true,
        namaPuskesmas: true,
        jenis: true
      },
      distinct: ['kodePuskesmas'] // Ensure no duplicate puskesmas
    });

    // Additional deduplication by name as a safeguard
    const uniquePuskesmas = Array.from(
      new Map(puskesmas.map((p) => [p.namaPuskesmas, p])).values()
    );

    return NextResponse.json(uniquePuskesmas);
  } catch (error) {
    console.error('Error fetching puskesmas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puskesmas' },
      { status: 500 }
    );
  }
}
