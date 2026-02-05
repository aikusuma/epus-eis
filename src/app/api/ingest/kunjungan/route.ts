// Ingestion API - Kunjungan data from e-Puskesmas
// Receives batch data and inserts into ClickHouse

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  createUserContext,
  UNAUTHORIZED,
  logAudit
} from '@/lib/acl';
import { insertClickHouse, queryClickHouse } from '@/lib/clickhouse';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/types/acl';
import { z } from 'zod';

// Validation schema for incoming data
const kunjunganSchema = z.object({
  puskesmasId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      kunjunganId: z.string(),
      pasienId: z.string(),
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
      icd10Codes: z.array(z.string()).min(1).max(10),
      diagnosisType: z.enum(['primer', 'sekunder']).default('primer')
    })
  )
});

type KunjunganInput = z.infer<typeof kunjunganSchema>;

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = createUserContext(payload);

    // Check ingestion permission
    if (!user.permissions.includes(PERMISSIONS.SYNC_DATA)) {
      return NextResponse.json(
        { error: 'Akses ingestion ditolak' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = kunjunganSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const data: KunjunganInput = parseResult.data;

    // Verify puskesmas exists
    const puskesmas = await db.puskesmas.findUnique({
      where: { id: data.puskesmasId },
      select: {
        id: true,
        kodePuskesmas: true,
        namaPuskesmas: true,
        wilayahId: true
      }
    });

    if (!puskesmas) {
      return NextResponse.json(
        { error: 'Puskesmas tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate ICD-10 codes
    const allIcd10Codes = Array.from(
      new Set(data.records.flatMap((r) => r.icd10Codes))
    );
    const validIcd10 = await db.icd10.findMany({
      where: { code: { in: allIcd10Codes } },
      select: { code: true }
    });
    const validIcd10Set = new Set(
      validIcd10.map((i: { code: string }) => i.code)
    );

    const invalidCodes = allIcd10Codes.filter((c) => !validIcd10Set.has(c));
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        {
          error: 'Kode ICD-10 tidak valid',
          invalidCodes
        },
        { status: 400 }
      );
    }

    // Create ingestion log
    const ingestionLog = await db.ingestionLog.create({
      data: {
        eventType: 'kunjungan',
        puskesmasId: data.puskesmasId,
        payload: data as object,
        status: 'processing'
      }
    });

    try {
      // Prepare data for fact_kunjungan (aggregated by layanan type)
      const kunjunganAgg = new Map<string, number>();

      for (const record of data.records) {
        const key = `${record.layananType}|${record.unitType}|${record.gender}|${record.ageGroup}`;
        kunjunganAgg.set(key, (kunjunganAgg.get(key) ?? 0) + 1);
      }

      const factKunjunganRows: Array<{
        puskesmas_id: string;
        date: string;
        layanan_type: string;
        unit_type: string;
        gender: string;
        age_group: string;
        total_visits: number;
        unique_patients: number;
      }> = [];

      Array.from(kunjunganAgg.entries()).forEach(([key, count]) => {
        const [layananType, unitType, gender, ageGroup] = key.split('|');
        factKunjunganRows.push({
          puskesmas_id: data.puskesmasId,
          date: data.date,
          layanan_type: layananType,
          unit_type: unitType,
          gender,
          age_group: ageGroup,
          total_visits: count,
          unique_patients: count // Will be deduplicated by ReplacingMergeTree
        });
      });

      // Prepare data for fact_diagnosis
      const diagnosisAgg = new Map<string, number>();

      for (const record of data.records) {
        for (const icd10Code of record.icd10Codes) {
          const key = `${icd10Code}|${record.gender}|${record.ageGroup}|${record.diagnosisType}`;
          diagnosisAgg.set(key, (diagnosisAgg.get(key) ?? 0) + 1);
        }
      }

      const factDiagnosisRows: Array<{
        puskesmas_id: string;
        icd10_code: string;
        date: string;
        gender: string;
        age_group: string;
        diagnosis_type: string;
        visit_count: number;
      }> = [];

      Array.from(diagnosisAgg.entries()).forEach(([key, count]) => {
        const [icd10Code, gender, ageGroup, diagnosisType] = key.split('|');
        factDiagnosisRows.push({
          puskesmas_id: data.puskesmasId,
          icd10_code: icd10Code,
          date: data.date,
          gender,
          age_group: ageGroup,
          diagnosis_type: diagnosisType,
          visit_count: count
        });
      });

      // Insert into ClickHouse
      if (factKunjunganRows.length > 0) {
        await insertClickHouse('fact_kunjungan', factKunjunganRows);
      }

      if (factDiagnosisRows.length > 0) {
        await insertClickHouse('fact_diagnosis', factDiagnosisRows);
      }

      // Update ingestion log
      await db.ingestionLog.update({
        where: { id: ingestionLog.id },
        data: {
          status: 'processed',
          processedAt: new Date()
        }
      });

      // Log audit
      await logAudit(
        user,
        'ingest_kunjungan',
        'ingestion',
        ingestionLog.id,
        {
          puskesmasId: data.puskesmasId,
          date: data.date,
          recordCount: data.records.length,
          diagnosisCount: factDiagnosisRows.length
        },
        req
      );

      return NextResponse.json({
        success: true,
        ingestionId: ingestionLog.id,
        summary: {
          puskesmasId: data.puskesmasId,
          puskesmasName: puskesmas.namaPuskesmas,
          date: data.date,
          recordsReceived: data.records.length,
          kunjunganRowsInserted: factKunjunganRows.length,
          diagnosisRowsInserted: factDiagnosisRows.length
        }
      });
    } catch (insertError) {
      // Update ingestion log on failure
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
    console.error('Ingestion API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat ingestion data' },
      { status: 500 }
    );
  }
}

// GET - Check ingestion status and history
export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = createUserContext(payload);

    if (!user.permissions.includes(PERMISSIONS.VIEW_DASHBOARD)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const puskesmasId = searchParams.get('puskesmasId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const logs = await db.ingestionLog.findMany({
      where: puskesmasId ? { puskesmasId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      logs: logs.map((log: (typeof logs)[number]) => ({
        id: log.id,
        eventType: log.eventType,
        puskesmasId: log.puskesmasId,
        status: log.status,
        errorMsg: log.errorMsg,
        createdAt: log.createdAt,
        processedAt: log.processedAt
      }))
    });
  } catch (error) {
    console.error('Ingestion status API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
