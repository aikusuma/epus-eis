import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { revalidateTag } from 'next/cache';

import { db } from '@/lib/db';
import { insertClickHouse } from '@/lib/clickhouse';
import {
  chunk,
  readRawBody,
  verifyEpusSignatureOrThrow
} from '@/lib/webhooks/epus';

export const runtime = 'nodejs';
export const maxDuration = 60;

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const kunjunganRecordSchema = z.object({
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
});

const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('kunjungan'),
    date: dateOnly,
    records: z.array(kunjunganRecordSchema).min(1)
  }),
  z
    .object({
      type: z.literal('klaster1'),
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
    .refine(
      (v) =>
        !!v.tenagaKesehatan?.length ||
        !!v.stokObat?.length ||
        !!v.keuangan?.length,
      {
        message:
          'Minimal salah satu data harus dikirim: tenagaKesehatan, stokObat, atau keuangan'
      }
    ),
  z
    .object({
      type: z.literal('klaster2'),
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
    .refine((v) => !!v.antenatalCare || !!v.imunisasi?.length, {
      message:
        'Minimal salah satu data harus dikirim: antenatalCare atau imunisasi'
    }),
  z
    .object({
      type: z.literal('klaster3'),
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
    .refine(
      (v) =>
        !!v.deteksiDini?.length ||
        !!v.faktorRisiko?.length ||
        !!v.pemeriksaanGigi?.length,
      {
        message:
          'Minimal salah satu data harus dikirim: deteksiDini, faktorRisiko, atau pemeriksaanGigi'
      }
    ),
  z
    .object({
      type: z.literal('lintas-klaster'),
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
    .refine(
      (v) =>
        !!v.gawatDarurat?.length ||
        !!v.farmasi?.length ||
        !!v.laboratorium?.length ||
        !!v.rawatInap?.length,
      {
        message:
          'Minimal salah satu data harus dikirim: gawatDarurat, farmasi, laboratorium, atau rawatInap'
      }
    )
]);

type IngestEvent = z.infer<typeof eventSchema>;

const ingestSchema = z
  .object({
    batchId: z.string().min(1),
    puskesmasId: z.string().min(1).optional(),
    puskesmasKode: z.string().min(1).optional(),
    events: z.array(eventSchema).min(1)
  })
  .refine((v) => !!v.puskesmasId || !!v.puskesmasKode, {
    message: 'puskesmasId atau puskesmasKode wajib diisi',
    path: ['puskesmasId']
  });

type IngestInput = z.infer<typeof ingestSchema>;

type EventResult = {
  type: IngestEvent['type'];
  ok: boolean;
  summary?: Record<string, unknown>;
  error?: string;
};

function parseDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

async function validateIcd10Codes(
  records: Array<z.infer<typeof kunjunganRecordSchema>>
) {
  const allIcd10Codes = Array.from(
    new Set(records.flatMap((r) => r.icd10Codes))
  );
  const valid: Array<{ code: string }> = [];
  for (const codes of chunk(allIcd10Codes, 1000)) {
    const rows = await db.icd10.findMany({
      where: { code: { in: codes } },
      select: { code: true }
    });
    valid.push(...rows);
  }
  const validSet = new Set(valid.map((i) => i.code));
  const invalidCodes = allIcd10Codes.filter((c) => !validSet.has(c));
  return { invalidCodes };
}

async function ingestKunjungan(
  puskesmasId: string,
  event: Extract<IngestEvent, { type: 'kunjungan' }>
) {
  const { invalidCodes } = await validateIcd10Codes(event.records);
  if (invalidCodes.length > 0) {
    return {
      ok: false,
      error: `Kode ICD-10 tidak valid (${invalidCodes.slice(0, 10).join(', ')})`
    } as const;
  }

  const kunjunganAgg = new Map<string, number>();
  const diagnosisAgg = new Map<string, number>();

  for (const record of event.records) {
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
        puskesmas_id: puskesmasId,
        date: event.date,
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
        puskesmas_id: puskesmasId,
        icd10_code: icd10Code,
        date: event.date,
        gender,
        age_group: ageGroup,
        diagnosis_type: diagnosisType,
        visit_count: count
      };
    }
  );

  for (const rows of chunk(factKunjunganRows, 10000)) {
    await insertClickHouse('fact_kunjungan', rows);
  }

  for (const rows of chunk(factDiagnosisRows, 10000)) {
    await insertClickHouse('fact_diagnosis', rows);
  }

  return {
    ok: true,
    summary: {
      date: event.date,
      recordsReceived: event.records.length,
      kunjunganRowsInserted: factKunjunganRows.length,
      diagnosisRowsInserted: factDiagnosisRows.length
    }
  } as const;
}

async function ingestKlaster1(
  puskesmasId: string,
  event: Extract<IngestEvent, { type: 'klaster1' }>
) {
  if (event.tenagaKesehatan?.length) {
    for (const items of chunk(event.tenagaKesehatan, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.tenagaKesehatan.upsert({
            where: {
              puskesmasId_kategori_bulan_tahun: {
                puskesmasId,
                kategori: item.kategori,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              kategori: item.kategori,
              jumlah: item.jumlah,
              target: item.target,
              bulan: event.bulan,
              tahun: event.tahun
            },
            update: { jumlah: item.jumlah, target: item.target }
          })
        )
      );
    }
  }

  if (event.stokObat?.length) {
    for (const items of chunk(event.stokObat, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.stokObat.upsert({
            where: {
              puskesmasId_namaObat_bulan_tahun: {
                puskesmasId,
                namaObat: item.namaObat,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              namaObat: item.namaObat,
              satuan: item.satuan,
              stok: item.stok,
              pemakaian: item.pemakaian,
              bulan: event.bulan,
              tahun: event.tahun
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

  if (event.keuangan?.length) {
    for (const items of chunk(event.keuangan, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.keuangan.upsert({
            where: {
              puskesmasId_kategori_bulan_tahun: {
                puskesmasId,
                kategori: item.kategori,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              kategori: item.kategori,
              nominal: item.nominal,
              bulan: event.bulan,
              tahun: event.tahun
            },
            update: { nominal: item.nominal }
          })
        )
      );
    }
  }

  revalidateTag('klaster1', '');

  return {
    ok: true,
    summary: {
      bulan: event.bulan,
      tahun: event.tahun,
      tenagaKesehatan: event.tenagaKesehatan?.length ?? 0,
      stokObat: event.stokObat?.length ?? 0,
      keuangan: event.keuangan?.length ?? 0
    }
  } as const;
}

async function ingestKlaster2(
  puskesmasId: string,
  event: Extract<IngestEvent, { type: 'klaster2' }>
) {
  if (event.antenatalCare) {
    await db.antenatalCare.upsert({
      where: {
        puskesmasId_bulan_tahun: {
          puskesmasId,
          bulan: event.bulan,
          tahun: event.tahun
        }
      },
      create: {
        puskesmasId,
        k1: event.antenatalCare.k1,
        k4: event.antenatalCare.k4,
        target: event.antenatalCare.target,
        bulan: event.bulan,
        tahun: event.tahun
      },
      update: {
        k1: event.antenatalCare.k1,
        k4: event.antenatalCare.k4,
        target: event.antenatalCare.target
      }
    });
  }

  if (event.imunisasi?.length) {
    for (const items of chunk(event.imunisasi, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.imunisasi.upsert({
            where: {
              puskesmasId_jenisImunisasi_bulan_tahun: {
                puskesmasId,
                jenisImunisasi: item.jenisImunisasi,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              jenisImunisasi: item.jenisImunisasi,
              kategori: item.kategori,
              sasaran: item.sasaran,
              capaian: item.capaian,
              bulan: event.bulan,
              tahun: event.tahun
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

  revalidateTag('klaster2', '');

  return {
    ok: true,
    summary: {
      bulan: event.bulan,
      tahun: event.tahun,
      antenatalCare: event.antenatalCare ? 1 : 0,
      imunisasi: event.imunisasi?.length ?? 0
    }
  } as const;
}

async function ingestKlaster3(
  puskesmasId: string,
  event: Extract<IngestEvent, { type: 'klaster3' }>
) {
  if (event.deteksiDini?.length) {
    for (const items of chunk(event.deteksiDini, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.deteksiDini.upsert({
            where: {
              puskesmasId_jenis_bulan_tahun: {
                puskesmasId,
                jenis: item.jenis,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              jenis: item.jenis,
              sasaran: item.sasaran,
              capaian: item.capaian,
              bulan: event.bulan,
              tahun: event.tahun
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

  if (event.faktorRisiko?.length) {
    for (const items of chunk(event.faktorRisiko, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.faktorRisiko.upsert({
            where: {
              puskesmasId_faktor_kelompokUmur_bulan_tahun: {
                puskesmasId,
                faktor: item.faktor,
                kelompokUmur: item.kelompokUmur,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              faktor: item.faktor,
              kelompokUmur: item.kelompokUmur,
              jumlahKasus: item.jumlahKasus,
              bulan: event.bulan,
              tahun: event.tahun
            },
            update: {
              jumlahKasus: item.jumlahKasus
            }
          })
        )
      );
    }
  }

  if (event.pemeriksaanGigi?.length) {
    for (const items of chunk(event.pemeriksaanGigi, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.pemeriksaanGigi.upsert({
            where: {
              puskesmasId_kategori_bulan_tahun: {
                puskesmasId,
                kategori: item.kategori,
                bulan: event.bulan,
                tahun: event.tahun
              }
            },
            create: {
              puskesmasId,
              kategori: item.kategori,
              sasaran: item.sasaran,
              diperiksa: item.diperiksa,
              perluPerawatan: item.perluPerawatan,
              bulan: event.bulan,
              tahun: event.tahun
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

  revalidateTag('klaster3', '');

  return {
    ok: true,
    summary: {
      bulan: event.bulan,
      tahun: event.tahun,
      deteksiDini: event.deteksiDini?.length ?? 0,
      faktorRisiko: event.faktorRisiko?.length ?? 0,
      pemeriksaanGigi: event.pemeriksaanGigi?.length ?? 0
    }
  } as const;
}

async function ingestLintasKlaster(
  puskesmasId: string,
  event: Extract<IngestEvent, { type: 'lintas-klaster' }>
) {
  if (event.gawatDarurat?.length) {
    for (const items of chunk(event.gawatDarurat, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.gawatDarurat.upsert({
            where: {
              puskesmasId_tanggal: {
                puskesmasId,
                tanggal: parseDateOnly(item.tanggal)
              }
            },
            create: {
              puskesmasId,
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

  if (event.farmasi?.length) {
    for (const items of chunk(event.farmasi, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.farmasi.upsert({
            where: {
              puskesmasId_tanggal: {
                puskesmasId,
                tanggal: parseDateOnly(item.tanggal)
              }
            },
            create: {
              puskesmasId,
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

  if (event.laboratorium?.length) {
    for (const items of chunk(event.laboratorium, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.laboratorium.upsert({
            where: {
              puskesmasId_tanggal: {
                puskesmasId,
                tanggal: parseDateOnly(item.tanggal)
              }
            },
            create: {
              puskesmasId,
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

  if (event.rawatInap?.length) {
    for (const items of chunk(event.rawatInap, 200)) {
      await db.$transaction(
        items.map((item) =>
          db.rawatInap.upsert({
            where: {
              puskesmasId_tanggal: {
                puskesmasId,
                tanggal: parseDateOnly(item.tanggal)
              }
            },
            create: {
              puskesmasId,
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

  revalidateTag('lintas-klaster', '');

  return {
    ok: true,
    summary: {
      gawatDarurat: event.gawatDarurat?.length ?? 0,
      farmasi: event.farmasi?.length ?? 0,
      laboratorium: event.laboratorium?.length ?? 0,
      rawatInap: event.rawatInap?.length ?? 0
    }
  } as const;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readRawBody(req);
    verifyEpusSignatureOrThrow(req, rawBody);

    const json = JSON.parse(rawBody.toString('utf8')) as unknown;
    const parsed = ingestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: IngestInput = parsed.data;

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
      Prisma.sql`
        SELECT id
        FROM ingestion_logs
        WHERE event_type = 'epus_batch'
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
        eventType: 'epus_batch',
        puskesmasId: puskesmas.id,
        payload: {
          batchId: data.batchId,
          puskesmasId: puskesmas.id,
          puskesmasKode: puskesmas.kodePuskesmas,
          events: data.events.map((e) => ({
            type: e.type,
            // Keep payload small: just counts
            count:
              e.type === 'kunjungan'
                ? e.records.length
                : e.type === 'lintas-klaster'
                  ? (e.gawatDarurat?.length ?? 0) +
                    (e.farmasi?.length ?? 0) +
                    (e.laboratorium?.length ?? 0) +
                    (e.rawatInap?.length ?? 0)
                  : 1
          }))
        } as unknown as object,
        status: 'processing'
      }
    });

    const results: EventResult[] = [];

    try {
      for (const event of data.events) {
        try {
          if (event.type === 'kunjungan') {
            const res = await ingestKunjungan(puskesmas.id, event);
            results.push({
              type: event.type,
              ok: res.ok,
              summary: res.ok ? res.summary : undefined,
              error: res.ok ? undefined : res.error
            });
            continue;
          }

          if (event.type === 'klaster1') {
            const res = await ingestKlaster1(puskesmas.id, event);
            results.push({ type: event.type, ok: true, summary: res.summary });
            continue;
          }

          if (event.type === 'klaster2') {
            const res = await ingestKlaster2(puskesmas.id, event);
            results.push({ type: event.type, ok: true, summary: res.summary });
            continue;
          }

          if (event.type === 'klaster3') {
            const res = await ingestKlaster3(puskesmas.id, event);
            results.push({ type: event.type, ok: true, summary: res.summary });
            continue;
          }

          if (event.type === 'lintas-klaster') {
            const res = await ingestLintasKlaster(puskesmas.id, event);
            results.push({ type: event.type, ok: true, summary: res.summary });
            continue;
          }

          results.push({
            type: (event as any).type,
            ok: false,
            error: 'Unsupported event type'
          });
        } catch (e) {
          results.push({
            type: (event as any).type,
            ok: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          });
        }
      }

      const anyFailed = results.some((r) => !r.ok);

      await db.ingestionLog.update({
        where: { id: ingestionLog.id },
        data: {
          status: anyFailed ? 'failed' : 'processed',
          processedAt: new Date(),
          errorMsg: anyFailed
            ? results
                .filter((r) => !r.ok)
                .map((r) => `${r.type}: ${r.error}`)
                .slice(0, 5)
                .join(' | ')
            : null
        }
      });

      return NextResponse.json({
        success: !anyFailed,
        duplicate: false,
        ingestionId: ingestionLog.id,
        puskesmas: {
          id: puskesmas.id,
          kode: puskesmas.kodePuskesmas,
          nama: puskesmas.namaPuskesmas
        },
        batchId: data.batchId,
        results
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

    console.error('Ingest batch error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
