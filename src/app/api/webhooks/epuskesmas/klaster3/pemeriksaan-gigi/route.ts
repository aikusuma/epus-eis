import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { readRawBody, verifyEpusSignatureOrThrow } from '@/lib/webhooks/epus';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    bulan: z.number().int().min(1).max(12),
    tahun: z.number().int().min(2000).max(2100),
    items: z
      .array(
        z.object({
          kategori: z.string().min(1),
          sasaran: z.number().int().min(0),
          diperiksa: z.number().int().min(0),
          perluPerawatan: z.number().int().min(0)
        })
      )
      .min(1)
  })
  .refine((v) => !!v.puskesmasId || !!v.puskesmasKode, {
    message: 'puskesmasId atau puskesmasKode wajib diisi',
    path: ['puskesmasId']
  });

type Input = z.infer<typeof bodySchema>;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Input = parsed.data;

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

    // Idempotency by batchId
    const existing = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM ingestion_logs
        WHERE event_type = 'pemeriksaan_gigi'
          AND puskesmas_id = ${puskesmas.id}
          AND payload->>'batchId' = ${data.batchId}
        LIMIT 1
      `
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
        eventType: 'pemeriksaan_gigi',
        puskesmasId: puskesmas.id,
        payload: {
          ...data,
          puskesmasId: puskesmas.id,
          puskesmasKode: puskesmas.kodePuskesmas
        } as unknown as object,
        status: 'processing'
      }
    });

    // Upsert each kategori for bulan/tahun
    await db.$transaction(
      data.items.map((item) =>
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

    await db.ingestionLog.update({
      where: { id: ingestionLog.id },
      data: { status: 'processed', processedAt: new Date() }
    });

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
        itemsUpserted: data.items.length
      }
    });
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

    console.error('Webhook pemeriksaan gigi error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
