// EIS API - Overview/Dashboard summary
// Returns aggregated data for dashboard KPIs using Prisma

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  UNAUTHORIZED,
  filterByUserAccess,
  logAudit
} from '@/lib/acl';
import {
  getOverviewSummary,
  getOverviewTrend,
  getTopDiagnosa,
  getPuskesmasCount,
  getKunjunganBySiklusHidup
} from '@/lib/eis-data';
import { PERMISSIONS } from '@/types/acl';

interface OverviewData {
  success: boolean;
  data: {
    summary: {
      totalKunjungan: number;
      kunjunganBaru: number;
      kunjunganLama: number;
      pasienBpjs: number;
      pasienUmum: number;
      totalPuskesmas: number;
      pertumbuhanPersen: number;
    };
    trend: Array<{
      bulan: string;
      kunjungan: number;
      bpjs: number;
      umum: number;
    }>;
    topPenyakit: Array<{
      icd10Code: string;
      nama: string;
      jumlah: number;
    }>;
    distribusiUsia: Array<{
      kelompok: string;
      laki: number;
      perempuan: number;
    }>;
  };
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

    // Get query params - allow override from query string
    const { searchParams } = new URL(req.url);
    const puskesmasIdParam = searchParams.get('puskesmasId');
    const puskesmasId =
      puskesmasIdParam && puskesmasIdParam !== 'all'
        ? puskesmasIdParam
        : accessFilter.puskesmasId;
    const bulan = searchParams.get('bulan')
      ? parseInt(searchParams.get('bulan')!)
      : new Date().getMonth() + 1;
    const tahun = searchParams.get('tahun')
      ? parseInt(searchParams.get('tahun')!)
      : new Date().getFullYear();

    // Calculate date range for kunjunganBySiklusHidup
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    // Fetch data in parallel
    const [summary, trend, topPenyakit, puskesmasCount, distribusiUsia] =
      await Promise.all([
        getOverviewSummary(puskesmasId, bulan, tahun),
        getOverviewTrend(puskesmasId, tahun),
        getTopDiagnosa(puskesmasId, bulan, tahun),
        getPuskesmasCount(),
        getKunjunganBySiklusHidup(puskesmasId, startDate, endDate)
      ]);

    // Calculate growth percentage from trend data
    const currentMonthData = trend.find(
      (t: { bulan: string }) =>
        t.bulan ===
        [
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
        ][bulan - 1]
    );
    const lastMonthData = trend.find(
      (t: { bulan: string }) =>
        t.bulan ===
        [
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
        ][bulan - 2 < 0 ? 11 : bulan - 2]
    );

    const currentTotal = currentMonthData?.kunjungan ?? summary.totalKunjungan;
    const lastTotal = lastMonthData?.kunjungan ?? 0;
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
      success: true,
      data: {
        summary: {
          totalKunjungan: summary.totalKunjungan,
          kunjunganBaru: summary.kunjunganBaru,
          kunjunganLama: summary.kunjunganLama,
          pasienBpjs: summary.pasienBpjs,
          pasienUmum: summary.pasienUmum,
          totalPuskesmas: puskesmasCount,
          pertumbuhanPersen: Math.round(pertumbuhanPersen * 100) / 100
        },
        trend,
        topPenyakit: topPenyakit.map(
          (p: { kode: string; diagnosa: string; jumlah: number }) => ({
            icd10Code: p.kode,
            nama: p.diagnosa,
            jumlah: p.jumlah
          })
        ),
        distribusiUsia: distribusiUsia.map(
          (d: { name: string; laki: number; perempuan: number }) => ({
            kelompok: d.name,
            laki: d.laki,
            perempuan: d.perempuan
          })
        )
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Overview API error:', error);

    // Return fallback empty data
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalKunjungan: 0,
          kunjunganBaru: 0,
          kunjunganLama: 0,
          pasienBpjs: 0,
          pasienUmum: 0,
          totalPuskesmas: 0,
          pertumbuhanPersen: 0
        },
        trend: [],
        topPenyakit: [],
        distribusiUsia: []
      }
    });
  }
}
