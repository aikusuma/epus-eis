import { NextRequest, NextResponse } from 'next/server';
import { getAllPuskesmas, getPuskesmasCount } from '@/lib/eis-data';

export async function GET(request: NextRequest) {
  try {
    const [puskesmas, count] = await Promise.all([
      getAllPuskesmas(),
      getPuskesmasCount()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        puskesmas,
        count
      }
    });
  } catch (error) {
    console.error('Error fetching puskesmas data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch puskesmas data' },
      { status: 500 }
    );
  }
}
