import { NextRequest, NextResponse } from 'next/server';
import { getTopDiagnosa, getDiagnosaByBahaya } from '@/lib/eis-data';

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
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 10;

    // Build date range from bulan/tahun
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (bulan && tahun) {
      startDate = new Date(tahun, bulan - 1, 1);
      endDate = new Date(tahun, bulan, 0);
    }

    const [topDiagnosa, diagnosaTinggi, diagnosaSedang, diagnosaRendah] =
      await Promise.all([
        getTopDiagnosa(puskesmasId, bulan, tahun, limit),
        getDiagnosaByBahaya('TINGGI', puskesmasId, startDate, endDate),
        getDiagnosaByBahaya('SEDANG', puskesmasId, startDate, endDate),
        getDiagnosaByBahaya('RENDAH', puskesmasId, startDate, endDate)
      ]);

    // Calculate summary statistics - using correct property names
    const totalKasus = topDiagnosa.reduce(
      (sum: number, item: any) => sum + (item.jumlahKasus || 0),
      0
    );
    const diagnosaTertinggi = topDiagnosa[0]?.nama || '-';
    const kasusAkut = diagnosaTinggi.reduce(
      (sum: number, d: any) => sum + (d.jumlah || 0),
      0
    );
    const kasusKronis = diagnosaSedang.reduce(
      (sum: number, d: any) => sum + (d.jumlah || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalKasus,
          diagnosaTertinggi,
          jumlahDiagnosa: topDiagnosa.length,
          kasusAkut,
          kasusKronis,
          kasusRingan: totalKasus - kasusAkut - kasusKronis
        },
        topDiagnosa,
        diagnosaBahaya: {
          tinggi: diagnosaTinggi,
          sedang: diagnosaSedang,
          rendah: diagnosaRendah
        }
      }
    });
  } catch (error) {
    console.error('Error fetching klaster4 data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
