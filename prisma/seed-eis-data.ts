import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate random integer between min and max
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate random date in the past N days
const randDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - randInt(0, daysAgo));
  date.setHours(0, 0, 0, 0);
  return date;
};

async function seedEisData() {
  console.log('🌱 Seeding EIS data...');

  // Get all puskesmas
  const puskesmasList = await prisma.puskesmas.findMany();

  if (puskesmasList.length === 0) {
    console.log('⚠️ No puskesmas found. Run main seed first.');
    return;
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // ============================================
  // KLASTER 1: SDM, OBAT, KEUANGAN
  // ============================================
  console.log('📊 Seeding Klaster 1 data...');

  // Tenaga Kesehatan
  const kategoriNakes = [
    { nama: 'Dokter Umum', target: 3 },
    { nama: 'Dokter Gigi', target: 2 },
    { nama: 'Bidan', target: 5 },
    { nama: 'Perawat', target: 8 },
    { nama: 'Apoteker', target: 1 },
    { nama: 'Analis Lab', target: 2 }
  ];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const kat of kategoriNakes) {
        await prisma.tenagaKesehatan.upsert({
          where: {
            puskesmasId_kategori_bulan_tahun: {
              puskesmasId: pkm.id,
              kategori: kat.nama,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            kategori: kat.nama,
            jumlah: randInt(Math.floor(kat.target * 0.7), kat.target + 1),
            target: kat.target,
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // Stok Obat
  const daftarObat = [
    { nama: 'Paracetamol 500mg', satuan: 'tablet' },
    { nama: 'Amoxicillin 500mg', satuan: 'kapsul' },
    { nama: 'OBH Combi', satuan: 'botol' },
    { nama: 'Antasida', satuan: 'tablet' },
    { nama: 'Vitamin C', satuan: 'tablet' },
    { nama: 'Salbutamol', satuan: 'tablet' },
    { nama: 'Metformin 500mg', satuan: 'tablet' },
    { nama: 'Amlodipine 5mg', satuan: 'tablet' },
    { nama: 'Captopril 25mg', satuan: 'tablet' },
    { nama: 'Omeprazole 20mg', satuan: 'kapsul' }
  ];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const obat of daftarObat) {
        const stok = randInt(500, 2000);
        await prisma.stokObat.upsert({
          where: {
            puskesmasId_namaObat_bulan_tahun: {
              puskesmasId: pkm.id,
              namaObat: obat.nama,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            namaObat: obat.nama,
            satuan: obat.satuan,
            stok: stok,
            pemakaian: randInt(Math.floor(stok * 0.4), Math.floor(stok * 0.8)),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // Keuangan
  const kategoriKeuangan = ['Pendapatan JKN', 'Pendapatan Umum', 'BLUD', 'DAK'];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const kat of kategoriKeuangan) {
        let nominal = 0;
        switch (kat) {
          case 'Pendapatan JKN':
            nominal = randInt(50000000, 150000000);
            break;
          case 'Pendapatan Umum':
            nominal = randInt(5000000, 20000000);
            break;
          case 'BLUD':
            nominal = randInt(20000000, 50000000);
            break;
          case 'DAK':
            nominal = randInt(30000000, 80000000);
            break;
        }

        await prisma.keuangan.upsert({
          where: {
            puskesmasId_kategori_bulan_tahun: {
              puskesmasId: pkm.id,
              kategori: kat,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            kategori: kat,
            nominal: nominal,
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // ============================================
  // KLASTER 2: IBU DAN ANAK
  // ============================================
  console.log('👶 Seeding Klaster 2 data...');

  // Antenatal Care
  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      const target = randInt(20, 40);
      const k1 = randInt(Math.floor(target * 0.8), target);
      await prisma.antenatalCare.upsert({
        where: {
          puskesmasId_bulan_tahun: {
            puskesmasId: pkm.id,
            bulan: month,
            tahun: currentYear
          }
        },
        update: {},
        create: {
          puskesmasId: pkm.id,
          k1: k1,
          k4: randInt(Math.floor(k1 * 0.7), k1),
          target: target,
          bulan: month,
          tahun: currentYear
        }
      });
    }
  }

  // Imunisasi Bayi
  const imunisasiBayi = [
    'HB-0',
    'BCG',
    'Polio 1',
    'Polio 2',
    'Polio 3',
    'DPT-HB-Hib 1',
    'DPT-HB-Hib 2',
    'DPT-HB-Hib 3',
    'Campak Rubella'
  ];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const jenis of imunisasiBayi) {
        const sasaran = randInt(30, 60);
        await prisma.imunisasi.upsert({
          where: {
            puskesmasId_jenisImunisasi_bulan_tahun: {
              puskesmasId: pkm.id,
              jenisImunisasi: jenis,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            jenisImunisasi: jenis,
            kategori: 'bayi',
            sasaran: sasaran,
            capaian: randInt(Math.floor(sasaran * 0.75), sasaran),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // Imunisasi Baduta
  const imunisasiBaduta = ['DPT-HB-Hib Lanjutan', 'Campak Rubella Lanjutan'];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const jenis of imunisasiBaduta) {
        const sasaran = randInt(25, 50);
        await prisma.imunisasi.upsert({
          where: {
            puskesmasId_jenisImunisasi_bulan_tahun: {
              puskesmasId: pkm.id,
              jenisImunisasi: jenis,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            jenisImunisasi: jenis,
            kategori: 'baduta',
            sasaran: sasaran,
            capaian: randInt(Math.floor(sasaran * 0.8), sasaran),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // BIAS (Bulan Imunisasi Anak Sekolah)
  const biasTypes = [
    'Campak Rubella Kelas 1',
    'DT Kelas 1',
    'Td Kelas 2',
    'Td Kelas 5'
  ];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const jenis of biasTypes) {
        const sasaran = randInt(100, 200);
        await prisma.imunisasi.upsert({
          where: {
            puskesmasId_jenisImunisasi_bulan_tahun: {
              puskesmasId: pkm.id,
              jenisImunisasi: jenis,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            jenisImunisasi: jenis,
            kategori: 'bias',
            sasaran: sasaran,
            capaian: randInt(Math.floor(sasaran * 0.85), sasaran),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // ============================================
  // KLASTER 3: DETEKSI DINI & PTM
  // ============================================
  console.log('🔬 Seeding Klaster 3 data...');

  // Deteksi Dini
  const jenisDeteksi = [
    { nama: 'Kanker Serviks (IVA)', sasaran: 500 },
    { nama: 'Kanker Payudara (SADANIS)', sasaran: 500 },
    { nama: 'Tuberculosis', sasaran: 200 },
    { nama: 'Hipertensi', sasaran: 800 },
    { nama: 'Diabetes Mellitus', sasaran: 600 },
    { nama: 'Gangguan Jiwa', sasaran: 100 }
  ];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const jenis of jenisDeteksi) {
        const sasaran = Math.floor(jenis.sasaran / 12);
        await prisma.deteksiDini.upsert({
          where: {
            puskesmasId_jenis_bulan_tahun: {
              puskesmasId: pkm.id,
              jenis: jenis.nama,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            jenis: jenis.nama,
            sasaran: sasaran,
            capaian: randInt(Math.floor(sasaran * 0.5), sasaran),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // Faktor Risiko
  const faktorRisikoList = [
    'Hipertensi',
    'Diabetes',
    'Obesitas',
    'Merokok',
    'Kurang Aktivitas Fisik'
  ];
  const kelompokUmur = ['15-24', '25-44', '45-59', '60+'];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const faktor of faktorRisikoList) {
        for (const umur of kelompokUmur) {
          await prisma.faktorRisiko.upsert({
            where: {
              puskesmasId_faktor_kelompokUmur_bulan_tahun: {
                puskesmasId: pkm.id,
                faktor: faktor,
                kelompokUmur: umur,
                bulan: month,
                tahun: currentYear
              }
            },
            update: {},
            create: {
              puskesmasId: pkm.id,
              faktor: faktor,
              jumlahKasus: randInt(5, 50),
              kelompokUmur: umur,
              bulan: month,
              tahun: currentYear
            }
          });
        }
      }
    }
  }

  // Pemeriksaan Gigi
  const kategoriGigi = ['SD/MI', 'SMP/MTs', 'SMA/SMK'];

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      for (const kat of kategoriGigi) {
        const sasaran = randInt(200, 500);
        const diperiksa = randInt(Math.floor(sasaran * 0.6), sasaran);
        await prisma.pemeriksaanGigi.upsert({
          where: {
            puskesmasId_kategori_bulan_tahun: {
              puskesmasId: pkm.id,
              kategori: kat,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            kategori: kat,
            sasaran: sasaran,
            diperiksa: diperiksa,
            perluPerawatan: randInt(
              Math.floor(diperiksa * 0.2),
              Math.floor(diperiksa * 0.4)
            ),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // ============================================
  // KLASTER 4: PERINGATAN DIAGNOSA
  // ============================================
  console.log('⚠️ Seeding Klaster 4 data...');

  const diagnosaList = [
    { icd10: 'J06.9', nama: 'ISPA', bahaya: 'rendah' },
    { icd10: 'I10', nama: 'Hipertensi', bahaya: 'sedang' },
    { icd10: 'E11.9', nama: 'Diabetes Mellitus', bahaya: 'sedang' },
    { icd10: 'K29.7', nama: 'Gastritis', bahaya: 'rendah' },
    { icd10: 'A09', nama: 'Diare', bahaya: 'rendah' },
    { icd10: 'L30.9', nama: 'Dermatitis', bahaya: 'rendah' },
    { icd10: 'M13.9', nama: 'Artritis', bahaya: 'rendah' },
    { icd10: 'J02.9', nama: 'Faringitis', bahaya: 'rendah' },
    { icd10: 'M79.1', nama: 'Myalgia', bahaya: 'rendah' },
    { icd10: 'R51', nama: 'Cephalgia', bahaya: 'rendah' },
    { icd10: 'A15', nama: 'Tuberkulosis Paru', bahaya: 'tinggi' },
    { icd10: 'A90', nama: 'Demam Berdarah Dengue', bahaya: 'tinggi' },
    { icd10: 'B20', nama: 'HIV/AIDS', bahaya: 'tinggi' },
    { icd10: 'A01.0', nama: 'Demam Tifoid', bahaya: 'sedang' },
    { icd10: 'B50', nama: 'Malaria', bahaya: 'tinggi' }
  ];

  for (const pkm of puskesmasList) {
    // Generate data for last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      for (const diagnosa of diagnosaList) {
        // Random chance to have cases each day
        if (Math.random() > 0.3) {
          await prisma.diagnosaHarian.create({
            data: {
              puskesmasId: pkm.id,
              icd10Code: diagnosa.icd10,
              diagnosa: diagnosa.nama,
              jumlahKasus: randInt(1, diagnosa.bahaya === 'tinggi' ? 5 : 20),
              tingkatBahaya: diagnosa.bahaya,
              tanggal: date
            }
          });
        }
      }
    }
  }

  // ============================================
  // LINTAS KLASTER
  // ============================================
  console.log('🏥 Seeding Lintas Klaster data...');

  // Gawat Darurat, Farmasi, Laboratorium, Rawat Inap (30 hari terakhir)
  for (const pkm of puskesmasList) {
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Gawat Darurat
      await prisma.gawatDarurat.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: date
          }
        },
        update: {},
        create: {
          puskesmasId: pkm.id,
          triaseMerah: randInt(0, 5),
          triaseKuning: randInt(5, 20),
          triaseHijau: randInt(10, 40),
          tanggal: date
        }
      });

      // Farmasi
      const resep = randInt(50, 150);
      await prisma.farmasi.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: date
          }
        },
        update: {},
        create: {
          puskesmasId: pkm.id,
          jumlahResep: resep,
          obatKeluar: randInt(resep * 3, resep * 6),
          racikan: randInt(5, 30),
          tanggal: date
        }
      });

      // Laboratorium
      const pemeriksaan = randInt(20, 80);
      await prisma.laboratorium.upsert({
        where: {
          puskesmasId_tanggal: {
            puskesmasId: pkm.id,
            tanggal: date
          }
        },
        update: {},
        create: {
          puskesmasId: pkm.id,
          jumlahPemeriksaan: pemeriksaan,
          hematologi: randInt(
            Math.floor(pemeriksaan * 0.3),
            Math.floor(pemeriksaan * 0.5)
          ),
          kimiaKlinik: randInt(
            Math.floor(pemeriksaan * 0.2),
            Math.floor(pemeriksaan * 0.4)
          ),
          urinalisis: randInt(
            Math.floor(pemeriksaan * 0.1),
            Math.floor(pemeriksaan * 0.3)
          ),
          tanggal: date
        }
      });

      // Rawat Inap (only for rawat_inap type puskesmas)
      if (pkm.jenis === 'rawat_inap') {
        const bedTotal = 20;
        await prisma.rawatInap.upsert({
          where: {
            puskesmasId_tanggal: {
              puskesmasId: pkm.id,
              tanggal: date
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            pasienMasuk: randInt(1, 5),
            pasienKeluar: randInt(1, 5),
            bedTerisi: randInt(5, 15),
            bedTotal: bedTotal,
            tanggal: date
          }
        });
      }
    }
  }

  // ============================================
  // MONITORING: KUNJUNGAN
  // ============================================
  console.log('📈 Seeding Kunjungan data...');

  const namaLaki = [
    'Slamet',
    'Sudirman',
    'Bambang',
    'Agus',
    'Budi',
    'Darto',
    'Eko',
    'Faisal',
    'Gunawan',
    'Hendra',
    'Iwan',
    'Joko',
    'Karno',
    'Lukman',
    'Mahmud',
    'Nasir',
    'Oki',
    'Paijo',
    'Rudi',
    'Samsul',
    'Tono',
    'Udin',
    'Wahyu',
    'Yanto',
    'Zainal'
  ];
  const namaPerempuan = [
    'Siti',
    'Wartini',
    'Sumiati',
    'Endang',
    'Dewi',
    'Fatimah',
    'Giyem',
    'Hartini',
    'Ijah',
    'Jumiah',
    'Kartini',
    'Lasmi',
    'Maryam',
    'Ngatiyem',
    'Oneng',
    'Pariyem',
    'Ratna',
    'Sulastri',
    'Tumini',
    'Umi',
    'Waginah',
    'Yati',
    'Zainab',
    'Sri',
    'Ani'
  ];
  const margaJawa = [
    'Sutrisno',
    'Widodo',
    'Hartono',
    'Prasetyo',
    'Wibowo',
    'Santoso',
    'Hidayat',
    'Kusuma',
    'Saputra',
    'Nugroho'
  ];
  const desaList = [
    'Brebes',
    'Gandasuli',
    'Pasarbatang',
    'Limbangan Kulon',
    'Kaligangsa',
    'Wanasari',
    'Bulakamba',
    'Tanjung',
    'Ketanggungan',
    'Kersana',
    'Losari',
    'Jatibarang',
    'Songgom',
    'Larangan',
    'Tonjong'
  ];
  const jenisLayananList = [
    'Rawat Jalan',
    'UGD',
    'KIA',
    'Gigi',
    'Laboratorium'
  ];
  const keluhanList = [
    'Demam',
    'Batuk',
    'Pilek',
    'Sakit kepala',
    'Mual',
    'Muntah',
    'Diare',
    'Nyeri perut',
    'Pusing',
    'Lemas',
    'Sesak napas',
    'Nyeri dada',
    'Gatal-gatal',
    'Nyeri sendi',
    'Sakit gigi',
    'Mata merah',
    'Telinga sakit',
    'Nyeri punggung'
  ];

  // Generate 2000 kunjungan data
  for (let i = 0; i < 2000; i++) {
    const gender = Math.random() > 0.5 ? 'L' : 'P';
    const namaDepan =
      gender === 'L'
        ? namaLaki[randInt(0, namaLaki.length - 1)]
        : namaPerempuan[randInt(0, namaPerempuan.length - 1)];
    const marga = margaJawa[randInt(0, margaJawa.length - 1)];
    const pkm = puskesmasList[randInt(0, puskesmasList.length - 1)];
    const diagnosa = diagnosaList[randInt(0, diagnosaList.length - 1)];
    const keluhan = keluhanList[randInt(0, keluhanList.length - 1)];
    const obat = daftarObat[randInt(0, daftarObat.length - 1)];

    await prisma.kunjungan.create({
      data: {
        puskesmasId: pkm.id,
        jenisLayanan: jenisLayananList[randInt(0, jenisLayananList.length - 1)],
        pasienNama: `${namaDepan} ${marga.charAt(0)}***`,
        pasienUmur: randInt(1, 85),
        pasienGender: gender,
        pasienDesa: desaList[randInt(0, desaList.length - 1)],
        icd10Code: diagnosa.icd10,
        diagnosa: diagnosa.nama,
        keluhan: keluhan,
        obat: obat.nama,
        tanggal: randDate(60)
      }
    });
  }

  // ============================================
  // TOP DIAGNOSA, KELUHAN, OBAT
  // ============================================
  console.log('📊 Seeding Top statistics...');

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      // Top Diagnosa
      for (const diagnosa of diagnosaList.slice(0, 10)) {
        await prisma.topDiagnosa.upsert({
          where: {
            puskesmasId_icd10Code_bulan_tahun: {
              puskesmasId: pkm.id,
              icd10Code: diagnosa.icd10,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            icd10Code: diagnosa.icd10,
            diagnosa: diagnosa.nama,
            jumlahKasus: randInt(50, 300),
            bulan: month,
            tahun: currentYear
          }
        });
      }

      // Top Keluhan
      for (const keluhan of keluhanList.slice(0, 10)) {
        await prisma.topKeluhan.upsert({
          where: {
            puskesmasId_keluhan_bulan_tahun: {
              puskesmasId: pkm.id,
              keluhan: keluhan,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            keluhan: keluhan,
            jumlahKasus: randInt(30, 200),
            bulan: month,
            tahun: currentYear
          }
        });
      }

      // Top Obat
      for (const obat of daftarObat) {
        await prisma.topObat.upsert({
          where: {
            puskesmasId_namaObat_bulan_tahun: {
              puskesmasId: pkm.id,
              namaObat: obat.nama,
              bulan: month,
              tahun: currentYear
            }
          },
          update: {},
          create: {
            puskesmasId: pkm.id,
            namaObat: obat.nama,
            jumlahResep: randInt(100, 500),
            bulan: month,
            tahun: currentYear
          }
        });
      }
    }
  }

  // ============================================
  // OVERVIEW SUMMARY
  // ============================================
  console.log('📈 Seeding Overview Summary...');

  for (const pkm of puskesmasList) {
    for (let month = 1; month <= currentMonth; month++) {
      const totalKunjungan = randInt(800, 2000);
      const kunjunganBaru = randInt(
        Math.floor(totalKunjungan * 0.3),
        Math.floor(totalKunjungan * 0.5)
      );
      const pasienBpjs = randInt(
        Math.floor(totalKunjungan * 0.6),
        Math.floor(totalKunjungan * 0.8)
      );

      await prisma.overviewSummary.upsert({
        where: {
          puskesmasId_bulan_tahun: {
            puskesmasId: pkm.id,
            bulan: month,
            tahun: currentYear
          }
        },
        update: {},
        create: {
          puskesmasId: pkm.id,
          totalKunjungan: totalKunjungan,
          kunjunganBaru: kunjunganBaru,
          kunjunganLama: totalKunjungan - kunjunganBaru,
          pasienBpjs: pasienBpjs,
          pasienUmum: totalKunjungan - pasienBpjs,
          bulan: month,
          tahun: currentYear
        }
      });
    }
  }

  console.log('✅ EIS data seeding completed!');
}

export default seedEisData;
