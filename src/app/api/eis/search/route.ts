import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { unstable_cache } from 'next/cache';

// Cache untuk search ICD-10
const searchIcd10Cached = unstable_cache(
  async (query: string, limit: number) => {
    return prisma.icd10.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { display: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { diagnoses: true }
        }
      },
      take: limit,
      orderBy: [{ code: 'asc' }]
    });
  },
  ['search-icd10'],
  { revalidate: 300 } // 5 minutes
);

// Get top ICD-10 by diagnosis count
const getTopIcd10Cached = unstable_cache(
  async (limit: number) => {
    // Get ICD-10 with most diagnoses
    const icd10List = await prisma.icd10.findMany({
      include: {
        _count: {
          select: { diagnoses: true }
        }
      },
      take: 100 // Get more to sort
    });

    // Sort by diagnosis count and take top
    return icd10List
      .sort(
        (a: any, b: any) =>
          (b._count?.diagnoses || 0) - (a._count?.diagnoses || 0)
      )
      .slice(0, limit);
  },
  ['top-icd10'],
  { revalidate: 300 }
);

// Get diagnoses for specific ICD-10
const getDiagnosesByIcd10 = unstable_cache(
  async (icd10Id: string, limit: number) => {
    return prisma.diagnosisDummy.findMany({
      where: { icd10Id },
      include: {
        icd10: {
          select: { code: true, display: true }
        }
      },
      orderBy: { tanggalPeriksa: 'desc' },
      take: limit
    });
  },
  ['diagnoses-by-icd10'],
  { revalidate: 60 }
);

// Get trend data for specific ICD-10 (last 30 days)
const getTrendByIcd10 = unstable_cache(
  async (icd10Id: string) => {
    // Get all diagnoses for this ICD-10 in last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const diagnoses = await prisma.diagnosisDummy.findMany({
      where: {
        icd10Id,
        tanggalPeriksa: { gte: startDate }
      },
      select: {
        tanggalPeriksa: true,
        pasienGender: true
      }
    });

    // Group by week
    const weeklyData: Record<
      string,
      { laki: number; perempuan: number; total: number }
    > = {};

    diagnoses.forEach((d: any) => {
      const date = new Date(d.tanggalPeriksa);
      // Get week start (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { laki: 0, perempuan: 0, total: 0 };
      }

      weeklyData[weekKey].total++;
      if (d.pasienGender === 'L') {
        weeklyData[weekKey].laki++;
      } else {
        weeklyData[weekKey].perempuan++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(weeklyData)
      .map(([date, data]) => ({
        date,
        minggu: `Minggu ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
        ...data
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
  ['trend-by-icd10'],
  { revalidate: 300 }
);

// Get monthly trend data for specific ICD-10 (last 12 months)
const getMonthlyTrendByIcd10 = unstable_cache(
  async (icd10Id: string) => {
    // Get all diagnoses for this ICD-10 in last 12 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const diagnoses = await prisma.diagnosisDummy.findMany({
      where: {
        icd10Id,
        tanggalPeriksa: { gte: startDate }
      },
      select: {
        tanggalPeriksa: true,
        pasienGender: true
      }
    });

    // Group by month
    const monthlyData: Record<
      string,
      { laki: number; perempuan: number; total: number }
    > = {};

    diagnoses.forEach((d: any) => {
      const date = new Date(d.tanggalPeriksa);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { laki: 0, perempuan: 0, total: 0 };
      }

      monthlyData[monthKey].total++;
      if (d.pasienGender === 'L') {
        monthlyData[monthKey].laki++;
      } else {
        monthlyData[monthKey].perempuan++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([date, data]) => {
        const [year, month] = date.split('-');
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'Mei',
          'Jun',
          'Jul',
          'Ags',
          'Sep',
          'Okt',
          'Nov',
          'Des'
        ];
        return {
          date,
          bulan: `${monthNames[parseInt(month) - 1]} ${year}`,
          ...data
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  ['monthly-trend-by-icd10'],
  { revalidate: 300 }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const icd10Id = searchParams.get('icd10Id');
    const type = searchParams.get('type') || 'search'; // 'search', 'top', 'diagnoses'
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get diagnoses for specific ICD-10
    if (type === 'diagnoses' && icd10Id) {
      const diagnoses = await getDiagnosesByIcd10(icd10Id, limit);
      return NextResponse.json({
        success: true,
        data: diagnoses.map((d: any) => ({
          id: d.id,
          pasienNama: d.pasienNama,
          pasienUmur: d.pasienUmur,
          pasienGender: d.pasienGender,
          puskesmas: d.puskesmas,
          tanggalPeriksa:
            d.tanggalPeriksa instanceof Date
              ? d.tanggalPeriksa.toISOString()
              : String(d.tanggalPeriksa),
          icd10: d.icd10
        }))
      });
    }

    // Get trend data for specific ICD-10
    if (type === 'trend' && icd10Id) {
      const trend = await getTrendByIcd10(icd10Id);
      return NextResponse.json({
        success: true,
        data: trend
      });
    }

    // Get monthly trend data for specific ICD-10
    if (type === 'monthly-trend' && icd10Id) {
      const trend = await getMonthlyTrendByIcd10(icd10Id);
      return NextResponse.json({
        success: true,
        data: trend
      });
    }

    // Get top ICD-10 (for initial display)
    if (type === 'top' || !query) {
      const topIcd10 = await getTopIcd10Cached(limit);
      return NextResponse.json({
        success: true,
        data: topIcd10.map((i: any) => ({
          id: i.id,
          code: i.code,
          display: i.display,
          version: i.version,
          _count: { diagnoses: i._count?.diagnoses || 0 }
        }))
      });
    }

    // Search ICD-10
    const results = await searchIcd10Cached(query, limit);

    return NextResponse.json({
      success: true,
      data: results.map((i: any) => ({
        id: i.id,
        code: i.code,
        display: i.display,
        version: i.version,
        _count: { diagnoses: i._count?.diagnoses || 0 }
      }))
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
