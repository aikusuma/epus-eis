// Prisma seed script for comprehensive EIS data
// Run with: bun run prisma/seed-comprehensive.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;

async function seedComprehensiveData() {
  console.log('🌱 Seeding comprehensive EIS data...');

  // Get all puskesmas
  const puskesmasList = await prisma.puskesmas.findMany();

  if (puskesmasList.length === 0) {
    console.log('⚠️ No puskesmas found. Run main seed first.');
    return;
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // ============================================
  // 1. ICD-10 CODES: A00 (Cholera), A01 (Typhoid), and Common Diseases
  // ============================================
  console.log('📋 Seeding ICD-10 codes (Top 10 + A00/A01)...');

  const icd10Codes = [
    // A00 - Cholera
    { code: 'A00', display: 'Cholera', baseCount: 45 },
    {
      code: 'A00.0',
      display: 'Cholera due to Vibrio cholerae 01, biovar cholerae',
      baseCount: 15
    },
    {
      code: 'A00.1',
      display: 'Cholera due to Vibrio cholerae 01, biovar eltor',
      baseCount: 20
    },
    { code: 'A00.9', display: 'Cholera, unspecified', baseCount: 10 },
    // A01 - Typhoid and paratyphoid fevers
    { code: 'A01', display: 'Typhoid and paratyphoid fevers', baseCount: 150 },
    { code: 'A01.0', display: 'Typhoid fever', baseCount: 120 },
    { code: 'A01.1', display: 'Paratyphoid fever A', baseCount: 45 },
    { code: 'A01.2', display: 'Paratyphoid fever B', baseCount: 30 },
    { code: 'A01.3', display: 'Paratyphoid fever C', baseCount: 20 },
    // Common diseases (Top 10)
    {
      code: 'J06',
      display: 'ISPA (Infeksi Saluran Pernapasan Akut)',
      baseCount: 350
    },
    { code: 'I10', display: 'Hipertensi esensial (primer)', baseCount: 280 },
    { code: 'K29', display: 'Gastritis dan duodenitis', baseCount: 200 },
    { code: 'E11', display: 'Diabetes mellitus tipe 2', baseCount: 180 },
    { code: 'J18', display: 'Pneumonia', baseCount: 120 },
    { code: 'N39.0', display: 'Infeksi saluran kemih', baseCount: 90 },
    { code: 'L30', display: 'Dermatitis', baseCount: 75 },
    { code: 'M54', display: 'Dorsalgia (Nyeri Punggung)', baseCount: 65 }
  ];

  // First, create all ICD-10 codes
  const createdIcd10: Record<string, string> = {};

  for (const icd of icd10Codes) {
    const created = await prisma.icd10.upsert({
      where: { code: icd.code },
      update: { display: icd.display },
      create: {
        code: icd.code,
        display: icd.display,
        version: 'ICD10_2010'
      }
    });
    createdIcd10[icd.code] = created.id;
  }

  console.log(`✅ ICD-10 codes created: ${icd10Codes.length}`);

  // ============================================
  // 1.5. DIAGNOSIS DUMMY DATA for Disease Trend Chart
  // ============================================
  console.log('🏥 Seeding DiagnosisDummy data for trend chart...');

  const namaList = [
    'Ahmad',
    'Budi',
    'Citra',
    'Dewi',
    'Eko',
    'Fitri',
    'Gunawan',
    'Hani',
    'Indra',
    'Joko',
    'Kartini',
    'Lestari',
    'Made',
    'Nina',
    'Oscar',
    'Putri',
    'Qori',
    'Rina',
    'Surya',
    'Tuti',
    'Udin',
    'Vina',
    'Wawan',
    'Yani',
    'Zainal'
  ];
  const pkmNames = puskesmasList
    .slice(0, 10)
    .map((p: any) => p.nama)
    .filter(Boolean);
  if (pkmNames.length === 0) {
    pkmNames.push(
      'Puskesmas Brebes I',
      'Puskesmas Brebes II',
      'Puskesmas Losari I'
    );
  }

  // Generate diagnosis data for each ICD-10 code over the last 6 months
  for (const icd of icd10Codes) {
    const icd10Id = createdIcd10[icd.code];
    if (!icd10Id) continue;

    // Distribute diagnoses over 6 months
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - monthOffset);

      // Add trend variation - more recent months have slightly higher counts
      const trendMultiplier = 1 + (5 - monthOffset) * 0.1;
      const monthlyCount = Math.round(
        (icd.baseCount / 6) * trendMultiplier * randFloat(0.8, 1.2)
      );

      for (let i = 0; i < monthlyCount; i++) {
        const tanggal = new Date(baseDate);
        tanggal.setDate(randInt(1, 28));
        tanggal.setHours(randInt(8, 16), randInt(0, 59), 0, 0);

        const gender = Math.random() > 0.5 ? 'L' : 'P';
        const nama = namaList[randInt(0, namaList.length - 1)];
        const puskesmasName =
          pkmNames[randInt(0, pkmNames.length - 1)] || 'Puskesmas Brebes I';

        await prisma.diagnosisDummy.create({
          data: {
            icd10Id,
            pasienNama: `${nama} ${randInt(1, 99)}`,
            pasienUmur: randInt(5, 70),
            pasienGender: gender,
            puskesmas: puskesmasName,
            tanggalPeriksa: tanggal
          }
        });
      }
    }
  }

  console.log('✅ DiagnosisDummy data seeded');

  // ============================================
  // 2. KLASTER 1: SDM TREND 6 BULAN & KEUANGAN
  // ============================================
  console.log('📊 Seeding Klaster 1 SDM & Keuangan trends...');

  // SDM - Tenaga Kesehatan dengan trend 6 bulan terakhir
  const kategoriNakes = [
    { nama: 'Dokter Umum', target: 3, baseValue: 2 },
    { nama: 'Dokter Gigi', target: 2, baseValue: 1 },
    { nama: 'Bidan', target: 5, baseValue: 4 },
    { nama: 'Perawat', target: 8, baseValue: 6 },
    { nama: 'Apoteker', target: 1, baseValue: 1 },
    { nama: 'Analis Lab', target: 2, baseValue: 1 },
    { nama: 'Nutrisionis', target: 1, baseValue: 1 },
    { nama: 'Sanitarian', target: 2, baseValue: 1 }
  ];

  // Seed 6 months of SDM data with trend
  for (const pkm of puskesmasList) {
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const month = currentMonth - monthOffset;
      const year = month <= 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month <= 0 ? 12 + month : month;

      for (const kat of kategoriNakes) {
        // Create a growth trend (more staff over time)
        const trendMultiplier = 1 + (5 - monthOffset) * 0.05; // 5% growth per month
        const value = Math.min(
          Math.round(kat.baseValue * trendMultiplier + randFloat(-0.5, 0.5)),
          kat.target + 1
        );

        await prisma.tenagaKesehatan.upsert({
          where: {
            puskesmasId_kategori_bulan_tahun: {
              puskesmasId: pkm.id,
              kategori: kat.nama,
              bulan: adjustedMonth,
              tahun: year
            }
          },
          update: { jumlah: value },
          create: {
            puskesmasId: pkm.id,
            kategori: kat.nama,
            jumlah: value,
            target: kat.target,
            bulan: adjustedMonth,
            tahun: year
          }
        });
      }
    }
  }

  // Keuangan - with monthly trends
  const kategoriKeuangan = [
    { nama: 'Pendapatan JKN', baseNominal: 150000000, growthRate: 0.03 },
    { nama: 'Pendapatan Umum', baseNominal: 25000000, growthRate: 0.02 },
    { nama: 'BLUD', baseNominal: 50000000, growthRate: 0.01 },
    { nama: 'DAK', baseNominal: 100000000, growthRate: 0.0 },
    { nama: 'Kapitasi BPJS', baseNominal: 75000000, growthRate: 0.02 }
  ];

  for (const pkm of puskesmasList) {
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const month = currentMonth - monthOffset;
      const year = month <= 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month <= 0 ? 12 + month : month;

      for (const kat of kategoriKeuangan) {
        const trendMultiplier = 1 + (5 - monthOffset) * kat.growthRate;
        const nominal = kat.baseNominal * trendMultiplier * randFloat(0.9, 1.1);

        await prisma.keuangan.upsert({
          where: {
            puskesmasId_kategori_bulan_tahun: {
              puskesmasId: pkm.id,
              kategori: kat.nama,
              bulan: adjustedMonth,
              tahun: year
            }
          },
          update: { nominal: Math.round(nominal) },
          create: {
            puskesmasId: pkm.id,
            kategori: kat.nama,
            nominal: Math.round(nominal),
            bulan: adjustedMonth,
            tahun: year
          }
        });
      }
    }
  }

  console.log('✅ Klaster 1 SDM & Keuangan trends seeded');

  // ============================================
  // 3. KLASTER 4: DIAGNOSA HARIAN dengan tingkatBahaya
  // ============================================
  console.log('🚨 Seeding Klaster 4 Diagnosa Harian with severity levels...');

  const diagnosaSeverity = [
    // Tingkat Bahaya TINGGI
    { icd10Code: 'A00', diagnosa: 'Cholera', tingkatBahaya: 'tinggi' },
    {
      icd10Code: 'A00.0',
      diagnosa: 'Cholera due to Vibrio cholerae',
      tingkatBahaya: 'tinggi'
    },
    { icd10Code: 'A01.0', diagnosa: 'Typhoid fever', tingkatBahaya: 'tinggi' },
    {
      icd10Code: 'A01.01',
      diagnosa: 'Typhoid meningitis',
      tingkatBahaya: 'tinggi'
    },
    {
      icd10Code: 'A09',
      diagnosa: 'Diare dan gastroenteritis akut',
      tingkatBahaya: 'tinggi'
    },
    {
      icd10Code: 'A15',
      diagnosa: 'Tuberkulosis paru',
      tingkatBahaya: 'tinggi'
    },
    {
      icd10Code: 'A37',
      diagnosa: 'Pertusis (Batuk Rejan)',
      tingkatBahaya: 'tinggi'
    },
    { icd10Code: 'A90', diagnosa: 'Dengue fever', tingkatBahaya: 'tinggi' },
    {
      icd10Code: 'A91',
      diagnosa: 'Dengue haemorrhagic fever',
      tingkatBahaya: 'tinggi'
    },
    { icd10Code: 'B20', diagnosa: 'HIV/AIDS', tingkatBahaya: 'tinggi' },

    // Tingkat Bahaya SEDANG
    {
      icd10Code: 'A01.1',
      diagnosa: 'Paratyphoid fever A',
      tingkatBahaya: 'sedang'
    },
    {
      icd10Code: 'A01.4',
      diagnosa: 'Paratyphoid fever unspecified',
      tingkatBahaya: 'sedang'
    },
    { icd10Code: 'J06', diagnosa: 'ISPA', tingkatBahaya: 'sedang' },
    { icd10Code: 'J18', diagnosa: 'Pneumonia', tingkatBahaya: 'sedang' },
    { icd10Code: 'K29', diagnosa: 'Gastritis', tingkatBahaya: 'sedang' },
    { icd10Code: 'I10', diagnosa: 'Hipertensi', tingkatBahaya: 'sedang' },
    {
      icd10Code: 'E11',
      diagnosa: 'Diabetes mellitus tipe 2',
      tingkatBahaya: 'sedang'
    },
    {
      icd10Code: 'N39.0',
      diagnosa: 'Infeksi saluran kemih',
      tingkatBahaya: 'sedang'
    },

    // Tingkat Bahaya RENDAH
    { icd10Code: 'J00', diagnosa: 'Common cold', tingkatBahaya: 'rendah' },
    {
      icd10Code: 'R50',
      diagnosa: 'Demam tidak spesifik',
      tingkatBahaya: 'rendah'
    },
    { icd10Code: 'R51', diagnosa: 'Sakit kepala', tingkatBahaya: 'rendah' },
    { icd10Code: 'K59.0', diagnosa: 'Konstipasi', tingkatBahaya: 'rendah' },
    {
      icd10Code: 'L30',
      diagnosa: 'Dermatitis lainnya',
      tingkatBahaya: 'rendah'
    },
    { icd10Code: 'M54', diagnosa: 'Nyeri punggung', tingkatBahaya: 'rendah' },
    { icd10Code: 'R10', diagnosa: 'Nyeri perut', tingkatBahaya: 'rendah' }
  ];

  // Seed 30 days of diagnosa harian data
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const tanggal = new Date();
    tanggal.setDate(tanggal.getDate() - dayOffset);
    tanggal.setHours(0, 0, 0, 0);

    for (const pkm of puskesmasList.slice(0, 15)) {
      // Sample 15 puskesmas
      // Pick random diagnoses for this day
      const numDiagnoses = randInt(5, 12);
      const shuffled = [...diagnosaSeverity].sort(() => Math.random() - 0.5);
      const selectedDiagnoses = shuffled.slice(0, numDiagnoses);

      for (const diag of selectedDiagnoses) {
        // Higher severity = lower frequency, but more concerning
        let baseCount = 0;
        switch (diag.tingkatBahaya) {
          case 'tinggi':
            baseCount = randInt(1, 5);
            break;
          case 'sedang':
            baseCount = randInt(5, 20);
            break;
          case 'rendah':
            baseCount = randInt(10, 40);
            break;
        }

        await prisma.diagnosaHarian.create({
          data: {
            puskesmasId: pkm.id,
            icd10Code: diag.icd10Code,
            diagnosa: diag.diagnosa,
            jumlahKasus: baseCount,
            tingkatBahaya: diag.tingkatBahaya,
            tanggal: tanggal
          }
        });
      }
    }
  }

  console.log('✅ Klaster 4 Diagnosa Harian seeded');

  // ============================================
  // 4. LINTAS KLASTER: TRIASE, FARMASI, LAB, RAWAT INAP
  // ============================================
  console.log('🏥 Seeding Lintas Klaster data...');

  // Get rawat inap puskesmas (have bed capacity)
  const rawatInapPuskesmas = puskesmasList.filter(
    (p) => p.jenis === 'rawat_inap'
  );

  // Seed 30 days of daily data
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const tanggal = new Date();
    tanggal.setDate(tanggal.getDate() - dayOffset);
    tanggal.setHours(0, 0, 0, 0);

    for (const pkm of puskesmasList) {
      // GawatDarurat (Triase) - daily data
      const triaseMerah = randInt(0, 3);
      const triaseKuning = randInt(2, 10);
      const triaseHijau = randInt(10, 40);

      await prisma.gawatDarurat.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: tanggal
          }
        },
        update: { triaseMerah, triaseKuning, triaseHijau },
        create: {
          puskesmasId: pkm.id,
          triaseMerah,
          triaseKuning,
          triaseHijau,
          tanggal
        }
      });

      // Farmasi - daily dispensing data
      const jumlahResep = randInt(50, 150);
      const obatKeluar = jumlahResep * randInt(2, 4);
      const racikan = randInt(5, 20);

      await prisma.farmasi.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: tanggal
          }
        },
        update: { jumlahResep, obatKeluar, racikan },
        create: {
          puskesmasId: pkm.id,
          jumlahResep,
          obatKeluar,
          racikan,
          tanggal
        }
      });

      // Laboratorium - daily tests
      const hematologi = randInt(10, 30);
      const kimiaKlinik = randInt(5, 20);
      const urinalisis = randInt(5, 15);
      const jumlahPemeriksaan = hematologi + kimiaKlinik + urinalisis;

      await prisma.laboratorium.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: tanggal
          }
        },
        update: { jumlahPemeriksaan, hematologi, kimiaKlinik, urinalisis },
        create: {
          puskesmasId: pkm.id,
          jumlahPemeriksaan,
          hematologi,
          kimiaKlinik,
          urinalisis,
          tanggal
        }
      });
    }

    // RawatInap - only for rawat inap puskesmas
    for (const pkm of rawatInapPuskesmas) {
      const bedTotal = randInt(10, 20);
      const bedTerisi = randInt(3, bedTotal - 2);
      const pasienMasuk = randInt(0, 4);
      const pasienKeluar = randInt(0, 3);

      await prisma.rawatInap.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: tanggal
          }
        },
        update: { pasienMasuk, pasienKeluar, bedTerisi, bedTotal },
        create: {
          puskesmasId: pkm.id,
          pasienMasuk,
          pasienKeluar,
          bedTerisi,
          bedTotal,
          tanggal
        }
      });
    }
  }

  console.log('✅ Lintas Klaster data seeded');

  // ============================================
  // 5. TOP DIAGNOSA - Update with A00/A01 data
  // ============================================
  console.log('📈 Updating Top Diagnosa with A00/A01...');

  const topDiagnosaList = [
    { icd10Code: 'J06', diagnosa: 'ISPA', baseJumlah: 800 },
    { icd10Code: 'I10', diagnosa: 'Hipertensi esensial', baseJumlah: 600 },
    { icd10Code: 'K29', diagnosa: 'Gastritis', baseJumlah: 400 },
    { icd10Code: 'E11', diagnosa: 'Diabetes mellitus tipe 2', baseJumlah: 350 },
    { icd10Code: 'A01.0', diagnosa: 'Typhoid fever', baseJumlah: 120 },
    { icd10Code: 'A00', diagnosa: 'Cholera', baseJumlah: 25 },
    { icd10Code: 'A01.1', diagnosa: 'Paratyphoid fever A', baseJumlah: 45 },
    { icd10Code: 'J18', diagnosa: 'Pneumonia', baseJumlah: 200 },
    { icd10Code: 'N39.0', diagnosa: 'Infeksi saluran kemih', baseJumlah: 150 },
    { icd10Code: 'L30', diagnosa: 'Dermatitis', baseJumlah: 180 }
  ];

  for (const pkm of puskesmasList) {
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const month = currentMonth - monthOffset;
      const year = month <= 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month <= 0 ? 12 + month : month;

      for (const diag of topDiagnosaList) {
        const jumlahKasus = Math.round(
          (diag.baseJumlah * randFloat(0.7, 1.3)) / puskesmasList.length
        );

        await prisma.topDiagnosa.upsert({
          where: {
            puskesmasId_icd10Code_bulan_tahun: {
              puskesmasId: pkm.id,
              icd10Code: diag.icd10Code,
              bulan: adjustedMonth,
              tahun: year
            }
          },
          update: { jumlahKasus },
          create: {
            puskesmasId: pkm.id,
            icd10Code: diag.icd10Code,
            diagnosa: diag.diagnosa,
            jumlahKasus,
            bulan: adjustedMonth,
            tahun: year
          }
        });
      }
    }
  }

  console.log('✅ Top Diagnosa updated');

  // ============================================
  // 6. HEATMAP DATA - Kunjungan per Desa
  // ============================================
  console.log('🗺️ Seeding heatmap data (Kunjungan per desa)...');

  const desaList = [
    'Brebes',
    'Losari',
    'Tanjung',
    'Bulakamba',
    'Wanasari',
    'Songgom',
    'Jatibarang',
    'Brebes Kulon',
    'Pasarbatang',
    'Limbangan',
    'Pemaron',
    'Gandasuli',
    'Kaligangsa',
    'Randusanga Kulon',
    'Randusanga Wetan',
    'Kaliwlingi',
    'Sawojajar',
    'Tengki',
    'Klampok',
    'Kedunguter'
  ];

  // Seed kunjungan data for heatmap
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const tanggal = new Date();
    tanggal.setDate(tanggal.getDate() - dayOffset);
    tanggal.setHours(randInt(7, 17), randInt(0, 59), 0, 0);

    for (const pkm of puskesmasList.slice(0, 10)) {
      const numKunjungan = randInt(20, 60);

      for (let i = 0; i < numKunjungan; i++) {
        const desa = desaList[randInt(0, desaList.length - 1)];
        const gender = Math.random() > 0.5 ? 'L' : 'P';
        const umur = randInt(1, 85);
        const diagnosa =
          topDiagnosaList[randInt(0, topDiagnosaList.length - 1)];

        await prisma.kunjungan.create({
          data: {
            puskesmasId: pkm.id,
            jenisLayanan: ['Rawat Jalan', 'UGD', 'Poli Umum', 'Poli Gigi'][
              randInt(0, 3)
            ],
            pasienNama: `Pasien ${randInt(1000, 9999)}`,
            pasienUmur: umur,
            pasienGender: gender,
            pasienDesa: desa,
            icd10Code: diagnosa.icd10Code,
            diagnosa: diagnosa.diagnosa,
            tanggal
          }
        });
      }
    }
  }

  console.log('✅ Heatmap kunjungan data seeded');

  // ============================================
  // 7. TOP KELUHAN - Seed for monitoring page
  // ============================================
  console.log('💬 Seeding Top Keluhan...');

  const keluhanList = [
    { keluhan: 'Demam', baseJumlah: 900 },
    { keluhan: 'Batuk', baseJumlah: 850 },
    { keluhan: 'Pilek', baseJumlah: 780 },
    { keluhan: 'Sakit Kepala', baseJumlah: 650 },
    { keluhan: 'Nyeri Perut', baseJumlah: 520 },
    { keluhan: 'Mual', baseJumlah: 430 },
    { keluhan: 'Diare', baseJumlah: 380 },
    { keluhan: 'Pusing', baseJumlah: 350 },
    { keluhan: 'Nyeri Sendi', baseJumlah: 280 },
    { keluhan: 'Sesak Napas', baseJumlah: 220 },
    { keluhan: 'Lemas', baseJumlah: 190 },
    { keluhan: 'Gatal-gatal', baseJumlah: 150 }
  ];

  for (const pkm of puskesmasList) {
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const month = currentMonth - monthOffset;
      const year = month <= 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month <= 0 ? 12 + month : month;

      for (const kel of keluhanList) {
        const jumlahKasus = Math.round(
          (kel.baseJumlah * randFloat(0.7, 1.3)) / puskesmasList.length
        );

        await prisma.topKeluhan.upsert({
          where: {
            puskesmasId_keluhan_bulan_tahun: {
              puskesmasId: pkm.id,
              keluhan: kel.keluhan,
              bulan: adjustedMonth,
              tahun: year
            }
          },
          update: { jumlahKasus },
          create: {
            puskesmasId: pkm.id,
            keluhan: kel.keluhan,
            jumlahKasus,
            bulan: adjustedMonth,
            tahun: year
          }
        });
      }
    }
  }

  console.log('✅ Top Keluhan seeded');

  // ============================================
  // 8. TOP OBAT - Seed for monitoring page
  // ============================================
  console.log('💊 Seeding Top Obat...');

  const obatList = [
    { namaObat: 'Paracetamol', baseJumlah: 1200 },
    { namaObat: 'Amoxicillin', baseJumlah: 850 },
    { namaObat: 'Antasida', baseJumlah: 720 },
    { namaObat: 'Omeprazole', baseJumlah: 650 },
    { namaObat: 'Metformin', baseJumlah: 580 },
    { namaObat: 'Amlodipine', baseJumlah: 530 },
    { namaObat: 'Cetirizine', baseJumlah: 480 },
    { namaObat: 'Ibuprofen', baseJumlah: 420 },
    { namaObat: 'Vitamin C', baseJumlah: 380 },
    { namaObat: 'ORS (Oralit)', baseJumlah: 320 },
    { namaObat: 'Salbutamol', baseJumlah: 280 },
    { namaObat: 'Dexamethasone', baseJumlah: 250 }
  ];

  for (const pkm of puskesmasList) {
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const month = currentMonth - monthOffset;
      const year = month <= 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month <= 0 ? 12 + month : month;

      for (const obat of obatList) {
        const jumlahResep = Math.round(
          (obat.baseJumlah * randFloat(0.7, 1.3)) / puskesmasList.length
        );

        await prisma.topObat.upsert({
          where: {
            puskesmasId_namaObat_bulan_tahun: {
              puskesmasId: pkm.id,
              namaObat: obat.namaObat,
              bulan: adjustedMonth,
              tahun: year
            }
          },
          update: { jumlahResep },
          create: {
            puskesmasId: pkm.id,
            namaObat: obat.namaObat,
            jumlahResep,
            bulan: adjustedMonth,
            tahun: year
          }
        });
      }
    }
  }

  console.log('✅ Top Obat seeded');

  console.log('');
  console.log('🎉 Comprehensive EIS data seeding complete!');
  console.log('');
}

// Run the seeder
seedComprehensiveData()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
