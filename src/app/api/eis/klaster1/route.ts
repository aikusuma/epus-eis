import { NextRequest, NextResponse } from 'next/server';
import {
  getTenagaKesehatan,
  getTenagaKesehatanTrend,
  getStokObat,
  getKeuangan,
  getKeuanganTrend
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

export const runtime = 'nodejs';
export const maxDuration = 60;

const klaster1IngestSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    bulan: z.number().int().min(1).max(12),
    tahun: z.number().int().min(2000).max(2100),
    tenagaKesehatan: z
      .array(
        z.object({
          kategori: z.string().min(1),
          jumlah: z.number().int().min(0),
          target: z.number().int().min(0)
        })
      )
      .optional(),
    stokObat: z
      .array(
        z.object({
          namaObat: z.string().min(1),
          satuan: z.string().min(1),
          stok: z.number().int().min(0),
          pemakaian: z.number().int().min(0)
        })
      )
      .optional(),
    keuangan: z
      .array(
        z.object({
          kategori: z.string().min(1),
          nominal: z.number().min(0)
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
      !!v.tenagaKesehatan?.length ||
      !!v.stokObat?.length ||
      !!v.keuangan?.length,
    {
      message:
        'Minimal salah satu data harus dikirim: tenagaKesehatan, stokObat, atau keuangan',
      path: ['tenagaKesehatan']
    }
  );

type Klaster1IngestInput = z.infer<typeof klaster1IngestSchema>;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = klaster1IngestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Klaster1IngestInput = parsed.data;

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
      Prisma.sql`\n        SELECT id\n        FROM ingestion_logs\n        WHERE event_type = 'klaster1'\n          AND puskesmas_id = ${puskesmas.id}\n          AND payload->>'batchId' = ${data.batchId}\n        LIMIT 1\n      `
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
        eventType: 'klaster1',
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
      if (data.tenagaKesehatan?.length) {
        for (const items of chunk(data.tenagaKesehatan, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.tenagaKesehatan.upsert({
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
                  jumlah: item.jumlah,
                  target: item.target,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: { jumlah: item.jumlah, target: item.target }
              })
            )
          );
        }
      }

      if (data.stokObat?.length) {
        for (const items of chunk(data.stokObat, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.stokObat.upsert({
                where: {
                  puskesmasId_namaObat_bulan_tahun: {
                    puskesmasId: puskesmas.id,
                    namaObat: item.namaObat,
                    bulan: data.bulan,
                    tahun: data.tahun
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  namaObat: item.namaObat,
                  satuan: item.satuan,
                  stok: item.stok,
                  pemakaian: item.pemakaian,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: {
                  satuan: item.satuan,
                  stok: item.stok,
                  pemakaian: item.pemakaian
                }
              })
            )
          );
        }
      }

      if (data.keuangan?.length) {
        for (const items of chunk(data.keuangan, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.keuangan.upsert({
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
                  nominal: item.nominal,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: { nominal: item.nominal }
              })
            )
          );
        }
      }

      await db.ingestionLog.update({
        where: { id: ingestionLog.id },
        data: { status: 'processed', processedAt: new Date() }
      });

      revalidateTag('klaster1', '');

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
          tenagaKesehatan: data.tenagaKesehatan?.length ?? 0,
          stokObat: data.stokObat?.length ?? 0,
          keuangan: data.keuangan?.length ?? 0
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

    console.error('Klaster1 POST error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
