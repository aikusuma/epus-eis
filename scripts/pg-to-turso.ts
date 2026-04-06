/**
 * Full data migration: PostgreSQL → Turso (libSQL)
 * Reads all rows from local Postgres, inserts into Turso in batches.
 */

import { createClient } from '@libsql/client';
import pg from 'pg';

const PG_URL = 'postgresql://ilhamnurfachri@localhost:5432/epus_eis';
const TURSO_URL = process.env.DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const BATCH = 100; // rows per db.batch() call

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const pool = new pg.Pool({ connectionString: PG_URL });

// Serialize a value for libSQL: dates→ISO, JSON→string, bool→0/1, null→null
function serialize(
  v: unknown
): string | number | null | bigint | ArrayBuffer | Uint8Array {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v); // JSON fields
  return v as string | number;
}

async function clearTable(name: string) {
  await turso.execute(`DELETE FROM "${name}"`);
}

async function copyTable(tableName: string) {
  const { rows } = await pool.query(
    `SELECT * FROM ${tableName} ORDER BY created_at ASC NULLS LAST`
  );
  if (rows.length === 0) {
    console.log(`  ${tableName}: 0 rows, skipped`);
    return;
  }

  const cols = Object.keys(rows[0]);
  const quotedCols = cols.map((c) => `"${c}"`).join(', ');
  const placeholders = cols.map((_, i) => `?${i + 1}`).join(', ');
  const sql = `INSERT OR REPLACE INTO "${tableName}" (${quotedCols}) VALUES (${placeholders})`;

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const stmts = chunk.map((row) => ({
      sql,
      args: cols.map((c) => serialize(row[c]))
    }));
    await turso.batch(stmts, 'write');
    inserted += chunk.length;
    process.stdout.write(`\r  ${tableName}: ${inserted}/${rows.length}   `);
  }
  console.log(`\r  ${tableName}: ${rows.length} rows ✓              `);
}

// Tables in FK-safe insertion order
const TABLES = [
  'roles',
  'permissions',
  'wilayah',
  'puskesmas',
  'users',
  'role_permissions',
  'sessions',
  'system_configs',
  'icd10',
  'diagnosis_dummy',
  'ingestion_logs',
  'audit_logs',
  'tenaga_kesehatan',
  'stok_obat',
  'keuangan',
  'antenatal_care',
  'imunisasi',
  'deteksi_dini',
  'faktor_risiko',
  'pemeriksaan_gigi',
  'diagnosa_harian',
  'gawat_darurat',
  'farmasi',
  'laboratorium',
  'rawat_inap',
  'kunjungan',
  'top_diagnosa',
  'top_keluhan',
  'top_obat',
  'siklus_hidup_pasien',
  'overview_summary'
];

async function main() {
  console.log('🚀 Migrating PostgreSQL → Turso...\n');

  // Step 1: Clear Turso tables in reverse order
  console.log('🧹 Clearing Turso tables...');
  for (const t of [...TABLES].reverse()) {
    await clearTable(t);
  }
  console.log('   Done.\n');

  // Step 2: Copy each table
  console.log('📦 Copying tables:');
  for (const t of TABLES) {
    await copyTable(t);
  }

  // Step 3: Final count verification
  console.log('\n📊 Verification:');
  const checks = [
    'roles',
    'puskesmas',
    'users',
    'icd10',
    'kunjungan',
    'diagnosa_harian'
  ];
  for (const t of checks) {
    const r = await turso.execute(`SELECT COUNT(*) as n FROM "${t}"`);
    const pg_r = await pool.query(`SELECT COUNT(*) as n FROM ${t}`);
    const turso_count = Number(r.rows[0].n);
    const pg_count = Number(pg_r.rows[0].n);
    const ok = turso_count === pg_count ? '✅' : '❌';
    console.log(`  ${ok} ${t}: pg=${pg_count}, turso=${turso_count}`);
  }

  turso.close();
  await pool.end();
  console.log('\n✅ Migration complete!');
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
