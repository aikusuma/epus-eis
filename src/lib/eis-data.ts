import { unstable_cache } from 'next/cache';
import db from './db';

// Alias for easier usage
const prisma = db;

// Cache tags for revalidation
export const CACHE_TAGS = {
  klaster1: 'klaster1',
  klaster2: 'klaster2',
  klaster3: 'klaster3',
  klaster4: 'klaster4',
  lintasKlaster: 'lintas-klaster',
  monitoring: 'monitoring',
  overview: 'overview',
  puskesmas: 'puskesmas'
};

// Cache duration in seconds
export const CACHE_DURATION = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  day: 86400 // 24 hours
};

// ============================================
// KLASTER 1: SDM, OBAT, KEUANGAN
// ============================================

export const getTenagaKesehatan = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.tenagaKesehatan.groupBy({
      by: ['kategori'],
      where,
      _sum: {
        jumlah: true,
        target: true
      }
    });

    return data.map((item: any) => ({
      kategori: item.kategori,
      jumlah: item._sum.jumlah || 0,
      target: item._sum.target || 0
    }));
  },
  ['tenaga-kesehatan'],
  { tags: [CACHE_TAGS.klaster1], revalidate: CACHE_DURATION.medium }
);

export const getTenagaKesehatanTrend = unstable_cache(
  async (puskesmasId?: string, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();

    const where = {
      tahun: currentYear,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.tenagaKesehatan.groupBy({
      by: ['bulan', 'kategori'],
      where,
      _sum: {
        jumlah: true
      },
      orderBy: { bulan: 'asc' }
    });

    // Transform to chart format
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des'
    ];
    const result: Record<string, Record<string, string | number>> = {};

    data.forEach((item: any) => {
      const monthName = months[item.bulan - 1];
      if (!result[monthName]) {
        result[monthName] = { bulan: monthName };
      }
      result[monthName][item.kategori.toLowerCase().replace(/ /g, '_')] =
        item._sum.jumlah || 0;
    });

    return Object.values(result);
  },
  ['tenaga-kesehatan-trend'],
  { tags: [CACHE_TAGS.klaster1], revalidate: CACHE_DURATION.medium }
);

export const getStokObat = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.stokObat.groupBy({
      by: ['namaObat', 'satuan'],
      where,
      _sum: {
        stok: true,
        pemakaian: true
      }
    });

    return data.map((item: any) => ({
      nama: item.namaObat,
      satuan: item.satuan,
      stok: item._sum.stok || 0,
      pemakaian: item._sum.pemakaian || 0
    }));
  },
  ['stok-obat'],
  { tags: [CACHE_TAGS.klaster1], revalidate: CACHE_DURATION.medium }
);

export const getKeuangan = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.keuangan.groupBy({
      by: ['kategori'],
      where,
      _sum: {
        nominal: true
      }
    });

    return data.map((item: any) => ({
      kategori: item.kategori,
      nominal: item._sum.nominal || 0
    }));
  },
  ['keuangan'],
  { tags: [CACHE_TAGS.klaster1], revalidate: CACHE_DURATION.medium }
);

export const getKeuanganTrend = unstable_cache(
  async (puskesmasId?: string, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();

    const where = {
      tahun: currentYear,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.keuangan.groupBy({
      by: ['bulan'],
      where,
      _sum: {
        nominal: true
      },
      orderBy: { bulan: 'asc' }
    });

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des'
    ];

    return data.map((item: any) => ({
      bulan: months[item.bulan - 1],
      pendapatan: Math.round((item._sum.nominal || 0) / 1000000) // dalam juta
    }));
  },
  ['keuangan-trend'],
  { tags: [CACHE_TAGS.klaster1], revalidate: CACHE_DURATION.medium }
);

// ============================================
// KLASTER 2: IBU DAN ANAK
// ============================================

export const getAntenatalCare = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.antenatalCare.aggregate({
      where,
      _sum: {
        k1: true,
        k4: true,
        target: true
      }
    });

    return {
      k1: data._sum.k1 || 0,
      k4: data._sum.k4 || 0,
      target: data._sum.target || 0
    };
  },
  ['antenatal-care'],
  { tags: [CACHE_TAGS.klaster2], revalidate: CACHE_DURATION.medium }
);

export const getAntenatalCareTrend = unstable_cache(
  async (puskesmasId?: string, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();

    const where = {
      tahun: currentYear,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.antenatalCare.groupBy({
      by: ['bulan'],
      where,
      _sum: {
        k1: true,
        k4: true
      },
      orderBy: { bulan: 'asc' }
    });

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des'
    ];

    return data.map((item: any) => ({
      bulan: months[item.bulan - 1],
      k1: item._sum.k1 || 0,
      k4: item._sum.k4 || 0
    }));
  },
  ['antenatal-care-trend'],
  { tags: [CACHE_TAGS.klaster2], revalidate: CACHE_DURATION.medium }
);

export const getImunisasi = unstable_cache(
  async (
    kategori: string,
    puskesmasId?: string,
    bulan?: number,
    tahun?: number
  ) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      kategori,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.imunisasi.groupBy({
      by: ['jenisImunisasi'],
      where,
      _sum: {
        sasaran: true,
        capaian: true
      }
    });

    return data.map((item: any) => ({
      jenis: item.jenisImunisasi,
      sasaran: item._sum.sasaran || 0,
      capaian: item._sum.capaian || 0
    }));
  },
  ['imunisasi'],
  { tags: [CACHE_TAGS.klaster2], revalidate: CACHE_DURATION.medium }
);

// ============================================
// KLASTER 3: DETEKSI DINI & PTM
// ============================================

export const getDeteksiDini = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.deteksiDini.groupBy({
      by: ['jenis'],
      where,
      _sum: {
        sasaran: true,
        capaian: true
      }
    });

    return data.map((item: any) => ({
      jenis: item.jenis,
      sasaran: item._sum.sasaran || 0,
      capaian: item._sum.capaian || 0
    }));
  },
  ['deteksi-dini'],
  { tags: [CACHE_TAGS.klaster3], revalidate: CACHE_DURATION.medium }
);

export const getFaktorRisiko = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.faktorRisiko.groupBy({
      by: ['faktor', 'kelompokUmur'],
      where,
      _sum: {
        jumlahKasus: true
      }
    });

    return data.map((item: any) => ({
      faktor: item.faktor,
      kelompokUmur: item.kelompokUmur,
      jumlahKasus: item._sum.jumlahKasus || 0
    }));
  },
  ['faktor-risiko'],
  { tags: [CACHE_TAGS.klaster3], revalidate: CACHE_DURATION.medium }
);

export const getPemeriksaanGigi = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.pemeriksaanGigi.groupBy({
      by: ['kategori'],
      where,
      _sum: {
        sasaran: true,
        diperiksa: true,
        perluPerawatan: true
      }
    });

    return data.map((item: any) => ({
      kategori: item.kategori,
      sasaran: item._sum.sasaran || 0,
      diperiksa: item._sum.diperiksa || 0,
      perluPerawatan: item._sum.perluPerawatan || 0
    }));
  },
  ['pemeriksaan-gigi'],
  { tags: [CACHE_TAGS.klaster3], revalidate: CACHE_DURATION.medium }
);

// ============================================
// KLASTER 4: PERINGATAN DIAGNOSA
// ============================================

export const getTopDiagnosa = unstable_cache(
  async (
    puskesmasId?: string,
    bulan?: number,
    tahun?: number,
    limit: number = 12
  ) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.topDiagnosa.groupBy({
      by: ['icd10Code', 'diagnosa'],
      where,
      _sum: {
        jumlahKasus: true
      },
      orderBy: {
        _sum: {
          jumlahKasus: 'desc'
        }
      },
      take: limit
    });

    return data.map((item: any) => ({
      kodeIcd: item.icd10Code,
      nama: item.diagnosa,
      jumlahKasus: item._sum.jumlahKasus || 0
    }));
  },
  ['top-diagnosa'],
  { tags: [CACHE_TAGS.klaster4], revalidate: CACHE_DURATION.medium }
);

export const getDiagnosaByBahaya = unstable_cache(
  async (
    tingkatBahaya: string,
    puskesmasId?: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const where = {
      tingkatBahaya,
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.diagnosaHarian.groupBy({
      by: ['icd10Code', 'diagnosa'],
      where,
      _sum: {
        jumlahKasus: true
      },
      orderBy: {
        _sum: {
          jumlahKasus: 'desc'
        }
      },
      take: 10
    });

    return data.map((item: any) => ({
      kode: item.icd10Code,
      diagnosa: item.diagnosa,
      jumlah: item._sum.jumlahKasus || 0
    }));
  },
  ['diagnosa-bahaya'],
  { tags: [CACHE_TAGS.klaster4], revalidate: CACHE_DURATION.short }
);

// ============================================
// LINTAS KLASTER
// ============================================

export const getGawatDarurat = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.gawatDarurat.findMany({
      where,
      orderBy: { tanggal: 'asc' }
    });

    return data.map((item: any) => ({
      tanggal: item.tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      totalKunjungan: item.triaseMerah + item.triaseKuning + item.triaseHijau,
      triaseMerah: item.triaseMerah,
      triaseKuning: item.triaseKuning,
      triaseHijau: item.triaseHijau
    }));
  },
  ['gawat-darurat'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getGawatDaruratSummary = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.gawatDarurat.aggregate({
      where,
      _sum: {
        triaseMerah: true,
        triaseKuning: true,
        triaseHijau: true
      }
    });

    const total =
      (data._sum.triaseMerah || 0) +
      (data._sum.triaseKuning || 0) +
      (data._sum.triaseHijau || 0);

    return {
      totalKunjungan: total,
      triaseMerah: data._sum.triaseMerah || 0,
      triaseKuning: data._sum.triaseKuning || 0,
      triaseHijau: data._sum.triaseHijau || 0
    };
  },
  ['gawat-darurat-summary'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getFarmasi = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.farmasi.findMany({
      where,
      orderBy: { tanggal: 'asc' }
    });

    return data.map((item: any) => ({
      tanggal: item.tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      jumlahResep: item.jumlahResep,
      obatKeluar: item.obatKeluar,
      racikan: item.racikan
    }));
  },
  ['farmasi'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getFarmasiSummary = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.farmasi.aggregate({
      where,
      _sum: {
        jumlahResep: true,
        obatKeluar: true,
        racikan: true
      }
    });

    return {
      totalResep: data._sum.jumlahResep || 0,
      totalObatKeluar: data._sum.obatKeluar || 0,
      totalRacikan: data._sum.racikan || 0
    };
  },
  ['farmasi-summary'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getLaboratorium = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.laboratorium.findMany({
      where,
      orderBy: { tanggal: 'asc' }
    });

    return data.map((item: any) => ({
      tanggal: item.tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      totalPemeriksaan: item.jumlahPemeriksaan,
      hematologi: item.hematologi,
      kimiaDarah: item.kimiaKlinik,
      urinalisis: item.urinalisis,
      serologi: 0
    }));
  },
  ['laboratorium'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getLaboratoriumSummary = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.laboratorium.aggregate({
      where,
      _sum: {
        jumlahPemeriksaan: true,
        hematologi: true,
        kimiaKlinik: true,
        urinalisis: true
      }
    });

    return {
      totalPemeriksaan: data._sum.jumlahPemeriksaan || 0,
      hematologi: data._sum.hematologi || 0,
      kimiaDarah: data._sum.kimiaKlinik || 0,
      urinalisis: data._sum.urinalisis || 0,
      serologi: 0
    };
  },
  ['laboratorium-summary'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getRawatInap = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.rawatInap.findMany({
      where,
      orderBy: { tanggal: 'asc' }
    });

    return data.map((item: any) => ({
      tanggal: item.tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      pasienMasuk: item.pasienMasuk,
      pasienKeluar: item.pasienKeluar,
      bedTerpakai: item.bedTerisi,
      bedKosong: item.bedTotal - item.bedTerisi,
      bor: Math.round((item.bedTerisi / item.bedTotal) * 100)
    }));
  },
  ['rawat-inap'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

export const getRawatInapSummary = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 14));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.rawatInap.aggregate({
      where,
      _sum: {
        pasienMasuk: true,
        pasienKeluar: true
      },
      _avg: {
        bedTerisi: true,
        bedTotal: true
      }
    });

    const avgBor = data._avg.bedTotal
      ? Math.round(((data._avg.bedTerisi || 0) / data._avg.bedTotal) * 100)
      : 0;

    return {
      totalPasienMasuk: data._sum.pasienMasuk || 0,
      totalPasienKeluar: data._sum.pasienKeluar || 0,
      bedTerpakai: Math.round(data._avg.bedTerisi || 0),
      bedKosong: Math.round(
        (data._avg.bedTotal || 0) - (data._avg.bedTerisi || 0)
      ),
      avgBor
    };
  },
  ['rawat-inap-summary'],
  { tags: [CACHE_TAGS.lintasKlaster], revalidate: CACHE_DURATION.short }
);

// ============================================
// MONITORING
// ============================================

export const getKunjunganByDesa = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      pasienDesa: { not: null },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.kunjungan.groupBy({
      by: ['pasienDesa', 'pasienGender'],
      where,
      _count: {
        id: true
      }
    });

    // Group by desa
    const desaMap: Record<
      string,
      { desa: string; laki: number; perempuan: number }
    > = {};

    data.forEach((item: any) => {
      const desa = item.pasienDesa || 'Unknown';
      if (!desaMap[desa]) {
        desaMap[desa] = { desa, laki: 0, perempuan: 0 };
      }
      if (item.pasienGender === 'L') {
        desaMap[desa].laki += item._count.id;
      } else {
        desaMap[desa].perempuan += item._count.id;
      }
    });

    return Object.values(desaMap);
  },
  ['kunjungan-by-desa'],
  { tags: [CACHE_TAGS.monitoring], revalidate: CACHE_DURATION.medium }
);

export const getKunjunganBySiklusHidup = unstable_cache(
  async (puskesmasId?: string, startDate?: Date, endDate?: Date) => {
    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const where = {
      tanggal: {
        gte: start,
        lte: end
      },
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.kunjungan.findMany({
      where,
      select: {
        pasienUmur: true,
        pasienGender: true
      }
    });

    // Categorize by age group
    const result = {
      bayi: { laki: 0, perempuan: 0 }, // 0-1
      anak: { laki: 0, perempuan: 0 }, // 2-11
      remaja: { laki: 0, perempuan: 0 }, // 12-17
      dewasa: { laki: 0, perempuan: 0 }, // 18-59
      lansia: { laki: 0, perempuan: 0 } // 60+
    };

    data.forEach((item: any) => {
      let kategori: keyof typeof result;
      if (item.pasienUmur <= 1) kategori = 'bayi';
      else if (item.pasienUmur <= 11) kategori = 'anak';
      else if (item.pasienUmur <= 17) kategori = 'remaja';
      else if (item.pasienUmur <= 59) kategori = 'dewasa';
      else kategori = 'lansia';

      if (item.pasienGender === 'L') {
        result[kategori].laki++;
      } else {
        result[kategori].perempuan++;
      }
    });

    return [
      { name: 'Bayi (0-1 th)', ...result.bayi, color: '#ef4444' },
      { name: 'Anak (2-11 th)', ...result.anak, color: '#f97316' },
      { name: 'Remaja (12-17 th)', ...result.remaja, color: '#eab308' },
      { name: 'Dewasa (18-59 th)', ...result.dewasa, color: '#22c55e' },
      { name: 'Lansia (60+ th)', ...result.lansia, color: '#3b82f6' }
    ];
  },
  ['kunjungan-siklus-hidup'],
  { tags: [CACHE_TAGS.monitoring], revalidate: CACHE_DURATION.medium }
);

export const getTopKeluhan = unstable_cache(
  async (
    puskesmasId?: string,
    bulan?: number,
    tahun?: number,
    limit: number = 10
  ) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.topKeluhan.groupBy({
      by: ['keluhan'],
      where,
      _sum: {
        jumlahKasus: true
      },
      orderBy: {
        _sum: {
          jumlahKasus: 'desc'
        }
      },
      take: limit
    });

    return data.map((item: any) => ({
      keluhan: item.keluhan,
      jumlah: item._sum.jumlahKasus || 0
    }));
  },
  ['top-keluhan'],
  { tags: [CACHE_TAGS.monitoring], revalidate: CACHE_DURATION.medium }
);

export const getTopObat = unstable_cache(
  async (
    puskesmasId?: string,
    bulan?: number,
    tahun?: number,
    limit: number = 10
  ) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      tahun: currentYear,
      bulan: currentMonth,
      ...(puskesmasId && { puskesmasId })
    };

    const data = await prisma.topObat.groupBy({
      by: ['namaObat'],
      where,
      _sum: {
        jumlahResep: true
      },
      orderBy: {
        _sum: {
          jumlahResep: 'desc'
        }
      },
      take: limit
    });

    return data.map((item: any) => ({
      namaObat: item.namaObat,
      jumlahPemakaian: item._sum.jumlahResep || 0,
      satuan: 'Tab'
    }));
  },
  ['top-obat'],
  { tags: [CACHE_TAGS.monitoring], revalidate: CACHE_DURATION.medium }
);

// ============================================
// OVERVIEW
// ============================================

export const getOverviewSummary = unstable_cache(
  async (puskesmasId?: string, bulan?: number, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();
    const currentMonth = bulan || new Date().getMonth() + 1;

    const where = {
      bulan: currentMonth,
      tahun: currentYear,
      ...(puskesmasId && { puskesmasId })
    };

    // Aggregate all data instead of findFirst
    const data = await prisma.overviewSummary.aggregate({
      where,
      _sum: {
        totalKunjungan: true,
        kunjunganBaru: true,
        kunjunganLama: true,
        pasienBpjs: true,
        pasienUmum: true
      }
    });

    return {
      totalKunjungan: data._sum.totalKunjungan || 0,
      kunjunganBaru: data._sum.kunjunganBaru || 0,
      kunjunganLama: data._sum.kunjunganLama || 0,
      pasienBpjs: data._sum.pasienBpjs || 0,
      pasienUmum: data._sum.pasienUmum || 0
    };
  },
  ['overview-summary'],
  { tags: [CACHE_TAGS.overview], revalidate: CACHE_DURATION.medium }
);

export const getOverviewTrend = unstable_cache(
  async (puskesmasId?: string, tahun?: number) => {
    const currentYear = tahun || new Date().getFullYear();

    const where = {
      tahun: currentYear,
      ...(puskesmasId && { puskesmasId })
    };

    // Group by month and aggregate
    const data = await prisma.overviewSummary.groupBy({
      by: ['bulan'],
      where,
      _sum: {
        totalKunjungan: true,
        pasienBpjs: true,
        pasienUmum: true
      },
      orderBy: { bulan: 'asc' }
    });

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des'
    ];

    return data.map((item: any) => ({
      bulan: months[item.bulan - 1],
      kunjungan: item._sum.totalKunjungan || 0,
      bpjs: item._sum.pasienBpjs || 0,
      umum: item._sum.pasienUmum || 0
    }));
  },
  ['overview-trend'],
  { tags: [CACHE_TAGS.overview], revalidate: CACHE_DURATION.medium }
);

// ============================================
// PUSKESMAS
// ============================================

export const getAllPuskesmas = unstable_cache(
  async () => {
    return prisma.puskesmas.findMany({
      where: { status: 'aktif' },
      orderBy: { namaPuskesmas: 'asc' },
      select: {
        id: true,
        kodePuskesmas: true,
        namaPuskesmas: true,
        jenis: true
      }
    });
  },
  ['all-puskesmas'],
  { tags: [CACHE_TAGS.puskesmas], revalidate: CACHE_DURATION.day }
);

export const getPuskesmasCount = unstable_cache(
  async () => {
    return prisma.puskesmas.count({
      where: { status: 'aktif' }
    });
  },
  ['puskesmas-count'],
  { tags: [CACHE_TAGS.puskesmas], revalidate: CACHE_DURATION.day }
);
