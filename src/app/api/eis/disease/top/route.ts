// EIS API - Disease/ICD-10 analytics
// Top diseases and distribution

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  UNAUTHORIZED,
  filterByUserAccess,
  logAudit
} from '@/lib/acl';
import { queryClickHouse } from '@/lib/clickhouse';
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
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const period = searchParams.get('period') ?? 'month'; // 'week', 'month', 'year'
    const kategori = searchParams.get('kategori'); // 'PTM', 'menular', 'KIA', 'umum'
    const group = searchParams.get('group'); // 'ISPA', 'HIPERTENSI', etc.

    // Get filter based on user access
    const accessFilter = filterByUserAccess(user);

    // Build WHERE clause
    let whereClause = '1=1';
    const params: Record<string, string | number> = {};

    if (accessFilter.puskesmasId) {
      whereClause += ' AND puskesmas_id = {puskesmasId:String}';
      params.puskesmasId = accessFilter.puskesmasId;
    }

    // Date filter based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    whereClause += ' AND date >= {startDate:Date}';
    params.startDate = startDate.toISOString().split('T')[0];

    // Query top diseases
    const topDiseases = await queryClickHouse<{
      icd10_code: string;
      total_visits: number;
      male_count: number;
      female_count: number;
    }>(
      `SELECT 
        icd10_code,
        sum(visit_count) as total_visits,
        sumIf(visit_count, gender = 'L') as male_count,
        sumIf(visit_count, gender = 'P') as female_count
       FROM fact_diagnosis 
       WHERE ${whereClause}
       GROUP BY icd10_code 
       ORDER BY total_visits DESC 
       LIMIT {limit:UInt32}`,
      { ...params, limit }
    );

    // Get ICD-10 details from Postgres
    const icd10Codes = topDiseases.map((d) => d.icd10_code);

    const icd10Details = await db.icd10.findMany({
      where: {
        code: { in: icd10Codes },
        ...(kategori && { kategoriProgram: kategori }),
        ...(group && { groupCode: group })
      },
      select: {
        code: true,
        name: true,
        groupCode: true,
        groupName: true,
        kategoriProgram: true
      }
    });

    // Define type for ICD-10 detail
    type Icd10Detail = (typeof icd10Details)[number];

    // Create lookup map
    const icd10Map = new Map<string, Icd10Detail>(
      icd10Details.map((i: Icd10Detail) => [i.code, i])
    );

    // Enrich results
    const enrichedResults = topDiseases
      .filter((d) => icd10Map.has(d.icd10_code))
      .map((d) => {
        const detail = icd10Map.get(d.icd10_code)!;
        return {
          icd10Code: d.icd10_code,
          icd10Name: detail.name,
          groupCode: detail.groupCode,
          groupName: detail.groupName,
          kategoriProgram: detail.kategoriProgram,
          totalKunjungan: Number(d.total_visits),
          distribusiGender: {
            lakiLaki: Number(d.male_count),
            perempuan: Number(d.female_count)
          }
        };
      });

    // Log audit
    await logAudit(
      user,
      'view_disease_top',
      'disease',
      undefined,
      { period, limit },
      req
    );

    return NextResponse.json({
      period,
      startDate: startDate.toISOString().split('T')[0],
      data: enrichedResults
    });
  } catch (error) {
    console.error('Disease top API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
