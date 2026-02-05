import { NextRequest, NextResponse } from 'next/server';
import {
  getAntenatalCare,
  getAntenatalCareTrend,
  getImunisasi
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

export const runtime = 'nodejs';
export const maxDuration = 60;

const klaster2IngestSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    bulan: z.number().int().min(1).max(12),
    tahun: z.number().int().min(2000).max(2100),
    antenatalCare: z
      .object({
        k1: z.number().int().min(0),
        k4: z.number().int().min(0),
        target: z.number().int().min(0)
      })
      .optional(),
    imunisasi: z
      .array(
        z.object({
          jenisImunisasi: z.string().min(1),
          kategori: z.string().min(1),
          sasaran: z.number().int().min(0),
          capaian: z.number().int().min(0)
        })
      )
      .optional()
  })
  .refine((v) => !!v.puskesmasId || !!v.puskesmasKode, {
    message: 'puskesmasId atau puskesmasKode wajib diisi',
    path: ['puskesmasId']
  })
  .refine((v) => !!v.antenatalCare || !!v.imunisasi?.length, {
    message:
      'Minimal salah satu data harus dikirim: antenatalCare atau imunisasi',
    path: ['antenatalCare']
  });

type Klaster2IngestInput = z.infer<typeof klaster2IngestSchema>;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = klaster2IngestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Klaster2IngestInput = parsed.data;

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
      Prisma.sql`\n        SELECT id\n        FROM ingestion_logs\n        WHERE event_type = 'klaster2'\n          AND puskesmas_id = ${puskesmas.id}\n          AND payload->>'batchId' = ${data.batchId}\n        LIMIT 1\n      `
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
        eventType: 'klaster2',
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
      if (data.antenatalCare) {
        await db.antenatalCare.upsert({
          where: {
            puskesmasId_bulan_tahun: {
              puskesmasId: puskesmas.id,
              bulan: data.bulan,
              tahun: data.tahun
            }
          },
          create: {
            puskesmasId: puskesmas.id,
            k1: data.antenatalCare.k1,
            k4: data.antenatalCare.k4,
            target: data.antenatalCare.target,
            bulan: data.bulan,
            tahun: data.tahun
          },
          update: {
            k1: data.antenatalCare.k1,
            k4: data.antenatalCare.k4,
            target: data.antenatalCare.target
          }
        });
      }

      if (data.imunisasi?.length) {
        for (const items of chunk(data.imunisasi, 200)) {
          await db.$transaction(
            items.map((item) =>
              db.imunisasi.upsert({
                where: {
                  puskesmasId_jenisImunisasi_bulan_tahun: {
                    puskesmasId: puskesmas.id,
                    jenisImunisasi: item.jenisImunisasi,
                    bulan: data.bulan,
                    tahun: data.tahun
                  }
                },
                create: {
                  puskesmasId: puskesmas.id,
                  jenisImunisasi: item.jenisImunisasi,
                  kategori: item.kategori,
                  sasaran: item.sasaran,
                  capaian: item.capaian,
                  bulan: data.bulan,
                  tahun: data.tahun
                },
                update: {
                  kategori: item.kategori,
                  sasaran: item.sasaran,
                  capaian: item.capaian
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

      revalidateTag('klaster2');

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
          imunisasi: data.imunisasi?.length ?? 0,
          antenatalCare: data.antenatalCare ? 1 : 0
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

    console.error('Klaster2 POST error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
