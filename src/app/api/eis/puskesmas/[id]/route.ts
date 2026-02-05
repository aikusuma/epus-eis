// EIS API - Puskesmas analytics detail
// Get detailed analytics for specific puskesmas

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  UNAUTHORIZED,
  canAccessPuskesmas,
  logAudit
} from '@/lib/acl';
import { queryClickHouse } from '@/lib/clickhouse';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/types/acl';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = createUserContext(payload);

    if (!user.permissions.includes(PERMISSIONS.VIEW_DASHBOARD)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id: puskesmasId } = await params;

    // Check if user can access this puskesmas
    if (!canAccessPuskesmas(user, puskesmasId)) {
      return NextResponse.json(
        { error: 'Akses ke puskesmas ini ditolak' },
        { status: 403 }
      );
    }

    // Get puskesmas details from Postgres
    const puskesmas = await db.puskesmas.findUnique({
      where: { id: puskesmasId },
      include: {
        wilayah: true
      }
    });

    if (!puskesmas) {
      return NextResponse.json(
        { error: 'Puskesmas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Parse query params for period
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'month';

    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(
          prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Query current period total visits
    const [currentVisits] = await queryClickHouse<{ total: number }>(
      `SELECT sum(total_visits) as total
       FROM fact_kunjungan 
       WHERE puskesmas_id = {puskesmasId:String}
         AND date >= {startDate:Date}`,
      {
        puskesmasId,
        startDate: startDate.toISOString().split('T')[0]
      }
    );

    // Query previous period for comparison
    const [prevVisits] = await queryClickHouse<{ total: number }>(
      `SELECT sum(total_visits) as total
       FROM fact_kunjungan 
       WHERE puskesmas_id = {puskesmasId:String}
         AND date >= {prevStartDate:Date}
         AND date <= {prevEndDate:Date}`,
      {
        puskesmasId,
        prevStartDate: prevStartDate.toISOString().split('T')[0],
        prevEndDate: prevEndDate.toISOString().split('T')[0]
      }
    );

    const currentTotal = Number(currentVisits?.total ?? 0);
    const prevTotal = Number(prevVisits?.total ?? 0);
    const pertumbuhanPersen =
      prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

    // Top 10 diseases for this puskesmas
    const topDiseases = await queryClickHouse<{
      icd10_code: string;
      total: number;
    }>(
      `SELECT 
        icd10_code,
        sum(visit_count) as total
       FROM fact_diagnosis 
       WHERE puskesmas_id = {puskesmasId:String}
         AND date >= {startDate:Date}
       GROUP BY icd10_code
       ORDER BY total DESC
       LIMIT 10`,
      {
        puskesmasId,
        startDate: startDate.toISOString().split('T')[0]
      }
    );

    // Get ICD-10 names
    const icd10Codes = topDiseases.map((d) => d.icd10_code);
    const icd10Details = await db.icd10.findMany({
      where: { code: { in: icd10Codes } },
      select: { code: true, name: true, groupName: true }
    });
    type Icd10Detail = (typeof icd10Details)[number];
    const icd10Map = new Map<string, Icd10Detail>(
      icd10Details.map((i) => [i.code, i])
    );

    // Distribution by layanan type
    const layananDist = await queryClickHouse<{
      layanan_type: string;
      total: number;
    }>(
      `SELECT 
        layanan_type,
        sum(total_visits) as total
       FROM fact_kunjungan 
       WHERE puskesmas_id = {puskesmasId:String}
         AND date >= {startDate:Date}
       GROUP BY layanan_type`,
      {
        puskesmasId,
        startDate: startDate.toISOString().split('T')[0]
      }
    );

    // Distribution by gender
    const genderDist = await queryClickHouse<{ gender: string; total: number }>(
      `SELECT 
        gender,
        sum(visit_count) as total
       FROM fact_diagnosis 
       WHERE puskesmas_id = {puskesmasId:String}
         AND date >= {startDate:Date}
       GROUP BY gender`,
      {
        puskesmasId,
        startDate: startDate.toISOString().split('T')[0]
      }
    );

    // Monthly trend (last 12 months)
    const monthlyTrend = await queryClickHouse<{
      month: string;
      total: number;
    }>(
      `SELECT 
        formatDateTime(date, '%Y-%m') as month,
        sum(total_visits) as total
       FROM fact_kunjungan 
       WHERE puskesmas_id = {puskesmasId:String}
         AND date >= {startDate12:Date}
       GROUP BY month
       ORDER BY month`,
      {
        puskesmasId,
        startDate12: new Date(now.getFullYear() - 1, now.getMonth(), 1)
          .toISOString()
          .split('T')[0]
      }
    );

    // Log audit
    await logAudit(
      user,
      'view_puskesmas_detail',
      'puskesmas',
      puskesmasId,
      { period },
      req
    );

    return NextResponse.json({
      puskesmas: {
        id: puskesmas.id,
        name: puskesmas.namaPuskesmas,
        type: puskesmas.jenis,
        kecamatan: puskesmas.wilayah?.namaKecamatan,
        kecamatanId: puskesmas.wilayahId,
        address: puskesmas.alamat
      },
      period,
      startDate: startDate.toISOString().split('T')[0],
      summary: {
        totalKunjungan: currentTotal,
        pertumbuhanPersen: Math.round(pertumbuhanPersen * 100) / 100,
        periodeBanding: `${prevStartDate.toISOString().split('T')[0]} - ${prevEndDate.toISOString().split('T')[0]}`
      },
      topPenyakit: topDiseases.map((d) => ({
        icd10Code: d.icd10_code,
        icd10Name: icd10Map.get(d.icd10_code)?.name ?? d.icd10_code,
        groupName: icd10Map.get(d.icd10_code)?.groupName,
        total: Number(d.total)
      })),
      distribusiLayanan: layananDist.map((d) => ({
        layanan: d.layanan_type,
        total: Number(d.total)
      })),
      distribusiGender: genderDist.map((d) => ({
        gender: d.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        total: Number(d.total)
      })),
      trenBulanan: monthlyTrend.map((d) => ({
        bulan: d.month,
        total: Number(d.total)
      }))
    });
  } catch (error) {
    console.error('Puskesmas detail API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
