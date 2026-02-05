// Script to verify actual data from eis-data functions
// Run with: bun run prisma/verify-eis-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyEisData() {
  console.log('=== EIS DATA VERIFICATION ===\n');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // ============================================
  // KLASTER 1: SDM, OBAT, KEUANGAN
  // ============================================
  console.log('📊 KLASTER 1: SDM, OBAT, KEUANGAN');

  // SDM - TenagaKesehatan
  const sdm = await prisma.tenagaKesehatan.groupBy({
    by: ['kategori'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { jumlah: true, target: true }
  });
  console.log(`  ✅ SDM Categories: ${sdm.length}`);
  if (sdm.length === 0) console.log('     ⚠️  No SDM data for current month!');

  // Stok Obat
  const obat = await prisma.stokObat.groupBy({
    by: ['namaObat'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { stok: true }
  });
  console.log(`  ✅ Obat Items: ${obat.length}`);
  if (obat.length === 0)
    console.log('     ⚠️  No Obat data for current month!');

  // Keuangan
  const keuangan = await prisma.keuangan.groupBy({
    by: ['kategori'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { nominal: true }
  });
  console.log(`  ✅ Keuangan Categories: ${keuangan.length}`);
  if (keuangan.length === 0)
    console.log('     ⚠️  No Keuangan data for current month!');

  // ============================================
  // KLASTER 2: IBU DAN ANAK
  // ============================================
  console.log('\n👶 KLASTER 2: IBU DAN ANAK');

  // ANC
  const anc = await prisma.antenatalCare.aggregate({
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { k1: true, k4: true, target: true }
  });
  console.log(`  ✅ ANC: K1=${anc._sum.k1 || 0}, K4=${anc._sum.k4 || 0}`);
  if (!anc._sum.k1) console.log('     ⚠️  No ANC data for current month!');

  // Imunisasi
  const imunisasi = await prisma.imunisasi.groupBy({
    by: ['jenisImunisasi'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { capaian: true }
  });
  console.log(`  ✅ Imunisasi Types: ${imunisasi.length}`);
  if (imunisasi.length === 0)
    console.log('     ⚠️  No Imunisasi data for current month!');

  // ============================================
  // KLASTER 3: DETEKSI DINI & PTM
  // ============================================
  console.log('\n🔍 KLASTER 3: DETEKSI DINI & PTM');

  // Deteksi Dini
  const deteksi = await prisma.deteksiDini.groupBy({
    by: ['jenis'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { capaian: true }
  });
  console.log(`  ✅ Deteksi Dini Types: ${deteksi.length}`);
  if (deteksi.length === 0)
    console.log('     ⚠️  No Deteksi Dini data for current month!');

  // Faktor Risiko
  const risiko = await prisma.faktorRisiko.groupBy({
    by: ['faktor'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { jumlahKasus: true }
  });
  console.log(`  ✅ Faktor Risiko Types: ${risiko.length}`);
  if (risiko.length === 0)
    console.log('     ⚠️  No Faktor Risiko data for current month!');

  // Pemeriksaan Gigi
  const gigi = await prisma.pemeriksaanGigi.aggregate({
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { diperiksa: true, perluPerawatan: true }
  });
  console.log(`  ✅ Gigi: Diperiksa=${gigi._sum.diperiksa || 0}`);
  if (!gigi._sum.diperiksa)
    console.log('     ⚠️  No Gigi data for current month!');

  // ============================================
  // KLASTER 4: PERINGATAN DIAGNOSA
  // ============================================
  console.log('\n🚨 KLASTER 4: PERINGATAN DIAGNOSA');

  // Top Diagnosa
  const topDiagnosa = await prisma.topDiagnosa.groupBy({
    by: ['icd10Code', 'diagnosa'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { jumlahKasus: true },
    orderBy: { _sum: { jumlahKasus: 'desc' } },
    take: 5
  });
  console.log(`  ✅ Top Diagnosa: ${topDiagnosa.length}`);
  topDiagnosa.forEach((d: any, i: number) => {
    console.log(
      `     ${i + 1}. ${d.diagnosa} (${d.icd10Code}): ${d._sum.jumlahKasus}`
    );
  });

  // Diagnosa Harian by severity
  const diagnosaHari = await prisma.diagnosaHarian.groupBy({
    by: ['tingkatBahaya'],
    _count: true
  });
  console.log(`  ✅ Diagnosa Harian by Severity:`);
  diagnosaHari.forEach((d: any) => {
    console.log(`     - ${d.tingkatBahaya}: ${d._count} records`);
  });

  // ============================================
  // LINTAS KLASTER
  // ============================================
  console.log('\n🏥 LINTAS KLASTER');

  // GawatDarurat (Triase)
  const triase = await prisma.gawatDarurat.aggregate({
    _sum: { triaseMerah: true, triaseKuning: true, triaseHijau: true }
  });
  console.log(
    `  ✅ Triase Total: Merah=${triase._sum.triaseMerah || 0}, Kuning=${triase._sum.triaseKuning || 0}, Hijau=${triase._sum.triaseHijau || 0}`
  );

  // Farmasi
  const farmasi = await prisma.farmasi.aggregate({
    _sum: { jumlahResep: true, obatKeluar: true }
  });
  console.log(
    `  ✅ Farmasi Total: Resep=${farmasi._sum.jumlahResep || 0}, ObatKeluar=${farmasi._sum.obatKeluar || 0}`
  );

  // Laboratorium
  const lab = await prisma.laboratorium.aggregate({
    _sum: { jumlahPemeriksaan: true }
  });
  console.log(`  ✅ Lab Pemeriksaan Total: ${lab._sum.jumlahPemeriksaan || 0}`);

  // RawatInap
  const rawatInap = await prisma.rawatInap.aggregate({
    _sum: { pasienMasuk: true, pasienKeluar: true }
  });
  console.log(
    `  ✅ Rawat Inap Total: Masuk=${rawatInap._sum.pasienMasuk || 0}, Keluar=${rawatInap._sum.pasienKeluar || 0}`
  );

  // ============================================
  // OVERVIEW
  // ============================================
  console.log('\n📈 OVERVIEW');

  // OverviewSummary
  const overview = await prisma.overviewSummary.findFirst({
    where: { tahun: currentYear, bulan: currentMonth }
  });
  if (overview) {
    console.log(`  ✅ Overview: Kunjungan=${overview.totalKunjungan}`);
  } else {
    console.log('  ⚠️  No OverviewSummary for current month!');
  }

  // SiklusHidupPasien
  const lifecycle = await prisma.siklusHidupPasien.groupBy({
    by: ['golonganUmur'],
    where: { tahun: currentYear, bulan: currentMonth },
    _sum: { jumlah: true }
  });
  console.log(`  ✅ Siklus Hidup Umur Groups: ${lifecycle.length}`);

  // Kunjungan
  const kunjungan = await prisma.kunjungan.count();
  console.log(`  ✅ Total Kunjungan Records: ${kunjungan}`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n=== VERIFICATION COMPLETE ===');

  await prisma.$disconnect();
}

verifyEisData().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
