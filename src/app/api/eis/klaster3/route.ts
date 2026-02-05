import { NextRequest, NextResponse } from 'next/server';
import {
  getDeteksiDini,
  getFaktorRisiko,
  getPemeriksaanGigi
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

export const runtime = 'nodejs';
export const maxDuration = 60;

const klaster3IngestSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    bulan: z.number().int().min(1).max(12),
    tahun: z.number().int().min(2000).max(2100),
    deteksiDini: z
      .array(
        z.object({
          jenis: z.string().min(1),
          sasaran: z.number().int().min(0),
          capaian: z.number().int().min(0)
        })
      )
      .optional(),
    faktorRisiko: z
      .array(
        z.object({
          faktor: z.string().min(1),
          kelompokUmur: z.string().min(1),
          jumlahKasus: z.number().int().min(0)
        })
      )
      .optional(),
    pemeriksaanGigi: z
      .array(
        z.object({
          kategori: z.string().min(1),
          sasaran: z.number().int().min(0),
          diperiksa: z.number().int().min(0),
          perluPerawatan: z.number().int().min(0)
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
      !!v.deteksiDini?.length ||
      !!v.faktorRisiko?.length ||
      !!v.pemeriksaanGigi?.length,
    {
      message:
        'Minimal salah satu data harus dikirim: deteksiDini, faktorRisiko, atau pemeriksaanGigi',
      path: ['deteksiDini']
    }
  );

type Klaster3IngestInput = z.infer<typeof klaster3IngestSchema>;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = klaster3IngestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Klaster3IngestInput = parsed.data;

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

    // Idempotency by batchId (per puskesmas)
    const existing = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`\n        SELECT id\n        FROM ingestion_logs\n        WHERE event_type = 'klaster3'\n          AND puskesmas_id = ${puskesmas.id}\n          AND payload->>'batchId' = ${data.batchId}\n        LIMIT 1\n      `
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
        eventType: 'klaster3',
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
      if (data.deteksiDini?.length) {
        for (const items of chunk(data.deteksiDini, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.deteksiDini.upsert({
                where: {
                  puskesmasId_jenis_bulan_tahun: {
                    puskesmasId: puskesmas.id,
                    jenis: item.jenis,
                    bulan: data.bulan,
                    tahun: data.tahun
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  jenis: item.jenis,
                  sasaran: item.sasaran,
                  capaian: item.capaian,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: {
                  sasaran: item.sasaran,
                  capaian: item.capaian
                }
              })
            )
          );
        }
      }

      if (data.faktorRisiko?.length) {
        for (const items of chunk(data.faktorRisiko, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.faktorRisiko.upsert({
                where: {
                  puskesmasId_faktor_kelompokUmur_bulan_tahun: {
                    puskesmasId: puskesmas.id,
                    faktor: item.faktor,
                    kelompokUmur: item.kelompokUmur,
                    bulan: data.bulan,
                    tahun: data.tahun
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  faktor: item.faktor,
                  kelompokUmur: item.kelompokUmur,
                  jumlahKasus: item.jumlahKasus,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: {
                  jumlahKasus: item.jumlahKasus
                }
              })
            )
          );
        }
      }

      if (data.pemeriksaanGigi?.length) {
        for (const items of chunk(data.pemeriksaanGigi, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.pemeriksaanGigi.upsert({
                where: {
                  puskesmasId_kategori_bulan_tahun: {
                    puskesmasId: puskesmas.id,
                    kategori: item.kategori,
                    bulan: data.bulan,
                    tahun: data.tahun
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  kategori: item.kategori,
                  sasaran: item.sasaran,
                  diperiksa: item.diperiksa,
                  perluPerawatan: item.perluPerawatan,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: {
                  sasaran: item.sasaran,
                  diperiksa: item.diperiksa,
                  perluPerawatan: item.perluPerawatan
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

      revalidateTag('klaster3');

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
          deteksiDini: data.deteksiDini?.length ?? 0,
          faktorRisiko: data.faktorRisiko?.length ?? 0,
          pemeriksaanGigi: data.pemeriksaanGigi?.length ?? 0
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

    console.error('Klaster3 POST error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
