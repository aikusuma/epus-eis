// EIS API - Overview/Dashboard summary
// Returns aggregated data for dashboard KPIs

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  UNAUTHORIZED,
  filterByUserAccess,
  logAudit
} from '@/lib/acl';
import { queryClickHouse } from '@/lib/clickhouse';
import { PERMISSIONS } from '@/types/acl';

interface OverviewData {
  totalKunjungan: number;
  totalDiagnosis: number;
  totalPuskesmas: number;
  kunjunganBulanIni: number;
  kunjunganBulanLalu: number;
  pertumbuhanPersen: number;
  topPenyakit: Array<{
    icd10Code: string;
    icd10Name: string;
    jumlah: number;
  }>;
  distribusiGender: {
    lakiLaki: number;
    perempuan: number;
  };
  distribusiUsia: Array<{
    ageGroup: string;
    jumlah: number;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = createUserContext(payload);

    // Check permission
    if (!user.permissions.includes(PERMISSIONS.VIEW_DASHBOARD)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Get filter based on user access
    const accessFilter = filterByUserAccess(user);

    // Build WHERE clause
    let whereClause = '1=1';
    const params: Record<string, string> = {};

    if (accessFilter.puskesmasId) {
      whereClause += ' AND puskesmas_id = {puskesmasId:String}';
      params.puskesmasId = accessFilter.puskesmasId;
    }

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Query 1: Total visits this month
    const [kunjunganBulanIni] = await queryClickHouse<{ total: number }>(
      `SELECT sum(visit_count) as total 
       FROM fact_diagnosis 
       WHERE ${whereClause} 
       AND date >= {startDate:Date}`,
      { ...params, startDate: startOfMonth.toISOString().split('T')[0] }
    );

    // Query 2: Total visits last month
    const [kunjunganBulanLalu] = await queryClickHouse<{ total: number }>(
      `SELECT sum(visit_count) as total 
       FROM fact_diagnosis 
       WHERE ${whereClause} 
       AND date >= {startDate:Date} 
       AND date <= {endDate:Date}`,
      {
        ...params,
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      }
    );

    // Query 3: Top 10 diseases
    const topPenyakit = await queryClickHouse<{
      icd10_code: string;
      jumlah: number;
    }>(
      `SELECT icd10_code, sum(visit_count) as jumlah 
       FROM fact_diagnosis 
       WHERE ${whereClause} 
       AND date >= {startDate:Date}
       GROUP BY icd10_code 
       ORDER BY jumlah DESC 
       LIMIT 10`,
      { ...params, startDate: startOfMonth.toISOString().split('T')[0] }
    );

    // Query 4: Gender distribution
    const genderDist = await queryClickHouse<{
      gender: string;
      jumlah: number;
    }>(
      `SELECT gender, sum(visit_count) as jumlah 
       FROM fact_diagnosis 
       WHERE ${whereClause} 
       AND date >= {startDate:Date}
       GROUP BY gender`,
      { ...params, startDate: startOfMonth.toISOString().split('T')[0] }
    );

    // Query 5: Age distribution
    const ageDist = await queryClickHouse<{
      age_group: string;
      jumlah: number;
    }>(
      `SELECT age_group, sum(visit_count) as jumlah 
       FROM fact_diagnosis 
       WHERE ${whereClause} 
       AND date >= {startDate:Date}
       GROUP BY age_group 
       ORDER BY 
         CASE age_group 
           WHEN 'bayi' THEN 1 
           WHEN 'anak' THEN 2 
           WHEN 'remaja' THEN 3 
           WHEN 'dewasa' THEN 4 
           WHEN 'lansia' THEN 5 
         END`,
      { ...params, startDate: startOfMonth.toISOString().split('T')[0] }
    );

    // Query 6: Unique puskesmas count
    const [puskesmasCount] = await queryClickHouse<{ total: number }>(
      `SELECT uniqExact(puskesmas_id) as total 
       FROM fact_diagnosis 
       WHERE ${whereClause}`,
      params
    );

    // Calculate growth percentage
    const currentTotal = kunjunganBulanIni?.total ?? 0;
    const lastTotal = kunjunganBulanLalu?.total ?? 0;
    const pertumbuhanPersen =
      lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    // Log audit
    await logAudit(
      user,
      'view_dashboard',
      'overview',
      undefined,
      undefined,
      req
    );

    const response: OverviewData = {
      totalKunjungan: currentTotal,
      totalDiagnosis: currentTotal, // Same as visits for now
      totalPuskesmas: puskesmasCount?.total ?? 0,
      kunjunganBulanIni: currentTotal,
      kunjunganBulanLalu: lastTotal,
      pertumbuhanPersen: Math.round(pertumbuhanPersen * 100) / 100,
      topPenyakit: topPenyakit.map((p) => ({
        icd10Code: p.icd10_code,
        icd10Name: '', // Will be enriched from Postgres
        jumlah: Number(p.jumlah)
      })),
      distribusiGender: {
        lakiLaki: Number(genderDist.find((g) => g.gender === 'L')?.jumlah ?? 0),
        perempuan: Number(genderDist.find((g) => g.gender === 'P')?.jumlah ?? 0)
      },
      distribusiUsia: ageDist.map((a) => ({
        ageGroup: a.age_group,
        jumlah: Number(a.jumlah)
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
