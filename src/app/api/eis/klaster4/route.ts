import { NextRequest, NextResponse } from 'next/server';
import { getTopDiagnosa, getDiagnosaByBahaya } from '@/lib/eis-data';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  chunk,
  readRawBody,
  verifyEpusSignatureOrThrow
} from '@/lib/webhooks/epus';
import { revalidateTag } from 'next/cache';

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

export const runtime = 'nodejs';
export const maxDuration = 60;

const klaster4IngestSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    bulan: z.number().int().min(1).max(12),
    tahun: z.number().int().min(2000).max(2100),
    topDiagnosa: z
      .array(
        z.object({
          icd10Code: z.string().min(1),
          diagnosa: z.string().min(1),
          jumlahKasus: z.number().int().min(0)
        })
      )
      .optional(),
    diagnosaHarian: z
      .array(
        z.object({
          tanggal: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
          icd10Code: z.string().min(1),
          diagnosa: z.string().min(1),
          jumlahKasus: z.number().int().min(0),
          tingkatBahaya: z.enum(['TINGGI', 'SEDANG', 'RENDAH'])
        })
      )
      .optional()
  })
  .refine((v) => !!v.puskesmasId || !!v.puskesmasKode, {
    message: 'puskesmasId atau puskesmasKode wajib diisi',
    path: ['puskesmasId']
  })
  .refine((v) => !!v.topDiagnosa?.length || !!v.diagnosaHarian?.length, {
    message:
      'Minimal salah satu data harus dikirim: topDiagnosa atau diagnosaHarian',
    path: ['topDiagnosa']
  });

type Klaster4IngestInput = z.infer<typeof klaster4IngestSchema>;

function parseDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = klaster4IngestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Klaster4IngestInput = parsed.data;

    const puskesmas = data.puskesmasId
      ? await db.puskesmas.findUnique({
          where: { id: data.puskesmasId },
          select: { id: true, kodePuskesmas: true, namaPuskesmas: true }
        })
      : await db.puskesmas.findUnique({
          where: { kodePuskesmas: data.puskesmasKode! },
          select: { id: true, kodePuskesmas: true, namaPuskesmas: true }
        });

    if (!puskesmas) {
      return NextResponse.json(
        { error: 'Puskesmas tidak ditemukan' },
        { status: 400 }
      );
    }

    const existing = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`\n        SELECT id\n        FROM ingestion_logs\n        WHERE event_type = 'klaster4'\n          AND puskesmas_id = ${puskesmas.id}\n          AND payload->>'batchId' = ${data.batchId}\n        LIMIT 1\n      `
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        ingestionId: existing[0].id
      });
    }

    const ingestionLog = await db.ingestionLog.create({
      data: {
        eventType: 'klaster4',
        puskesmasId: puskesmas.id,
        payload: {
          ...data,
          puskesmasId: puskesmas.id,
          puskesmasKode: puskesmas.kodePuskesmas
        } as unknown as object,
        status: 'processing'
      }
    });

    try {
      if (data.topDiagnosa?.length) {
        for (const items of chunk(data.topDiagnosa, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.topDiagnosa.upsert({
                where: {
                  puskesmasId_icd10Code_bulan_tahun: {
                    puskesmasId: puskesmas.id,
                    icd10Code: item.icd10Code,
                    bulan: data.bulan,
                    tahun: data.tahun
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  icd10Code: item.icd10Code,
                  diagnosa: item.diagnosa,
                  jumlahKasus: item.jumlahKasus,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: {
                  diagnosa: item.diagnosa,
                  jumlahKasus: item.jumlahKasus
                }
              })
            )
          );
        }
      }

      if (data.diagnosaHarian?.length) {
        const dates = Array.from(
          new Set(data.diagnosaHarian.map((d) => d.tanggal))
        ).map(parseDateOnly);

        // Replace all records for provided dates (puskesmas-level) to support corrections at scale.
        await db.diagnosaHarian.deleteMany({
          where: {
            puskesmasId: puskesmas.id,
            tanggal: { in: dates }
          }
        });

        for (const items of chunk(data.diagnosaHarian, 2000)) {
          await db.diagnosaHarian.createMany({
            data: items.map((item) => ({
              puskesmasId: puskesmas.id,
              icd10Code: item.icd10Code,
              diagnosa: item.diagnosa,
              jumlahKasus: item.jumlahKasus,
              tingkatBahaya: item.tingkatBahaya,
              tanggal: parseDateOnly(item.tanggal)
            }))
          });
        }
      }

      await db.ingestionLog.update({
        where: { id: ingestionLog.id },
        data: { status: 'processed', processedAt: new Date() }
      });

      revalidateTag('klaster4', '');

      return NextResponse.json({
        success: true,
        duplicate: false,
        ingestionId: ingestionLog.id,
        summary: {
          batchId: data.batchId,
          puskesmasId: puskesmas.id,
          puskesmasKode: puskesmas.kodePuskesmas,
          puskesmasName: puskesmas.namaPuskesmas,
          bulan: data.bulan,
          tahun: data.tahun,
          topDiagnosa: data.topDiagnosa?.length ?? 0,
          diagnosaHarian: data.diagnosaHarian?.length ?? 0
        }
      });
    } catch (insertError) {
      await db.ingestionLog.update({
        where: { id: ingestionLog.id },
        data: {
          status: 'failed',
          errorMsg:
            insertError instanceof Error
              ? insertError.message
              : 'Unknown error',
          processedAt: new Date()
        }
      });
      throw insertError;
    }
  } catch (error) {
    const statusCode =
      typeof error === 'object' && error && 'statusCode' in error
        ? Number((error as any).statusCode)
        : 500;

    if (statusCode === 401) {
      return NextResponse.json(
        { error: (error as Error).message ?? 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Klaster4 POST error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
