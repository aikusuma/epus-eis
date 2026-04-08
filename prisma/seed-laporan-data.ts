/**
 * Seed data untuk laporan yang masih kosong:
 * - Obat (StokObat untuk laporan top 10 pemakaian obat)
 * - SDM (TenagaKesehatan)
 * - Imunisasi (sudah ada tapi perlu ditambahkan kategori BIAS)
 * - Rawat Inap
 * - Deteksi Dini
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

const puskesmasList = [
  { id: 'pkm-brebes', nama: 'Puskesmas Brebes' },
  { id: 'pkm-wanasari', nama: 'Puskesmas Wanasari' },
  { id: 'pkm-bulakamba', nama: 'Puskesmas Bulakamba' },
  { id: 'pkm-tanjung', nama: 'Puskesmas Tanjung' },
  { id: 'pkm-losari', nama: 'Puskesmas Losari' },
  { id: 'pkm-kersana', nama: 'Puskesmas Kersana' },
  { id: 'pkm-banjarharjo', nama: 'Puskesmas Banjarharjo' },
  { id: 'pkm-ketanggungan', nama: 'Puskesmas Ketanggungan' },
  { id: 'pkm-larangan', nama: 'Puskesmas Larangan' },
  { id: 'pkm-songgom', nama: 'Puskesmas Songgom' }
];

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

async function main() {
  console.log('🌱 Seeding data untuk laporan yang kosong...\n');

  // ============================================
  // 1. Seed Stok Obat (untuk laporan /laporan?report=obat)
  // ============================================
  console.log('💊 Seeding Stok Obat untuk laporan obat...');

  await prisma.stokObat.deleteMany();

  const obatList = [
    {
      nama: 'Paracetamol 500mg',
      satuan: 'Tablet',
      baseStok: 5000,
      basePemakaian: 3500
    },
    {
      nama: 'Amoxicillin 500mg',
      satuan: 'Tablet',
      baseStok: 3000,
      basePemakaian: 2100
    },
    {
      nama: 'Antasida DOEN',
      satuan: 'Tablet',
      baseStok: 2500,
      basePemakaian: 1800
    },
    {
      nama: 'Omeprazole 20mg',
      satuan: 'Kapsul',
      baseStok: 2000,
      basePemakaian: 1500
    },
    {
      nama: 'Metformin 500mg',
      satuan: 'Tablet',
      baseStok: 2800,
      basePemakaian: 2000
    },
    {
      nama: 'Amlodipine 10mg',
      satuan: 'Tablet',
      baseStok: 1500,
      basePemakaian: 1200
    },
    {
      nama: 'Cetirizine 10mg',
      satuan: 'Tablet',
      baseStok: 1800,
      basePemakaian: 1300
    },
    {
      nama: 'Ibuprofen 400mg',
      satuan: 'Tablet',
      baseStok: 2200,
      basePemakaian: 1600
    },
    {
      nama: 'Vitamin C 50mg',
      satuan: 'Tablet',
      baseStok: 3500,
      basePemakaian: 2500
    },
    { nama: 'Oralit', satuan: 'Sachet', baseStok: 1200, basePemakaian: 800 },
    {
      nama: 'Salbutamol 2mg',
      satuan: 'Tablet',
      baseStok: 1000,
      basePemakaian: 700
    },
    {
      nama: 'Dexamethasone 0.5mg',
      satuan: 'Tablet',
      baseStok: 1500,
      basePemakaian: 1100
    },
    {
      nama: 'Captopril 25mg',
      satuan: 'Tablet',
      baseStok: 1200,
      basePemakaian: 900
    },
    {
      nama: 'Simvastatin 20mg',
      satuan: 'Tablet',
      baseStok: 1800,
      basePemakaian: 1400
    },
    {
      nama: 'Ranitidine 150mg',
      satuan: 'Tablet',
      baseStok: 1600,
      basePemakaian: 1100
    }
  ];

  const stokObatData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const obat of obatList) {
      for (let m = 0; m < 6; m++) {
        const month =
          currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
        const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

        const variation = 0.8 + Math.random() * 0.4;
        const stok = Math.floor(obat.baseStok * variation);
        const pemakaian = Math.floor(obat.basePemakaian * variation);

        stokObatData.push({
          puskesmasId: pkm.id,
          namaObat: obat.nama,
          satuan: obat.satuan,
          stok,
          pemakaian,
          bulan: month,
          tahun: year
        });
      }
    }
  }

  await prisma.stokObat.createMany({ data: stokObatData });
  console.log(`  ✓ Created ${stokObatData.length} stok obat records\n`);

  // ============================================
  // 2. Seed SDM / TenagaKesehatan (untuk laporan /laporan?report=sdm)
  // ============================================
  console.log('👨‍⚕️ Seeding SDM Kesehatan...');

  await prisma.tenagaKesehatan.deleteMany();

  const sdmCategories = [
    { kategori: 'Dokter Umum', baseJumlah: 15, baseTarget: 20 },
    { kategori: 'Dokter Gigi', baseJumlah: 8, baseTarget: 10 },
    { kategori: 'Bidan', baseJumlah: 45, baseTarget: 50 },
    { kategori: 'Perawat', baseJumlah: 60, baseTarget: 70 },
    { kategori: 'Bidan Desa', baseJumlah: 25, baseTarget: 30 },
    { kategori: 'Asisten Apoteker', baseJumlah: 12, baseTarget: 15 },
    { kategori: 'Teknisi Laboratorium', baseJumlah: 10, baseTarget: 12 },
    { kategori: 'Sanitarian', baseJumlah: 5, baseTarget: 8 },
    { kategori: 'Petugas Gizi', baseJumlah: 8, baseTarget: 10 },
    { kategori: 'Petugas Farmasi', baseJumlah: 15, baseTarget: 18 }
  ];

  const sdmData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const sdm of sdmCategories) {
      for (let m = 0; m < 6; m++) {
        const month =
          currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
        const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

        const jumlah = Math.floor(sdm.baseJumlah * (0.9 + Math.random() * 0.2));
        const target = sdm.baseTarget;

        sdmData.push({
          puskesmasId: pkm.id,
          kategori: sdm.kategori,
          jumlah,
          target,
          bulan: month,
          tahun: year
        });
      }
    }
  }

  await prisma.tenagaKesehatan.createMany({ data: sdmData });
  console.log(`  ✓ Created ${sdmData.length} SDM records\n`);

  // ============================================
  // 3. Imunisasi BIAS - SKIP (sudah ada data dari seed sebelumnya)
  // ============================================
  console.log('💉 Imunisasi BIAS: SKIP (sudah ada data)\n');

  // ============================================
  // 4. Seed Rawat Inap (untuk laporan /laporan?report=rawat-inap)
  // ============================================
  console.log('🏥 Seeding Rawat Inap...');

  await prisma.rawatInap.deleteMany();

  const rawatInapData: any[] = [];
  for (const pkm of puskesmasList) {
    // Seed for last 30 days
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);

      const masuk = Math.floor(Math.random() * 15) + 5;
      const keluar = Math.floor(Math.random() * 12) + 3;
      const bedTotal = 30;
      const bedTerisi = Math.min(Math.floor(Math.random() * 20) + 10, bedTotal);
      const bor = Math.round((bedTerisi / bedTotal) * 100);

      rawatInapData.push({
        puskesmasId: pkm.id,
        tanggal: date,
        pasienMasuk: masuk,
        pasienKeluar: keluar,
        bedTerisi,
        bedTotal
      });
    }
  }

  // Insert using create (deleteMany already cleared the table)
  let insertedCount = 0;
  for (const item of rawatInapData) {
    try {
      await prisma.rawatInap.create({
        data: {
          puskesmasId: item.puskesmasId,
          tanggal: item.tanggal,
          pasienMasuk: item.pasienMasuk,
          pasienKeluar: item.pasienKeluar,
          bedTerisi: item.bedTerisi,
          bedTotal: item.bedTotal
        }
      });
      insertedCount++;
    } catch (e) {
      // Skip if already exists
    }
  }

  console.log(`  ✓ Created ${insertedCount} rawat inap records\n`);

  // ============================================
  // 5. Seed Deteksi Dini (untuk laporan /laporan?report=deteksi-dini)
  // ============================================
  console.log('🔍 Seeding Deteksi Dini...');

  await prisma.deteksiDini.deleteMany();

  const deteksiDiniTypes = [
    'Kanker Serviks (IVA)',
    'Kanker Payudara',
    'Tuberculosis',
    'Hipertensi',
    'Diabetes Mellitus',
    'Gangguan Jiwa',
    'PPOK',
    'Asma',
    'Gizi Kurang',
    'Perkembangan Anak'
  ];

  const deteksiDiniData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const jenis of deteksiDiniTypes) {
      for (let m = 0; m < 6; m++) {
        const month =
          currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
        const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

        const sasaran = Math.floor(Math.random() * 150) + 50;
        const capaian = Math.floor(sasaran * (0.5 + Math.random() * 0.5));

        deteksiDiniData.push({
          puskesmasId: pkm.id,
          jenis,
          sasaran,
          capaian,
          bulan: month,
          tahun: year
        });
      }
    }
  }

  await prisma.deteksiDini.createMany({ data: deteksiDiniData });
  console.log(`  ✓ Created ${deteksiDiniData.length} deteksi dini records\n`);

  console.log('🎉 Semua data untuk laporan berhasil di-seed!');
  console.log('\n📊 Ringkasan:');
  console.log('  - Stok Obat: 900 records (untuk laporan obat)');
  console.log('  - SDM: 600 records (untuk laporan sdm)');
  console.log('  - Imunisasi: sudah ada data sebelumnya');
  console.log('  - Rawat Inap: 300 records (untuk laporan rawat-inap)');
  console.log('  - Deteksi Dini: 600 records (untuk laporan deteksi-dini)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
