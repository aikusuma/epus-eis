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

export const runtime = 'nodejs';
export const maxDuration = 60;

const dateOnly = z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/);

const lintasKlasterIngestSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    gawatDarurat: z
      .array(
        z.object({
          tanggal: dateOnly,
          triaseMerah: z.number().int().min(0),
          triaseKuning: z.number().int().min(0),
          triaseHijau: z.number().int().min(0)
        })
      )
      .optional(),
    farmasi: z
      .array(
        z.object({
          tanggal: dateOnly,
          jumlahResep: z.number().int().min(0),
          obatKeluar: z.number().int().min(0),
          racikan: z.number().int().min(0)
        })
      )
      .optional(),
    laboratorium: z
      .array(
        z.object({
          tanggal: dateOnly,
          jumlahPemeriksaan: z.number().int().min(0),
          hematologi: z.number().int().min(0),
          kimiaKlinik: z.number().int().min(0),
          urinalisis: z.number().int().min(0)
        })
      )
      .optional(),
    rawatInap: z
      .array(
        z.object({
          tanggal: dateOnly,
          pasienMasuk: z.number().int().min(0),
          pasienKeluar: z.number().int().min(0),
          bedTerisi: z.number().int().min(0),
          bedTotal: z.number().int().min(0)
        })
      )
      .optional()
  })
  .refine((v) => !!v.puskesmasId || !!v.puskesmasKode, {
    message: 'puskesmasId atau puskesmasKode wajib diisi',
    path: ['puskesmasId']
  })
  .refine(
    (v) =>
      !!v.gawatDarurat?.length ||
      !!v.farmasi?.length ||
      !!v.laboratorium?.length ||
      !!v.rawatInap?.length,
    {
      message:
        'Minimal salah satu data harus dikirim: gawatDarurat, farmasi, laboratorium, atau rawatInap',
      path: ['gawatDarurat']
    }
  );

type LintasKlasterIngestInput = z.infer<typeof lintasKlasterIngestSchema>;

function parseDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = lintasKlasterIngestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: LintasKlasterIngestInput = parsed.data;

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
      Prisma.sql`\n        SELECT id\n        FROM ingestion_logs\n        WHERE event_type = 'lintas-klaster'\n          AND puskesmas_id = ${puskesmas.id}\n          AND payload->>'batchId' = ${data.batchId}\n        LIMIT 1\n      `
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
        eventType: 'lintas-klaster',
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
      if (data.gawatDarurat?.length) {
        for (const items of chunk(data.gawatDarurat, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.gawatDarurat.upsert({
                where: {
                  puskesmasId_tanggal: {
                    puskesmasId: puskesmas.id,
                    tanggal: parseDateOnly(item.tanggal)
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  triaseMerah: item.triaseMerah,
                  triaseKuning: item.triaseKuning,
                  triaseHijau: item.triaseHijau,
                  tanggal: parseDateOnly(item.tanggal)
                },
                update: {
                  triaseMerah: item.triaseMerah,
                  triaseKuning: item.triaseKuning,
                  triaseHijau: item.triaseHijau
                }
              })
            )
          );
        }
      }

      if (data.farmasi?.length) {
        for (const items of chunk(data.farmasi, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.farmasi.upsert({
                where: {
                  puskesmasId_tanggal: {
                    puskesmasId: puskesmas.id,
                    tanggal: parseDateOnly(item.tanggal)
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  jumlahResep: item.jumlahResep,
                  obatKeluar: item.obatKeluar,
                  racikan: item.racikan,
                  tanggal: parseDateOnly(item.tanggal)
                },
                update: {
                  jumlahResep: item.jumlahResep,
                  obatKeluar: item.obatKeluar,
                  racikan: item.racikan
                }
              })
            )
          );
        }
      }

      if (data.laboratorium?.length) {
        for (const items of chunk(data.laboratorium, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.laboratorium.upsert({
                where: {
                  puskesmasId_tanggal: {
                    puskesmasId: puskesmas.id,
                    tanggal: parseDateOnly(item.tanggal)
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  jumlahPemeriksaan: item.jumlahPemeriksaan,
                  hematologi: item.hematologi,
                  kimiaKlinik: item.kimiaKlinik,
                  urinalisis: item.urinalisis,
                  tanggal: parseDateOnly(item.tanggal)
                },
                update: {
                  jumlahPemeriksaan: item.jumlahPemeriksaan,
                  hematologi: item.hematologi,
                  kimiaKlinik: item.kimiaKlinik,
                  urinalisis: item.urinalisis
                }
              })
            )
          );
        }
      }

      if (data.rawatInap?.length) {
        for (const items of chunk(data.rawatInap, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.rawatInap.upsert({
                where: {
                  puskesmasId_tanggal: {
                    puskesmasId: puskesmas.id,
                    tanggal: parseDateOnly(item.tanggal)
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  pasienMasuk: item.pasienMasuk,
                  pasienKeluar: item.pasienKeluar,
                  bedTerisi: item.bedTerisi,
                  bedTotal: item.bedTotal,
                  tanggal: parseDateOnly(item.tanggal)
                },
                update: {
                  pasienMasuk: item.pasienMasuk,
                  pasienKeluar: item.pasienKeluar,
                  bedTerisi: item.bedTerisi,
                  bedTotal: item.bedTotal
                }
              })
            )
          );
        }
      }

      await db.ingestionLog.update({
        where: { id: ingestionLog.id },
        data: { status: 'processed', processedAt: new Date() }
      });

      revalidateTag('lintas-klaster', '');

      return NextResponse.json({
        success: true,
        duplicate: false,
        ingestionId: ingestionLog.id,
        summary: {
          batchId: data.batchId,
          puskesmasId: puskesmas.id,
          puskesmasKode: puskesmas.kodePuskesmas,
          puskesmasName: puskesmas.namaPuskesmas,
          gawatDarurat: data.gawatDarurat?.length ?? 0,
          farmasi: data.farmasi?.length ?? 0,
          laboratorium: data.laboratorium?.length ?? 0,
          rawatInap: data.rawatInap?.length ?? 0
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

    console.error('Lintas-klaster POST error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
