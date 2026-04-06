#!/usr/bin/env bun
/**
 * Check what's currently on Turso vs local SQLite
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Turso connection
const tursoAdapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

const tursoPrisma = new PrismaClient({
  adapter: tursoAdapter
});

// Local SQLite
const localPrisma = new PrismaClient({
  datasourceUrl: 'file:./prisma/dev.db'
});

async function main() {
  console.log('🔍 Checking database status...\n');

  console.log('=== TURSO CLOUD DATABASE ===');
  try {
    const tables = [
      'user',
      'role',
      'puskesmas',
      'wilayah',
      'icd10',
      'overviewSummary',
      'topDiagnosa',
      'kunjungan',
      'tenagaKesehatan',
      'stokObat',
      'keuangan'
    ];

    for (const table of tables) {
      try {
        const count = await (tursoPrisma as any)[table].count();
        console.log(`  ✅ ${table}: ${count} records`);
      } catch (e: any) {
        console.log(`  ❌ ${table}: ${e.message.split('\n')[0]}`);
      }
    }
  } catch (error: any) {
    console.log(`  ❌ Connection failed: ${error.message.split('\n')[0]}`);
  }

  console.log('\n=== LOCAL SQLite (dev.db) ===');
  try {
    const userCount = await localPrisma.user.count();
    const puskesmasCount = await localPrisma.puskesmas.count();
    const summaryCount = await localPrisma.overviewSummary.count();
    console.log(`  users: ${userCount}`);
    console.log(`  puskesmas: ${puskesmasCount}`);
    console.log(`  overviewSummary: ${summaryCount}`);
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message.split('\n')[0]}`);
  }

  await tursoPrisma.$disconnect();
  await localPrisma.$disconnect();
}

main().catch(console.error);
