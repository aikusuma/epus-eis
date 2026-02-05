import { NextRequest, NextResponse } from 'next/server';
import {
  getAntenatalCare,
  getAntenatalCareTrend,
  getImunisasi
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

    const [anc, ancTrend, imunisasiBayi, imunisasiBaduta] = await Promise.all([
      getAntenatalCare(puskesmasId, bulan, tahun),
      getAntenatalCareTrend(puskesmasId, tahun),
      getImunisasi('bayi', puskesmasId, bulan, tahun),
      getImunisasi('baduta', puskesmasId, bulan, tahun)
    ]);

    // Combine all imunisasi data
    const imunisasi = [...imunisasiBayi, ...imunisasiBaduta];

    // Calculate summary statistics - anc is a single object not array
    const totalK1 = anc.k1 || 0;
    const totalK4 = anc.k4 || 0;
    const totalSasaran = anc.target || 0;

    const totalIdl = imunisasi.reduce(
      (sum: number, item: any) => sum + (item.capaian || 0),
      0
    );
    const totalSasaranImunisasi = imunisasi.reduce(
      (sum: number, item: any) => sum + (item.sasaran || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          capaianK1:
            totalSasaran > 0 ? Math.round((totalK1 / totalSasaran) * 100) : 0,
          capaianK4:
            totalSasaran > 0 ? Math.round((totalK4 / totalSasaran) * 100) : 0,
          totalK1,
          totalK4,
          capaianIdl:
            totalSasaranImunisasi > 0
              ? Math.round((totalIdl / totalSasaranImunisasi) * 100)
              : 0,
          totalIdl,
          sasaranImunisasi: totalSasaranImunisasi
        },
        anc,
        ancTrend,
        imunisasi
      }
    });
  } catch (error) {
    console.error('Error fetching klaster2 data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
