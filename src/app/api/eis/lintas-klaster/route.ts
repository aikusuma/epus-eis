import { NextRequest, NextResponse } from 'next/server';
import {
  getGawatDarurat,
  getGawatDaruratSummary,
  getFarmasi,
  getFarmasiSummary,
  getLaboratorium,
  getLaboratoriumSummary,
  getRawatInap,
  getRawatInapSummary
} from '@/lib/eis-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const puskesmasIdParam = searchParams.get('puskesmasId');
    const puskesmasId =
      puskesmasIdParam && puskesmasIdParam !== 'all'
        ? puskesmasIdParam
        : undefined;
    const tanggal = searchParams.get('tanggal')
      ? new Date(searchParams.get('tanggal')!)
      : undefined;

    const [
      gawatDarurat,
      gawatDaruratSummary,
      farmasi,
      farmasiSummary,
      laboratorium,
      laboratoriumSummary,
      rawatInap,
      rawatInapSummary
    ] = await Promise.all([
      getGawatDarurat(puskesmasId, tanggal),
      getGawatDaruratSummary(puskesmasId, tanggal),
      getFarmasi(puskesmasId, tanggal),
      getFarmasiSummary(puskesmasId, tanggal),
      getLaboratorium(puskesmasId, tanggal),
      getLaboratoriumSummary(puskesmasId, tanggal),
      getRawatInap(puskesmasId, tanggal),
      getRawatInapSummary(puskesmasId, tanggal)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        gawatDarurat: {
          data: gawatDarurat,
          summary: gawatDaruratSummary
        },
        farmasi: {
          data: farmasi,
          summary: farmasiSummary
        },
        laboratorium: {
          data: laboratorium,
          summary: laboratoriumSummary
        },
        rawatInap: {
          data: rawatInap,
          summary: rawatInapSummary
        }
      }
    });
  } catch (error) {
    console.error('Error fetching lintas klaster data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
