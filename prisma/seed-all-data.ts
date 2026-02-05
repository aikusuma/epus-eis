// Comprehensive seed file for all dummy data
// Run with: bun run prisma/seed-all-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Puskesmas list
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

// Top 10 diagnoses
const topDiagnoses = [
  { code: 'I10', nama: 'Hipertensi Esensial' },
  { code: 'J06.9', nama: 'ISPA (Infeksi Saluran Pernapasan Akut)' },
  { code: 'K30', nama: 'Dispepsia' },
  { code: 'E11.9', nama: 'Diabetes Mellitus Tipe 2' },
  { code: 'M79.1', nama: 'Myalgia' },
  { code: 'R50.9', nama: 'Demam' },
  { code: 'R51', nama: 'Sakit Kepala' },
  { code: 'A09', nama: 'Diare dan Gastroenteritis' },
  { code: 'M54.5', nama: 'Nyeri Punggung Bawah' },
  { code: 'K29.7', nama: 'Gastritis' }
];

// Top 10 drugs
const topDrugs = [
  { nama: 'Paracetamol 500mg', baseUsage: 800 },
  { nama: 'Amoxicillin 500mg', baseUsage: 650 },
  { nama: 'Amlodipine 5mg', baseUsage: 580 },
  { nama: 'Omeprazole 20mg', baseUsage: 520 },
  { nama: 'Metformin 500mg', baseUsage: 480 },
  { nama: 'Cetirizine 10mg', baseUsage: 420 },
  { nama: 'Ibuprofen 400mg', baseUsage: 380 },
  { nama: 'Captopril 25mg', baseUsage: 350 },
  { nama: 'Antasida Doen', baseUsage: 330 },
  { nama: 'Salbutamol 2mg', baseUsage: 290 }
];

// Life cycle age groups
const siklusHidupGroups = [
  { golongan: 'bayi', label: 'Bayi (0-11 bulan)', minAge: 0, maxAge: 0 },
  { golongan: 'balita', label: 'Balita (1-4 tahun)', minAge: 1, maxAge: 4 },
  { golongan: 'anak', label: 'Anak (5-14 tahun)', minAge: 5, maxAge: 14 },
  { golongan: 'remaja', label: 'Remaja (15-24 tahun)', minAge: 15, maxAge: 24 },
  { golongan: 'dewasa', label: 'Dewasa (25-44 tahun)', minAge: 25, maxAge: 44 },
  {
    golongan: 'paruh_baya',
    label: 'Paruh Baya (45-59 tahun)',
    minAge: 45,
    maxAge: 59
  },
  { golongan: 'lansia', label: 'Lansia (60+ tahun)', minAge: 60, maxAge: 100 }
];

async function main() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  console.log('🌱 Seeding all dummy data...\n');

  // ============================================
  // 1. Seed Top Diagnosa
  // ============================================
  console.log('📋 Seeding Top Diagnosa...');

  await prisma.topDiagnosa.deleteMany();

  const diagnosisData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const diag of topDiagnoses) {
      // Seed for current and previous 5 months
      for (let m = 0; m < 6; m++) {
        const month =
          currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
        const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

        diagnosisData.push({
          puskesmasId: pkm.id,
          icd10Code: diag.code,
          diagnosa: diag.nama,
          jumlahKasus: Math.floor(Math.random() * 100) + 50,
          bulan: month,
          tahun: year
        });
      }
    }
  }

  await prisma.topDiagnosa.createMany({ data: diagnosisData });
  console.log(`  ✓ Created ${diagnosisData.length} top diagnosa records`);

  // ============================================
  // 2. Seed Top Obat
  // ============================================
  console.log('\n💊 Seeding Top Obat...');

  await prisma.topObat.deleteMany();

  const obatData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const obat of topDrugs) {
      // Seed for current and previous 5 months
      for (let m = 0; m < 6; m++) {
        const month =
          currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
        const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

        obatData.push({
          puskesmasId: pkm.id,
          namaObat: obat.nama,
          jumlahResep: Math.floor(obat.baseUsage * (0.7 + Math.random() * 0.6)),
          bulan: month,
          tahun: year
        });
      }
    }
  }

  await prisma.topObat.createMany({ data: obatData });
  console.log(`  ✓ Created ${obatData.length} top obat records`);

  // ============================================
  // 3. Seed Siklus Hidup Pasien
  // ============================================
  console.log('\n👥 Seeding Siklus Hidup Pasien...');

  await prisma.siklusHidupPasien.deleteMany();

  const siklusData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const group of siklusHidupGroups) {
      // Seed for current and previous 5 months
      for (let m = 0; m < 6; m++) {
        const month =
          currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
        const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

        // Generate data for each gender
        const baseCounts: Record<string, number> = {
          bayi: 30,
          balita: 50,
          anak: 80,
          remaja: 120,
          dewasa: 200,
          paruh_baya: 180,
          lansia: 100
        };

        const baseCount = baseCounts[group.golongan] || 50;

        siklusData.push({
          puskesmasId: pkm.id,
          golonganUmur: group.golongan,
          jenisKelamin: 'L',
          jumlah: Math.floor(baseCount * (0.8 + Math.random() * 0.4)),
          bulan: month,
          tahun: year
        });

        siklusData.push({
          puskesmasId: pkm.id,
          golonganUmur: group.golongan,
          jenisKelamin: 'P',
          jumlah: Math.floor(baseCount * (0.9 + Math.random() * 0.4)),
          bulan: month,
          tahun: year
        });
      }
    }
  }

  await prisma.siklusHidupPasien.createMany({ data: siklusData });
  console.log(`  ✓ Created ${siklusData.length} siklus hidup records`);

  // ============================================
  // 4. Seed Overview Summary
  // ============================================
  console.log('\n📊 Seeding Overview Summary...');

  await prisma.overviewSummary.deleteMany();

  const overviewData: any[] = [];

  // Kabupaten level (puskesmasId = null)
  for (let m = 0; m < 12; m++) {
    const month =
      currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
    const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

    const totalKunjungan = Math.floor(Math.random() * 5000) + 15000;
    const bpjsRatio = 0.6 + Math.random() * 0.2;

    overviewData.push({
      puskesmasId: null,
      totalKunjungan,
      kunjunganBaru: Math.floor(totalKunjungan * 0.3),
      kunjunganLama: Math.floor(totalKunjungan * 0.7),
      pasienBpjs: Math.floor(totalKunjungan * bpjsRatio),
      pasienUmum: Math.floor(totalKunjungan * (1 - bpjsRatio)),
      bulan: month,
      tahun: year
    });
  }

  // Per puskesmas
  for (const pkm of puskesmasList) {
    for (let m = 0; m < 12; m++) {
      const month =
        currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
      const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

      const totalKunjungan = Math.floor(Math.random() * 500) + 800;
      const bpjsRatio = 0.5 + Math.random() * 0.3;

      overviewData.push({
        puskesmasId: pkm.id,
        totalKunjungan,
        kunjunganBaru: Math.floor(totalKunjungan * (0.2 + Math.random() * 0.2)),
        kunjunganLama: Math.floor(totalKunjungan * (0.6 + Math.random() * 0.2)),
        pasienBpjs: Math.floor(totalKunjungan * bpjsRatio),
        pasienUmum: Math.floor(totalKunjungan * (1 - bpjsRatio)),
        bulan: month,
        tahun: year
      });
    }
  }

  await prisma.overviewSummary.createMany({ data: overviewData });
  console.log(`  ✓ Created ${overviewData.length} overview summary records`);

  // ============================================
  // 5. Seed Stok Obat
  // ============================================
  console.log('\n💉 Seeding Stok Obat...');

  await prisma.stokObat.deleteMany();

  const stokData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const obat of topDrugs) {
      const stok = Math.floor(Math.random() * 500) + 200;
      const pemakaian = Math.floor(
        obat.baseUsage * (0.5 + Math.random() * 0.5)
      );

      stokData.push({
        puskesmasId: pkm.id,
        namaObat: obat.nama,
        satuan: 'tablet',
        stok,
        pemakaian,
        bulan: currentMonth,
        tahun: currentYear
      });
    }
  }

  await prisma.stokObat.createMany({ data: stokData });
  console.log(`  ✓ Created ${stokData.length} stok obat records`);

  // ============================================
  // 6. Seed Imunisasi
  // ============================================
  console.log('\n💉 Seeding Imunisasi...');

  await prisma.imunisasi.deleteMany();

  const imunisasiTypes = [
    { jenis: 'HB-0', kategori: 'bayi' },
    { jenis: 'BCG', kategori: 'bayi' },
    { jenis: 'Polio 1', kategori: 'bayi' },
    { jenis: 'Polio 2', kategori: 'bayi' },
    { jenis: 'Polio 3', kategori: 'bayi' },
    { jenis: 'DPT-HB-Hib 1', kategori: 'bayi' },
    { jenis: 'DPT-HB-Hib 2', kategori: 'bayi' },
    { jenis: 'DPT-HB-Hib 3', kategori: 'bayi' },
    { jenis: 'Campak', kategori: 'bayi' },
    { jenis: 'MR', kategori: 'baduta' }
  ];

  const imunData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const imun of imunisasiTypes) {
      const sasaran = Math.floor(Math.random() * 100) + 80;
      const capaian = Math.floor(sasaran * (0.7 + Math.random() * 0.3));

      imunData.push({
        puskesmasId: pkm.id,
        jenisImunisasi: imun.jenis,
        kategori: imun.kategori,
        sasaran,
        capaian,
        bulan: currentMonth,
        tahun: currentYear
      });
    }
  }

  await prisma.imunisasi.createMany({ data: imunData });
  console.log(`  ✓ Created ${imunData.length} imunisasi records`);

  // ============================================
  // 7. Seed ANC
  // ============================================
  console.log('\n🤰 Seeding ANC...');

  await prisma.antenatalCare.deleteMany();

  const ancData: any[] = [];
  for (const pkm of puskesmasList) {
    for (let m = 0; m < 12; m++) {
      const month =
        currentMonth - m <= 0 ? currentMonth - m + 12 : currentMonth - m;
      const year = currentMonth - m <= 0 ? currentYear - 1 : currentYear;

      const target = Math.floor(Math.random() * 50) + 80;
      const k1 = Math.floor(target * (0.8 + Math.random() * 0.2));
      const k4 = Math.floor(k1 * (0.6 + Math.random() * 0.3));

      ancData.push({
        puskesmasId: pkm.id,
        k1,
        k4,
        target,
        bulan: month,
        tahun: year
      });
    }
  }

  await prisma.antenatalCare.createMany({ data: ancData });
  console.log(`  ✓ Created ${ancData.length} ANC records`);

  // ============================================
  // 8. Seed Tenaga Kesehatan (SDM)
  // ============================================
  console.log('\n👨‍⚕️ Seeding SDM Kesehatan...');

  await prisma.tenagaKesehatan.deleteMany();

  const sdmTypes = [
    { kategori: 'Dokter Umum', target: 4 },
    { kategori: 'Dokter Gigi', target: 2 },
    { kategori: 'Bidan', target: 10 },
    { kategori: 'Perawat', target: 15 },
    { kategori: 'Apoteker', target: 2 },
    { kategori: 'Analis Lab', target: 3 }
  ];

  const sdmData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const sdm of sdmTypes) {
      sdmData.push({
        puskesmasId: pkm.id,
        kategori: sdm.kategori,
        jumlah: Math.floor(sdm.target * (0.6 + Math.random() * 0.5)),
        target: sdm.target,
        bulan: currentMonth,
        tahun: currentYear
      });
    }
  }

  await prisma.tenagaKesehatan.createMany({ data: sdmData });
  console.log(`  ✓ Created ${sdmData.length} SDM records`);

  // ============================================
  // 9. Seed Deteksi Dini (PTM)
  // ============================================
  console.log('\n🔍 Seeding Deteksi Dini...');

  await prisma.deteksiDini.deleteMany();

  const deteksiTypes = [
    { jenis: 'IVA (Kanker Serviks)', sasaran: 200 },
    { jenis: 'SADANIS (Kanker Payudara)', sasaran: 200 },
    { jenis: 'Skrining Hipertensi', sasaran: 500 },
    { jenis: 'Skrining DM', sasaran: 400 },
    { jenis: 'Skrining Obesitas', sasaran: 300 }
  ];

  const deteksiData: any[] = [];
  for (const pkm of puskesmasList) {
    for (const det of deteksiTypes) {
      const sasaran = det.sasaran;
      const capaian = Math.floor(sasaran * (0.4 + Math.random() * 0.5));

      deteksiData.push({
        puskesmasId: pkm.id,
        jenis: det.jenis,
        sasaran,
        capaian,
        bulan: currentMonth,
        tahun: currentYear
      });
    }
  }

  await prisma.deteksiDini.createMany({ data: deteksiData });
  console.log(`  ✓ Created ${deteksiData.length} deteksi dini records`);

  // ============================================
  // 10. Seed Rawat Inap
  // ============================================
  console.log('\n🏥 Seeding Rawat Inap...');

  await prisma.rawatInap.deleteMany();

  const riData: any[] = [];
  for (const pkm of puskesmasList) {
    // Last 30 days
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);

      const bedTotal = 20;
      const bedTerisi = Math.floor(bedTotal * (0.4 + Math.random() * 0.5));

      riData.push({
        puskesmasId: pkm.id,
        pasienMasuk: Math.floor(Math.random() * 5) + 2,
        pasienKeluar: Math.floor(Math.random() * 5) + 1,
        bedTerisi,
        bedTotal,
        tanggal: date
      });
    }
  }

  await prisma.rawatInap.createMany({ data: riData });
  console.log(`  ✓ Created ${riData.length} rawat inap records`);

  console.log('\n🎉 All data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
