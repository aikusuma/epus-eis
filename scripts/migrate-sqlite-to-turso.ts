#!/usr/bin/env bun
/**
 * Migrate data from local SQLite to Turso (libSQL)
 *
 * Usage: bun run scripts/migrate-sqlite-to-turso.ts
 *
 * This script:
 * 1. Reads all data from local SQLite (dev.db)
 * 2. Writes to Turso cloud database
 * 3. Verifies the migration
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// Local SQLite connection
const localPrisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db'
});

// Turso connection via adapter
const tursoUrl = process.env.DATABASE_URL!;
const tursoToken = process.env.TURSO_AUTH_TOKEN!;

const tursoAdapter = new PrismaLibSql({
  url: tursoUrl,
  authToken: tursoToken
});

const tursoPrisma = new PrismaClient({
  adapter: tursoAdapter
});

// All models to migrate (in order to respect foreign keys)
const MODELS = [
  'role',
  'permission',
  'rolePermission',
  'wilayah',
  'puskesmas',
  'icd10',
  'user',
  'session',
  'auditLog',
  'systemConfig',
  'ingestionLog',
  'diagnosisDummy',
  'overviewSummary',
  'topDiagnosa',
  'topKeluhan',
  'topObat',
  'tenagaKesehatan',
  'stokObat',
  'keuangan',
  'antenatalCare',
  'imunisasi',
  'deteksiDini',
  'faktorRisiko',
  'pemeriksaanGigi',
  'diagnosaHarian',
  'kunjungan',
  'gawatDarurat',
  'farmasi',
  'laboratorium',
  'rawatInap',
  'siklusHidupPasien'
] as const;

type ModelName = (typeof MODELS)[number];

interface MigrationResult {
  model: string;
  sourceCount: number;
  migratedCount: number;
  success: boolean;
  error?: string;
}

async function main() {
  console.log('🚀 Starting migration: SQLite → Turso\n');

  const results: MigrationResult[] = [];
  let totalMigrated = 0;
  let totalFailed = 0;

  for (const model of MODELS) {
    try {
      console.log(`📦 Migrating: ${model}...`);

      // Count source records
      const sourceCount = await (localPrisma as any)[model].count();
      console.log(`   Source records: ${sourceCount}`);

      if (sourceCount === 0) {
        console.log(`   ⏭️  Skipping (empty)\n`);
        results.push({
          model,
          sourceCount: 0,
          migratedCount: 0,
          success: true
        });
        continue;
      }

      // Fetch all records from source
      const records = await (localPrisma as any)[model].findMany();
      console.log(`   Fetched ${records.length} records`);

      // Create records in Turso
      // Use createMany for bulk insert
      const createManyResult = await (tursoPrisma as any)[model].createMany({
        data: records,
        skipDuplicates: true
      });

      console.log(
        `   ✅ Inserted ${createManyResult.count || records.length} records\n`
      );

      // Verify count in Turso
      const tursoCount = await (tursoPrisma as any)[model].count();

      results.push({
        model,
        sourceCount,
        migratedCount: tursoCount,
        success: true
      });

      totalMigrated += tursoCount;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Failed: ${errorMsg}\n`);

      results.push({
        model,
        sourceCount: 0,
        migratedCount: 0,
        success: false,
        error: errorMsg
      });

      totalFailed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(
    `\n✅ Successful: ${successful.length} tables (${totalMigrated.toLocaleString()} records)`
  );
  console.log(`❌ Failed: ${failed.length} tables`);

  if (failed.length > 0) {
    console.log('\nFailed tables:');
    failed.forEach((r) => {
      console.log(`  - ${r.model}: ${r.error}`);
    });
  }

  if (successful.length > 0) {
    console.log('\nMigrated tables:');
    successful.forEach((r) => {
      const match = r.sourceCount === r.migratedCount ? '✅' : '⚠️';
      console.log(
        `  ${match} ${r.model}: ${r.sourceCount} → ${r.migratedCount}`
      );
    });
  }

  console.log('\n' + '='.repeat(60));

  if (totalFailed === 0) {
    console.log('🎉 Migration completed successfully!');
  } else {
    console.log(`⚠️  Migration completed with ${totalFailed} error(s)`);
  }

  // Cleanup
  await localPrisma.$disconnect();
  await tursoPrisma.$disconnect();

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
