import { NextRequest, NextResponse } from 'next/server';
import {
  getDeteksiDini,
  getFaktorRisiko,
  getPemeriksaanGigi
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

    const [deteksiDini, faktorRisiko, pemeriksaanGigi] = await Promise.all([
      getDeteksiDini(puskesmasId, bulan, tahun),
      getFaktorRisiko(puskesmasId, bulan, tahun),
      getPemeriksaanGigi(puskesmasId, bulan, tahun)
    ]);

    // Calculate summary statistics - using correct property names from eis-data
    const totalPasienDeteksi = deteksiDini.reduce(
      (sum: number, item: any) => sum + (item.sasaran || 0),
      0
    );
    const totalPositif = deteksiDini.reduce(
      (sum: number, item: any) => sum + (item.capaian || 0),
      0
    );
    const totalNegatif = deteksiDini.reduce(
      (sum: number, item: any) =>
        sum + ((item.sasaran || 0) - (item.capaian || 0)),
      0
    );

    const totalPasienRisiko = faktorRisiko.reduce(
      (sum: number, item: any) => sum + (item.jumlahKasus || 0),
      0
    );
    const totalRisiko = faktorRisiko.reduce(
      (sum: number, item: any) => sum + (item.jumlahKasus || 0),
      0
    );

    const totalPemeriksaan = pemeriksaanGigi.reduce(
      (sum: number, item: any) => sum + (item.diperiksa || 0),
      0
    );
    const butuhPerawatan = pemeriksaanGigi.reduce(
      (sum: number, item: any) => sum + (item.perluPerawatan || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPasienDeteksi,
          totalPositif,
          totalNegatif,
          tingkatDeteksi:
            totalPasienDeteksi > 0
              ? Math.round((totalPositif / totalPasienDeteksi) * 100)
              : 0,
          totalPasienRisiko,
          totalRisiko,
          persenRisiko:
            totalPasienRisiko > 0
              ? Math.round((totalRisiko / totalPasienRisiko) * 100)
              : 0,
          totalPemeriksaan,
          butuhPerawatan,
          persenButuhPerawatan:
            totalPemeriksaan > 0
              ? Math.round((butuhPerawatan / totalPemeriksaan) * 100)
              : 0
        },
        deteksiDini,
        faktorRisiko,
        pemeriksaanGigi
      }
    });
  } catch (error) {
    console.error('Error fetching klaster3 data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
