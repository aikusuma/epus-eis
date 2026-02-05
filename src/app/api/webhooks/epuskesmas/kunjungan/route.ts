import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { insertClickHouse } from '@/lib/clickhouse';
import { Prisma } from '@prisma/client';
import {
  chunk,
  readRawBody,
  verifyEpusSignatureOrThrow
} from '@/lib/webhooks/epus';

export const runtime = 'nodejs';
export const maxDuration = 60;

const kunjunganWebhookSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    records: z
      .array(
        z.object({
          kunjunganId: z.string().min(1),
          pasienId: z.string().min(1),
          gender: z.enum(['L', 'P']),
          ageGroup: z.enum([
            '0-4',
            '5-9',
            '10-14',
            '15-19',
            '20-24',
            '25-29',
            '30-34',
            '35-39',
            '40-44',
            '45-49',
            '50-54',
            '55-59',
            '60-64',
            '65-69',
            '70+'
          ]),
          layananType: z.enum([
            'umum',
            'gigi',
            'KIA',
            'lansia',
            'imunisasi',
            'KB',
            'jiwa',
            'lab',
            'gizi'
          ]),
          unitType: z.enum([
            'rawat_jalan',
            'rawat_inap',
            'IGD',
            'pustu',
            'pusling',
            'posyandu'
          ]),
          icd10Codes: z.array(z.string().min(1)).min(1).max(10),
          diagnosisType: z.enum(['primer', 'sekunder']).default('primer')
        })
      )
      .min(1)
  })
  .refine((v) => !!v.puskesmasId || !!v.puskesmasKode, {
    message: 'puskesmasId atau puskesmasKode wajib diisi',
    path: ['puskesmasId']
  });

type KunjunganWebhookInput = z.infer<typeof kunjunganWebhookSchema>;

export async function POST(req: NextRequest) {
  let rawBody: Buffer;

  try {
    rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const body = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = kunjunganWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: KunjunganWebhookInput = parsed.data;

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

    // Best-effort idempotency by batchId (no unique constraint, but prevents common retries)
    const existing = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`\n        SELECT id\n        FROM ingestion_logs\n        WHERE event_type = 'kunjungan'\n          AND puskesmas_id = ${puskesmas.id}\n          AND payload->>'batchId' = ${data.batchId}\n        LIMIT 1\n      `
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        ingestionId: existing[0].id
      });
    }

    const allIcd10Codes = Array.from(
      new Set(data.records.flatMap((r) => r.icd10Codes))
    );

    const validIcd10: Array<{ code: string }> = [];
    for (const codes of chunk(allIcd10Codes, 1000)) {
      const rows = await db.icd10.findMany({
        where: { code: { in: codes } },
        select: { code: true }
      });
      validIcd10.push(...rows);
    }

    const validSet = new Set(validIcd10.map((i) => i.code));
    const invalidCodes = allIcd10Codes.filter((c) => !validSet.has(c));

    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { error: 'Kode ICD-10 tidak valid', invalidCodes },
        { status: 400 }
      );
    }

    const ingestionLog = await db.ingestionLog.create({
      data: {
        eventType: 'kunjungan',
        puskesmasId: puskesmas.id,
        payload: {
          ...data,
          puskesmasId: puskesmas.id,
          puskesmasKode: puskesmas.kodePuskesmas
        } as unknown as object,
        status: 'processing'
      }
    });

    // Aggregate rows for ClickHouse
    const kunjunganAgg = new Map<string, number>();
    const diagnosisAgg = new Map<string, number>();

    for (const record of data.records) {
      const kKey = `${record.layananType}|${record.unitType}|${record.gender}|${record.ageGroup}`;
      kunjunganAgg.set(kKey, (kunjunganAgg.get(kKey) ?? 0) + 1);

      for (const icd10Code of record.icd10Codes) {
        const dKey = `${icd10Code}|${record.gender}|${record.ageGroup}|${record.diagnosisType}`;
        diagnosisAgg.set(dKey, (diagnosisAgg.get(dKey) ?? 0) + 1);
      }
    }

    const factKunjunganRows = Array.from(kunjunganAgg.entries()).map(
      ([key, count]) => {
        const [layananType, unitType, gender, ageGroup] = key.split('|');
        return {
          puskesmas_id: puskesmas.id,
          date: data.date,
          layanan_type: layananType,
          unit_type: unitType,
          gender,
          age_group: ageGroup,
          total_visits: count,
          unique_patients: count
        };
      }
    );

    const factDiagnosisRows = Array.from(diagnosisAgg.entries()).map(
      ([key, count]) => {
        const [icd10Code, gender, ageGroup, diagnosisType] = key.split('|');
        return {
          puskesmas_id: puskesmas.id,
          icd10_code: icd10Code,
          date: data.date,
          gender,
          age_group: ageGroup,
          diagnosis_type: diagnosisType,
          visit_count: count
        };
      }
    );

    // Insert in chunks to support large batches
    for (const rows of chunk(factKunjunganRows, 10000)) {
      await insertClickHouse('fact_kunjungan', rows);
    }

    for (const rows of chunk(factDiagnosisRows, 10000)) {
      await insertClickHouse('fact_diagnosis', rows);
    }

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
        date: data.date,
        recordsReceived: data.records.length,
        kunjunganRowsInserted: factKunjunganRows.length,
        diagnosisRowsInserted: factDiagnosisRows.length
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

    console.error('Webhook kunjungan error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
