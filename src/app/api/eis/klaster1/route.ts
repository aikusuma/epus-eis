import { NextRequest, NextResponse } from 'next/server';
import {
  getTenagaKesehatan,
  getTenagaKesehatanTrend,
  getStokObat,
  getKeuangan,
  getKeuanganTrend
} from '@/lib/eis-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const puskesmasIdParam = searchParams.get('puskesmasId');
    const puskesmasId =
      puskesmasIdParam && puskesmasIdParam !== 'all'
        ? puskesmasIdParam
        : undefined;
    const bulan = searchParams.get('bulan')
      ? parseInt(searchParams.get('bulan')!)
      : undefined;
    const tahun = searchParams.get('tahun')
      ? parseInt(searchParams.get('tahun')!)
      : undefined;

    const [sdm, sdmTrend, obat, keuangan, keuanganTrend] = await Promise.all([
      getTenagaKesehatan(puskesmasId, bulan, tahun),
      getTenagaKesehatanTrend(puskesmasId, tahun),
      getStokObat(puskesmasId, bulan, tahun),
      getKeuangan(puskesmasId, bulan, tahun),
      getKeuanganTrend(puskesmasId, tahun)
    ]);

    // Calculate summary statistics
    const totalNakes = sdm.reduce(
      (sum: number, item: any) => sum + item.jumlah,
      0
    );
    const totalTarget = sdm.reduce(
      (sum: number, item: any) => sum + item.target,
      0
    );
    const totalPendapatan = keuangan.reduce(
      (sum: number, item: any) => sum + item.nominal,
      0
    );
    const totalObat = obat.reduce(
      (sum: number, item: any) => sum + item.stok,
      0
    );
    const totalPemakaian = obat.reduce(
      (sum: number, item: any) => sum + item.pemakaian,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalNakes,
          targetNakes: totalTarget,
          rasioNakes:
            totalNakes > 0
              ? `1:${Math.round(1700000 / totalNakes).toLocaleString()}`
              : '-',
          totalPendapatan,
          totalObat,
          pemakaianObat: totalPemakaian
        },
        sdm,
        sdmTrend,
        obat,
        keuangan,
        keuanganTrend
      }
    });
  } catch (error) {
    console.error('Error fetching klaster1 data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
