// EIS API - Disease distribution analytics
// Distribution by age, gender, location, time

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  UNAUTHORIZED,
  filterByUserAccess,
  logAudit
} from '@/lib/acl';
import { queryClickHouse } from '@/lib/clickhouse';
import { PERMISSIONS, AGE_GROUPS } from '@/types/acl';

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
    const groupBy = searchParams.get('groupBy') ?? 'puskesmas'; // 'puskesmas', 'kecamatan', 'age', 'gender', 'month'
    const icd10Code = searchParams.get('icd10');
    const icd10Group = searchParams.get('group');
    const period = searchParams.get('period') ?? 'year';

    // Get filter based on user access
    const accessFilter = filterByUserAccess(user);

    // Build WHERE clause
    let whereClause = '1=1';
    const params: Record<string, string | number> = {};

    if (accessFilter.puskesmasId) {
      whereClause += ' AND puskesmas_id = {puskesmasId:String}';
      params.puskesmasId = accessFilter.puskesmasId;
    }

    if (icd10Code) {
      whereClause += ' AND icd10_code = {icd10Code:String}';
      params.icd10Code = icd10Code;
    }

    // Date filter based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      default: // year
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    whereClause += ' AND date >= {startDate:Date}';
    params.startDate = startDate.toISOString().split('T')[0];

    let distribution: { label: string; value: number }[] = [];

    switch (groupBy) {
      case 'gender':
        const genderData = await queryClickHouse<{
          gender: string;
          total: number;
        }>(
          `SELECT 
            gender,
            sum(visit_count) as total
           FROM fact_diagnosis 
           WHERE ${whereClause}
           GROUP BY gender`,
          params
        );
        distribution = genderData.map((d) => ({
          label: d.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          value: Number(d.total)
        }));
        break;

      case 'age':
        const ageData = await queryClickHouse<{
          age_group: string;
          total: number;
        }>(
          `SELECT 
            age_group,
            sum(visit_count) as total
           FROM fact_diagnosis 
           WHERE ${whereClause}
           GROUP BY age_group
           ORDER BY age_group`,
          params
        );
        // Map age group codes to labels
        distribution = ageData.map((d) => ({
          label:
            AGE_GROUPS[d.age_group as keyof typeof AGE_GROUPS] ?? d.age_group,
          value: Number(d.total)
        }));
        break;

      case 'month':
        const monthData = await queryClickHouse<{
          month: string;
          total: number;
        }>(
          `SELECT 
            formatDateTime(date, '%Y-%m') as month,
            sum(visit_count) as total
           FROM fact_diagnosis 
           WHERE ${whereClause}
           GROUP BY month
           ORDER BY month`,
          params
        );
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'Mei',
          'Jun',
          'Jul',
          'Agu',
          'Sep',
          'Okt',
          'Nov',
          'Des'
        ];
        distribution = monthData.map((d) => {
          const [, monthNum] = d.month.split('-');
          return {
            label: monthNames[parseInt(monthNum) - 1] ?? d.month,
            value: Number(d.total)
          };
        });
        break;

      case 'kecamatan':
        // Join with dim_puskesmas to get kecamatan
        const kecData = await queryClickHouse<{
          kecamatan_id: string;
          kecamatan: string;
          total: number;
        }>(
          `SELECT 
            p.kecamatan_id,
            p.kecamatan,
            sum(f.visit_count) as total
           FROM fact_diagnosis f
           INNER JOIN dim_puskesmas p ON f.puskesmas_id = p.id
           WHERE ${whereClause.replace(/puskesmas_id/g, 'f.puskesmas_id')}
           GROUP BY p.kecamatan_id, p.kecamatan
           ORDER BY total DESC`,
          params
        );
        distribution = kecData.map((d) => ({
          label: d.kecamatan,
          value: Number(d.total)
        }));
        break;

      default: // puskesmas
        const pkmData = await queryClickHouse<{
          puskesmas_id: string;
          puskesmas: string;
          total: number;
        }>(
          `SELECT 
            p.id as puskesmas_id,
            p.name as puskesmas,
            sum(f.visit_count) as total
           FROM fact_diagnosis f
           INNER JOIN dim_puskesmas p ON f.puskesmas_id = p.id
           WHERE ${whereClause.replace(/puskesmas_id/g, 'f.puskesmas_id')}
           GROUP BY p.id, p.name
           ORDER BY total DESC`,
          params
        );
        distribution = pkmData.map((d) => ({
          label: d.puskesmas,
          value: Number(d.total)
        }));
    }

    // Log audit
    await logAudit(
      user,
      'view_disease_distribution',
      'disease',
      undefined,
      { groupBy, period },
      req
    );

    return NextResponse.json({
      groupBy,
      period,
      startDate: startDate.toISOString().split('T')[0],
      icd10Code: icd10Code ?? null,
      distribution,
      total: distribution.reduce((sum, d) => sum + d.value, 0)
    });
  } catch (error) {
    console.error('Disease distribution API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
