// Script to check data in all tables
// Run with: bun run prisma/check-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('=== DATABASE DATA CHECK ===\n');

  const checks: { name: string; count: number | string }[] = [];

  // Core master data
  const puskesmas = await prisma.puskesmas.count();
  checks.push({ name: 'Puskesmas', count: puskesmas });

  const wilayah = await prisma.wilayah.count();
  checks.push({ name: 'Wilayah', count: wilayah });

  const icd10 = await prisma.icd10.count();
  checks.push({ name: 'ICD-10', count: icd10 });

  // Klaster 1: SDM, Obat, Keuangan
  const tenagaKesehatan = await prisma.tenagaKesehatan.count();
  checks.push({ name: 'TenagaKesehatan (Klaster1)', count: tenagaKesehatan });

  const stokObat = await prisma.stokObat.count();
  checks.push({ name: 'StokObat (Klaster1)', count: stokObat });

  const keuangan = await prisma.keuangan.count();
  checks.push({ name: 'Keuangan (Klaster1)', count: keuangan });

  // Klaster 2: Ibu dan Anak
  const antenatalCare = await prisma.antenatalCare.count();
  checks.push({ name: 'AntenatalCare (Klaster2)', count: antenatalCare });

  const imunisasi = await prisma.imunisasi.count();
  checks.push({ name: 'Imunisasi (Klaster2)', count: imunisasi });

  // Klaster 3: Deteksi Dini & PTM
  const deteksiDini = await prisma.deteksiDini.count();
  checks.push({ name: 'DeteksiDini (Klaster3)', count: deteksiDini });

  const faktorRisiko = await prisma.faktorRisiko.count();
  checks.push({ name: 'FaktorRisiko (Klaster3)', count: faktorRisiko });

  const pemeriksaanGigi = await prisma.pemeriksaanGigi.count();
  checks.push({ name: 'PemeriksaanGigi (Klaster3)', count: pemeriksaanGigi });

  // Klaster 4: Diagnosa Harian
  const diagnosaHarian = await prisma.diagnosaHarian.count();
  checks.push({ name: 'DiagnosaHarian (Klaster4)', count: diagnosaHarian });

  // Overview / Monitoring
  const topDiagnosa = await prisma.topDiagnosa.count();
  checks.push({ name: 'TopDiagnosa', count: topDiagnosa });

  const topKeluhan = await prisma.topKeluhan.count();
  checks.push({ name: 'TopKeluhan', count: topKeluhan });

  const topObat = await prisma.topObat.count();
  checks.push({ name: 'TopObat', count: topObat });

  const siklusHidupPasien = await prisma.siklusHidupPasien.count();
  checks.push({ name: 'SiklusHidupPasien', count: siklusHidupPasien });

  const overviewSummary = await prisma.overviewSummary.count();
  checks.push({ name: 'OverviewSummary', count: overviewSummary });

  // Lintas Klaster
  const gawatDarurat = await prisma.gawatDarurat.count();
  checks.push({ name: 'GawatDarurat (Triase)', count: gawatDarurat });

  const farmasi = await prisma.farmasi.count();
  checks.push({ name: 'Farmasi', count: farmasi });

  const laboratorium = await prisma.laboratorium.count();
  checks.push({ name: 'Laboratorium', count: laboratorium });

  const rawatInap = await prisma.rawatInap.count();
  checks.push({ name: 'RawatInap', count: rawatInap });

  // Kunjungan
  const kunjungan = await prisma.kunjungan.count();
  checks.push({ name: 'Kunjungan', count: kunjungan });

  // DiagnosisDummy
  const diagnosisDummy = await prisma.diagnosisDummy.count();
  checks.push({ name: 'DiagnosisDummy', count: diagnosisDummy });

  // Print results
  let missingData: string[] = [];
  for (const check of checks) {
    const status =
      typeof check.count === 'number' && check.count > 0 ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${check.count}`);
    if (typeof check.count === 'number' && check.count === 0) {
      missingData.push(check.name);
    }
  }

  console.log('\n=== SUMMARY ===');
  if (missingData.length === 0) {
    console.log('✅ All tables have data!');
  } else {
    console.log(`❌ Tables with NO DATA (${missingData.length}):`);
    missingData.forEach((t) => console.log(`   - ${t}`));
  }

  await prisma.$disconnect();
}

checkData().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
