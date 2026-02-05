import { NextRequest, NextResponse } from 'next/server';
import {
  getKunjunganByDesa,
  getKunjunganBySiklusHidup,
  getTopKeluhan,
  getTopObat,
  getTopDiagnosa
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

    // Build date range from bulan/tahun
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (bulan && tahun) {
      startDate = new Date(tahun, bulan - 1, 1);
      endDate = new Date(tahun, bulan, 0);
    }

    const [
      kunjunganByDesa,
      kunjunganBySiklusHidup,
      topKeluhan,
      topObat,
      topDiagnosa
    ] = await Promise.all([
      getKunjunganByDesa(puskesmasId, startDate, endDate),
      getKunjunganBySiklusHidup(puskesmasId, startDate, endDate),
      getTopKeluhan(puskesmasId, bulan, tahun),
      getTopObat(puskesmasId, bulan, tahun),
      getTopDiagnosa(puskesmasId, bulan, tahun, 10)
    ]);

    // Calculate summary statistics
    const totalKunjungan = kunjunganByDesa.reduce(
      (sum: number, item: any) => sum + (item.laki + item.perempuan),
      0
    );
    const desaTerbanyak = kunjunganByDesa[0]?.desa || '-';
    const kelompokTerbanyak = kunjunganBySiklusHidup[0]?.name || '-';

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalKunjungan,
          desaTerbanyak,
          kelompokTerbanyak,
          jumlahDesa: kunjunganByDesa.length,
          jumlahKeluhan: topKeluhan.length,
          jumlahObat: topObat.length
        },
        kunjunganByDesa,
        kunjunganBySiklusHidup,
        topKeluhan,
        topObat,
        topDiagnosa
      }
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
