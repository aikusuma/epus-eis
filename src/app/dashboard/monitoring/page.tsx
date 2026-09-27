'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CountUp } from '@/components/ui/count-up';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  IconMapPin,
  IconStethoscope,
  IconPill,
  IconMessageCircle,
  IconBabyCarriage,
  IconUser,
  IconFriends,
  IconWheelchair,
  IconShare2,
  IconHospital,
  IconUsers,
  IconCalendar,
  IconFilter,
  IconArrowUpRight
} from '@tabler/icons-react';
import { useTabFromUrl } from '@/hooks/use-tab-from-url';
import { useMonitoringData, FilterParams } from '@/hooks/use-eis-data';
import { Skeleton } from '@/components/ui/skeleton';

const PUSKESMAS_LIST = [
  'Puskesmas Ciawigebang',
  'Puskesmas Cilimus',
  'Puskesmas Kadugede',
  'Puskesmas Luragung',
  'Puskesmas Kuningan',
  'Puskesmas Kramatmulya',
  'Puskesmas Darma',
  'Puskesmas Mandirancan'
];

const RS_LIST = [
  "RSUD '45 Kuningan",
  'RSUD Linggajati',
  'RS Sekar Kamulyan',
  'RS Juanda',
  'RS KMC'
];

const POLI_LIST = [
  'Poli Penyakit Dalam',
  'Poli Anak',
  'Poli Kandungan (Obgyn)',
  'Poli Bedah',
  'Poli Mata',
  'Poli Saraf',
  'Poli Jantung'
];

// Mulberry32 deterministic PRNG generator untuk variasi data rujukan yang konsisten (SSR & Hydration safe)
const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Generate dummy data (500 records) simulating September 2026 data persis sesuai monitoring_rujukan_vertikal.tsx
const generateMockRujukanData = () => {
  const rand = mulberry32(20260927);
  const data = [];
  const baseDate = new Date('2026-09-01T00:00:00Z').getTime();

  for (let i = 0; i < 500; i++) {
    const randomOffset = Math.floor(rand() * 30 * 24 * 60 * 60 * 1000);
    const date = new Date(baseDate + randomOffset);

    data.push({
      id: i + 1,
      tanggal: date.toISOString().split('T')[0],
      puskesmas: PUSKESMAS_LIST[Math.floor(rand() * PUSKESMAS_LIST.length)],
      rumahSakit: RS_LIST[Math.floor(rand() * RS_LIST.length)],
      poli: POLI_LIST[Math.floor(rand() * POLI_LIST.length)],
      jumlahPasien: Math.floor(rand() * 4) + 1 // 1 to 4 patients per referral batch
    });
  }
  return data;
};

const rawRujukanData = generateMockRujukanData();

// Dynamic import untuk Leaflet (harus client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false
});
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

// Chart configs
const diagnosaConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Kasus', color: 'var(--primary)' }
};

const keluhanConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Keluhan', color: '#8b5cf6' }
};

const obatConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Pemakaian', color: '#22c55e' }
};

const COLORS = ['#ec4899', '#f97316', '#eab308', '#22c55e', '#6366f1'];

export default function MonitoringPage() {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<'sebaran' | 'rujukan'>(
    'sebaran'
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('semua');
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('diagnosa');

  // State untuk Monitoring Rujukan
  const [rujukanStartDate, setRujukanStartDate] = useState('2026-09-01');
  const [rujukanEndDate, setRujukanEndDate] = useState('2026-09-30');
  const [rujukanSelectedPuskesmas, setRujukanSelectedPuskesmas] =
    useState('Semua Puskesmas');

  const { filteredRujukanData, top5Cards, matrixData, pkmColumns, rsRows } =
    useMemo(() => {
      const filtered = rawRujukanData.filter((item) => {
        const isAfterStart =
          !rujukanStartDate || item.tanggal >= rujukanStartDate;
        const isBeforeEnd = !rujukanEndDate || item.tanggal <= rujukanEndDate;
        const isMatchPkm =
          rujukanSelectedPuskesmas === 'Semua Puskesmas' ||
          item.puskesmas === rujukanSelectedPuskesmas;

        return isAfterStart && isBeforeEnd && isMatchPkm;
      });

      const cardMap: Record<
        string,
        { rs: string; poli: string; count: number }
      > = {};
      filtered.forEach((item) => {
        const key = `${item.rumahSakit} - ${item.poli}`;
        if (!cardMap[key]) {
          cardMap[key] = { rs: item.rumahSakit, poli: item.poli, count: 0 };
        }
        cardMap[key].count += item.jumlahPasien;
      });

      const sortedCards = Object.values(cardMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const matrix: Record<string, Record<string, number>> = {};
      const pkmSet = new Set<string>();
      const rsSet = new Set<string>();

      filtered.forEach((item) => {
        pkmSet.add(item.puskesmas);
        rsSet.add(item.rumahSakit);

        if (!matrix[item.rumahSakit]) {
          matrix[item.rumahSakit] = {};
        }
        if (!matrix[item.rumahSakit][item.puskesmas]) {
          matrix[item.rumahSakit][item.puskesmas] = 0;
        }
        matrix[item.rumahSakit][item.puskesmas] += item.jumlahPasien;
      });

      const cols =
        rujukanSelectedPuskesmas !== 'Semua Puskesmas'
          ? [rujukanSelectedPuskesmas]
          : Array.from(pkmSet).sort();

      const rows = Array.from(rsSet).sort();

      return {
        filteredRujukanData: filtered,
        top5Cards: sortedCards,
        matrixData: matrix,
        pkmColumns: cols,
        rsRows: rows
      };
    }, [rujukanStartDate, rujukanEndDate, rujukanSelectedPuskesmas]);

  // Fetch data using SWR
  const { data, isLoading, isError } = useMonitoringData(filters);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const month = newFilters.dateRange?.from?.getMonth();
    const year = newFilters.dateRange?.from?.getFullYear();

    setFilters({
      puskesmasId: newFilters.puskesmasId || undefined,
      bulan: month !== undefined ? month + 1 : undefined,
      tahun: year
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Transform API data
  const top10Diagnosa = useMemo(() => {
    if (!data?.topDiagnosa) return [];
    return data.topDiagnosa.slice(0, 10).map((item: any) => ({
      name: item.nama,
      jumlah: item.jumlahKasus,
      kode: item.kodeIcd
    }));
  }, [data?.topDiagnosa]);

  const top10Keluhan = useMemo(() => {
    if (!data?.topKeluhan) return [];
    return data.topKeluhan.slice(0, 10).map((item: any) => ({
      name: item.keluhan,
      jumlah: item.jumlah
    }));
  }, [data?.topKeluhan]);

  const top10Obat = useMemo(() => {
    if (!data?.topObat) return [];
    return data.topObat.slice(0, 10).map((item: any) => ({
      name: item.namaObat,
      jumlah: item.jumlahPemakaian,
      satuan: item.satuan || 'Tab'
    }));
  }, [data?.topObat]);

  const siklusHidupSummary = useMemo(() => {
    if (!data?.kunjunganBySiklusHidup) return [];
    const kelompokColors: Record<string, string> = {
      Bayi: '#ec4899',
      Anak: '#f97316',
      Remaja: '#eab308',
      Dewasa: '#22c55e',
      Lansia: '#6366f1'
    };
    return data.kunjunganBySiklusHidup.map((item: any) => ({
      name: item.kelompok,
      laki: item.laki || Math.floor(item.jumlah * 0.48),
      perempuan: item.perempuan || Math.floor(item.jumlah * 0.52),
      color: kelompokColors[item.kelompok] || '#94a3b8'
    }));
  }, [data?.kunjunganBySiklusHidup]);

  const sebaranPasienData = useMemo(() => {
    if (!data?.kunjunganByDesa) return [];
    return data.kunjunganByDesa.map((item: any, index: number) => {
      const total = (item.laki || 0) + (item.perempuan || 0);
      return {
        id: index + 1,
        lat: item.lat || -6.8748 + (Math.random() - 0.5) * 0.1,
        lng: item.lng || 109.0526 + (Math.random() - 0.5) * 0.1,
        desa: item.desa,
        total,
        bayi_l: Math.floor(total * 0.05),
        bayi_p: Math.floor(total * 0.06),
        anak_l: Math.floor(total * 0.12),
        anak_p: Math.floor(total * 0.13),
        remaja_l: Math.floor(total * 0.1),
        remaja_p: Math.floor(total * 0.11),
        dewasa_l: Math.floor(total * 0.18),
        dewasa_p: Math.floor(total * 0.2),
        lansia_l: Math.floor(total * 0.07),
        lansia_p: Math.floor(total * 0.08)
      };
    });
  }, [data?.kunjunganByDesa]);

  // Heatmap data for Siklus Hidup visualization
  const heatmapData = useMemo(() => {
    if (!sebaranPasienData.length) return [];
    return sebaranPasienData.slice(0, 10).map((item: any) => ({
      desa: item.desa,
      Bayi: item.bayi_l + item.bayi_p,
      Anak: item.anak_l + item.anak_p,
      Remaja: item.remaja_l + item.remaja_p,
      Dewasa: item.dewasa_l + item.dewasa_p,
      Lansia: item.lansia_l + item.lansia_p
    }));
  }, [sebaranPasienData]);

  // Calculate total per siklus hidup
  const totalByGender = siklusHidupSummary.reduce(
    (acc: any, curr: any) => ({
      laki: acc.laki + curr.laki,
      perempuan: acc.perempuan + curr.perempuan
    }),
    { laki: 0, perempuan: 0 }
  );

  return (
    <PageContainer>
      <div className='w-0 max-w-full min-w-full space-y-6 overflow-x-hidden'>
        <DashboardFilter onFilterChange={handleFilterChange} />

        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Monitoring</h2>
            <p className='text-muted-foreground'>
              {activeView === 'rujukan'
                ? 'Monitoring rujukan faskes vertikal ke rumah sakit'
                : 'Sebaran data pasien dan statistik layanan kesehatan'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='bg-muted/70 inline-flex items-center rounded-lg border p-1'>
              <Button
                variant={activeView === 'sebaran' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setActiveView('sebaran')}
                className='h-8 gap-1.5 text-xs font-medium'
              >
                <IconMapPin className='h-3.5 w-3.5' />
                Sebaran Pasien
              </Button>
              <Button
                variant={activeView === 'rujukan' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setActiveView('rujukan')}
                className='h-8 gap-1.5 text-xs font-medium'
              >
                <IconShare2 className='h-3.5 w-3.5' />
                Monitoring Rujukan
              </Button>
            </div>
          </div>
        </div>

        {activeView === 'rujukan' ? (
          <div className='w-0 max-w-full min-w-full space-y-6 overflow-x-hidden'>
            {/* Filter Section */}
            <Card className='w-0 max-w-full min-w-full overflow-hidden border-slate-200/70 shadow-xs'>
              <CardContent className='p-4 md:p-5'>
                <div className='grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <div>
                    <label className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase'>
                      <IconCalendar className='h-4 w-4 text-teal-600' /> Tanggal
                      Mulai
                    </label>
                    <input
                      type='date'
                      value={rujukanStartDate}
                      onChange={(e) => setRujukanStartDate(e.target.value)}
                      className='border-input bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:ring-2 focus:outline-none'
                    />
                  </div>

                  <div>
                    <label className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase'>
                      <IconCalendar className='h-4 w-4 text-teal-600' /> Tanggal
                      Akhir
                    </label>
                    <input
                      type='date'
                      value={rujukanEndDate}
                      onChange={(e) => setRujukanEndDate(e.target.value)}
                      className='border-input bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:ring-2 focus:outline-none'
                    />
                  </div>

                  <div className='sm:col-span-2'>
                    <label className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase'>
                      <IconFilter className='h-4 w-4 text-teal-600' /> Filter
                      Puskesmas
                    </label>
                    <select
                      value={rujukanSelectedPuskesmas}
                      onChange={(e) =>
                        setRujukanSelectedPuskesmas(e.target.value)
                      }
                      className='border-input bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:ring-2 focus:outline-none'
                    >
                      <option value='Semua Puskesmas'>
                        Semua Puskesmas Kab. Kuningan
                      </option>
                      {PUSKESMAS_LIST.map((pkm) => (
                        <option key={pkm} value={pkm}>
                          {pkm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top 5 Rujukan Cards */}
            <div className='w-0 max-w-full min-w-full space-y-3'>
              <div className='flex items-center gap-2'>
                <h3 className='text-base font-bold'>Top 5 Rujukan Terbanyak</h3>
                <Badge variant='secondary' className='text-xs font-normal'>
                  Berdasarkan RS & Poli
                </Badge>
              </div>

              {top5Cards.length === 0 ? (
                <Card className='border-dashed'>
                  <CardContent className='text-muted-foreground p-8 text-center text-sm'>
                    Tidak ada data rujukan pada periode ini.
                  </CardContent>
                </Card>
              ) : (
                <div className='grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5'>
                  {top5Cards.map((card, idx) => (
                    <Card
                      key={idx}
                      className='group relative min-w-0 overflow-hidden transition-shadow hover:shadow-md'
                    >
                      <div className='absolute top-0 right-0 p-4 opacity-5 transition-all duration-300 group-hover:scale-110 group-hover:opacity-10'>
                        <IconHospital className='h-16 w-16 text-teal-600' />
                      </div>
                      <CardHeader className='pb-2'>
                        <div className='flex items-center justify-between'>
                          <span className='inline-flex h-7 w-7 items-center justify-center rounded-md bg-teal-500/10 text-xs font-bold text-teal-600'>
                            #{idx + 1}
                          </span>
                          <IconArrowUpRight className='text-muted-foreground/50 h-4 w-4' />
                        </div>
                        <CardTitle
                          className='truncate pt-1 text-sm font-bold'
                          title={card.rs}
                        >
                          {card.rs}
                        </CardTitle>
                        <p className='text-muted-foreground truncate text-xs'>
                          {card.poli}
                        </p>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='flex items-end justify-between'>
                          <div>
                            <span className='text-2xl font-black text-teal-600'>
                              {card.count}
                            </span>
                            <span className='text-muted-foreground ml-1.5 text-xs font-medium'>
                              Pasien
                            </span>
                          </div>
                          <IconUsers className='text-muted-foreground/30 h-5 w-5' />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Cross-tab / Matrix: RS vs Puskesmas */}
            <Card className='w-0 max-w-full min-w-full overflow-hidden border-slate-200/70 shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base font-bold'>
                  Distribusi Rujukan (RS vs Puskesmas)
                </CardTitle>
                <CardDescription className='text-xs'>
                  Matriks penyebaran rujukan dari Puskesmas Kuningan ke Rumah
                  Sakit tujuan
                </CardDescription>
              </CardHeader>
              <CardContent className='w-full max-w-full overflow-hidden p-0'>
                {rsRows.length === 0 ? (
                  <div className='text-muted-foreground p-8 text-center text-sm'>
                    Tidak ada sebaran data rujukan.
                  </div>
                ) : (
                  <div className='w-full max-w-full overflow-x-auto'>
                    <table className='w-full border-collapse text-left text-sm whitespace-nowrap'>
                      <thead>
                        <tr className='bg-muted/50 border-y text-xs'>
                          <th className='bg-muted/70 text-foreground sticky left-0 z-10 border-r px-4 py-3.5 font-bold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                            Rumah Sakit Rujukan
                          </th>
                          {pkmColumns.map((pkm) => (
                            <th
                              key={pkm}
                              className='text-muted-foreground border-r px-3.5 py-3.5 text-center font-semibold'
                              title={pkm}
                            >
                              {pkm.replace('Puskesmas ', 'PKM ')}
                            </th>
                          ))}
                          <th className='bg-teal-500/10 px-4 py-3.5 text-center font-bold text-teal-700 dark:text-teal-400'>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {rsRows.map((rs) => {
                          let totalRS = 0;
                          return (
                            <tr
                              key={rs}
                              className='hover:bg-muted/30 transition-colors'
                            >
                              <td className='bg-card text-foreground sticky left-0 border-r px-4 py-3 font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                                {rs}
                              </td>
                              {pkmColumns.map((pkm) => {
                                const val = matrixData[rs]?.[pkm] || 0;
                                totalRS += val;
                                return (
                                  <td
                                    key={pkm}
                                    className='border-r px-3 py-3 text-center'
                                  >
                                    {val > 0 ? (
                                      <span className='inline-flex min-w-[2rem] items-center justify-center rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400'>
                                        {val}
                                      </span>
                                    ) : (
                                      <span className='text-muted-foreground/30'>
                                        -
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className='bg-teal-500/5 px-4 py-3 text-center font-bold text-teal-700 dark:text-teal-400'>
                                {totalRS}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className='bg-muted/60 border-t font-bold'>
                          <td className='bg-muted/80 text-foreground sticky left-0 border-r px-4 py-3.5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                            Total Keseluruhan
                          </td>
                          {pkmColumns.map((pkm) => {
                            let totalPkm = 0;
                            rsRows.forEach((rs) => {
                              totalPkm += matrixData[rs]?.[pkm] || 0;
                            });
                            return (
                              <td
                                key={pkm}
                                className='border-r px-3 py-3.5 text-center text-xs font-bold'
                              >
                                {totalPkm}
                              </td>
                            );
                          })}
                          <td className='bg-teal-500/15 px-4 py-3.5 text-center font-black text-teal-700 dark:text-teal-400'>
                            {filteredRujukanData.reduce(
                              (sum, item) => sum + item.jumlahPasien,
                              0
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {isLoading ? (
              <div className='grid gap-4 md:grid-cols-5'>
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className='pb-2'>
                      <Skeleton className='h-4 w-24' />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className='h-8 w-16' />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-5'>
                {siklusHidupSummary.length > 0 ? (
                  siklusHidupSummary.map((item: any, index: number) => (
                    <Card key={item.name}>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                          {item.name}
                        </CardTitle>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: item.color }}
                        />
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-bold'>
                          <CountUp
                            value={(item.laki || 0) + (item.perempuan || 0)}
                          />
                        </div>
                        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                          <span>
                            L: <CountUp value={item.laki || 0} />
                          </span>
                          <span>|</span>
                          <span>
                            P: <CountUp value={item.perempuan || 0} />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className='md:col-span-5'>
                    <CardContent className='text-muted-foreground py-8 text-center'>
                      Tidak ada data siklus hidup
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Map Section */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconMapPin className='h-5 w-5' />
                  Sebaran Data Pasien Berdasarkan Siklus Hidup
                </CardTitle>
                <CardDescription>
                  Peta sebaran pasien per kelurahan/desa di{' '}
                  {process.env.NEXT_PUBLIC_KABUPATEN || 'Kabupaten'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='mb-4 flex flex-wrap gap-2'>
                  <Badge
                    variant={selectedFilter === 'semua' ? 'default' : 'outline'}
                    className='cursor-pointer'
                    onClick={() => setSelectedFilter('semua')}
                  >
                    Semua
                  </Badge>
                  <Badge
                    variant={selectedFilter === 'bayi' ? 'default' : 'outline'}
                    className='cursor-pointer'
                    onClick={() => setSelectedFilter('bayi')}
                  >
                    <IconBabyCarriage className='mr-1 h-3 w-3' />
                    Bayi
                  </Badge>
                  <Badge
                    variant={selectedFilter === 'anak' ? 'default' : 'outline'}
                    className='cursor-pointer'
                    onClick={() => setSelectedFilter('anak')}
                  >
                    Anak
                  </Badge>
                  <Badge
                    variant={
                      selectedFilter === 'remaja' ? 'default' : 'outline'
                    }
                    className='cursor-pointer'
                    onClick={() => setSelectedFilter('remaja')}
                  >
                    <IconUser className='mr-1 h-3 w-3' />
                    Remaja
                  </Badge>
                  <Badge
                    variant={
                      selectedFilter === 'dewasa' ? 'default' : 'outline'
                    }
                    className='cursor-pointer'
                    onClick={() => setSelectedFilter('dewasa')}
                  >
                    <IconFriends className='mr-1 h-3 w-3' />
                    Dewasa
                  </Badge>
                  <Badge
                    variant={
                      selectedFilter === 'lansia' ? 'default' : 'outline'
                    }
                    className='cursor-pointer'
                    onClick={() => setSelectedFilter('lansia')}
                  >
                    <IconWheelchair className='mr-1 h-3 w-3' />
                    Lansia
                  </Badge>
                </div>

                {mounted && (
                  <div className='h-[400px] w-full overflow-hidden rounded-lg border'>
                    <MapContainer
                      center={[-6.8748, 109.0526]}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                      />
                      {sebaranPasienData.map((lokasi: any) => {
                        let total = 0;
                        let label = '';

                        if (selectedFilter === 'bayi') {
                          total = lokasi.bayi_l + lokasi.bayi_p;
                          label = `Bayi L: ${lokasi.bayi_l}, P: ${lokasi.bayi_p}`;
                        } else if (selectedFilter === 'anak') {
                          total = lokasi.anak_l + lokasi.anak_p;
                          label = `Anak L: ${lokasi.anak_l}, P: ${lokasi.anak_p}`;
                        } else if (selectedFilter === 'remaja') {
                          total = lokasi.remaja_l + lokasi.remaja_p;
                          label = `Remaja L: ${lokasi.remaja_l}, P: ${lokasi.remaja_p}`;
                        } else if (selectedFilter === 'dewasa') {
                          total = lokasi.dewasa_l + lokasi.dewasa_p;
                          label = `Dewasa L: ${lokasi.dewasa_l}, P: ${lokasi.dewasa_p}`;
                        } else if (selectedFilter === 'lansia') {
                          total = lokasi.lansia_l + lokasi.lansia_p;
                          label = `Lansia L: ${lokasi.lansia_l}, P: ${lokasi.lansia_p}`;
                        } else {
                          total =
                            lokasi.bayi_l +
                            lokasi.bayi_p +
                            lokasi.anak_l +
                            lokasi.anak_p +
                            lokasi.remaja_l +
                            lokasi.remaja_p +
                            lokasi.dewasa_l +
                            lokasi.dewasa_p +
                            lokasi.lansia_l +
                            lokasi.lansia_p;
                          label = `Total Pasien`;
                        }

                        const radius = Math.max(10, Math.min(30, total / 20));

                        return (
                          <CircleMarker
                            key={lokasi.id}
                            center={[lokasi.lat, lokasi.lng]}
                            radius={radius}
                            pathOptions={{
                              fillColor: 'var(--primary)',
                              fillOpacity: 0.6,
                              color: 'var(--primary)',
                              weight: 2
                            }}
                          >
                            <Tooltip
                              direction='top'
                              offset={[0, -radius]}
                              opacity={0.95}
                              permanent={false}
                            >
                              <span className='text-xs font-semibold'>
                                {lokasi.desa} ({total} pasien)
                              </span>
                            </Tooltip>
                            <Popup>
                              <div className='min-w-[180px]'>
                                <h3 className='mb-2 font-semibold'>
                                  {lokasi.desa}
                                </h3>
                                <div className='space-y-1 text-sm'>
                                  <p>
                                    <strong>Total:</strong> {total} pasien
                                  </p>
                                  <p className='text-muted-foreground'>
                                    {label}
                                  </p>
                                  <hr className='my-2' />
                                  <p>
                                    Bayi: {lokasi.bayi_l + lokasi.bayi_p} (L:
                                    {lokasi.bayi_l}, P:{lokasi.bayi_p})
                                  </p>
                                  <p>
                                    Anak: {lokasi.anak_l + lokasi.anak_p} (L:
                                    {lokasi.anak_l}, P:{lokasi.anak_p})
                                  </p>
                                  <p>
                                    Remaja: {lokasi.remaja_l + lokasi.remaja_p}{' '}
                                    (L:
                                    {lokasi.remaja_l}, P:{lokasi.remaja_p})
                                  </p>
                                  <p>
                                    Dewasa: {lokasi.dewasa_l + lokasi.dewasa_p}{' '}
                                    (L:
                                    {lokasi.dewasa_l}, P:{lokasi.dewasa_p})
                                  </p>
                                  <p>
                                    Lansia: {lokasi.lansia_l + lokasi.lansia_p}{' '}
                                    (L:
                                    {lokasi.lansia_l}, P:{lokasi.lansia_p})
                                  </p>
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  </div>
                )}

                {/* Legend */}
                <div className='mt-4 flex flex-wrap gap-4'>
                  {siklusHidupSummary.map((item: any) => (
                    <div
                      key={item.name}
                      className='flex items-center gap-2 text-sm'
                    >
                      <div
                        className='h-3 w-3 rounded-full'
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Heatmap Section - Sebaran Data Pasien */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconFriends className='h-5 w-5' />
                  Heatmap Siklus Hidup per Desa
                </CardTitle>
                <CardDescription>
                  Visualisasi distribusi pasien berdasarkan kelompok umur di
                  setiap desa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapData.length > 0 ? (
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse'>
                      <thead>
                        <tr>
                          <th className='bg-muted border p-2 text-left font-medium'>
                            Desa
                          </th>
                          <th
                            className='border p-2 text-center font-medium'
                            style={{ backgroundColor: '#fce7f3' }}
                          >
                            Bayi
                          </th>
                          <th
                            className='border p-2 text-center font-medium'
                            style={{ backgroundColor: '#ffedd5' }}
                          >
                            Anak
                          </th>
                          <th
                            className='border p-2 text-center font-medium'
                            style={{ backgroundColor: '#fef9c3' }}
                          >
                            Remaja
                          </th>
                          <th
                            className='border p-2 text-center font-medium'
                            style={{ backgroundColor: '#dcfce7' }}
                          >
                            Dewasa
                          </th>
                          <th
                            className='border p-2 text-center font-medium'
                            style={{ backgroundColor: '#dbeafe' }}
                          >
                            Lansia
                          </th>
                          <th className='bg-muted border p-2 text-center font-medium'>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.map((row: any, index: number) => {
                          const total =
                            row.Bayi +
                            row.Anak +
                            row.Remaja +
                            row.Dewasa +
                            row.Lansia;
                          const maxVal = Math.max(
                            row.Bayi,
                            row.Anak,
                            row.Remaja,
                            row.Dewasa,
                            row.Lansia
                          );
                          const getOpacity = (val: number) =>
                            Math.max(0.2, val / (maxVal || 1));

                          return (
                            <tr key={index} className='hover:bg-muted/50'>
                              <td className='border p-2 font-medium'>
                                {row.desa}
                              </td>
                              <td
                                className='border p-2 text-center'
                                style={{
                                  backgroundColor: `rgba(236, 72, 153, ${getOpacity(row.Bayi)})`
                                }}
                              >
                                {row.Bayi}
                              </td>
                              <td
                                className='border p-2 text-center'
                                style={{
                                  backgroundColor: `rgba(249, 115, 22, ${getOpacity(row.Anak)})`
                                }}
                              >
                                {row.Anak}
                              </td>
                              <td
                                className='border p-2 text-center'
                                style={{
                                  backgroundColor: `rgba(234, 179, 8, ${getOpacity(row.Remaja)})`
                                }}
                              >
                                {row.Remaja}
                              </td>
                              <td
                                className='border p-2 text-center'
                                style={{
                                  backgroundColor: `rgba(34, 197, 94, ${getOpacity(row.Dewasa)})`
                                }}
                              >
                                {row.Dewasa}
                              </td>
                              <td
                                className='border p-2 text-center'
                                style={{
                                  backgroundColor: `rgba(59, 130, 246, ${getOpacity(row.Lansia)})`
                                }}
                              >
                                {row.Lansia}
                              </td>
                              <td className='bg-muted border p-2 text-center font-bold'>
                                {total}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='text-muted-foreground py-8 text-center'>
                    Tidak ada data heatmap
                  </div>
                )}

                {/* Heatmap Legend */}
                <div className='mt-4 flex flex-wrap gap-4 text-sm'>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-4 w-8 rounded'
                      style={{
                        background:
                          'linear-gradient(to right, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 1))'
                      }}
                    />
                    <span>Bayi (0-1 th)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-4 w-8 rounded'
                      style={{
                        background:
                          'linear-gradient(to right, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 1))'
                      }}
                    />
                    <span>Anak (2-11 th)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-4 w-8 rounded'
                      style={{
                        background:
                          'linear-gradient(to right, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 1))'
                      }}
                    />
                    <span>Remaja (12-17 th)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-4 w-8 rounded'
                      style={{
                        background:
                          'linear-gradient(to right, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 1))'
                      }}
                    />
                    <span>Dewasa (18-59 th)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-4 w-8 rounded'
                      style={{
                        background:
                          'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 1))'
                      }}
                    />
                    <span>Lansia (60+ th)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <Tabs
              value={currentTab}
              onValueChange={setTab}
              className='space-y-4'
            >
              <TabsList className='grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3'>
                <TabsTrigger
                  value='diagnosa'
                  className='flex items-center gap-1.5'
                >
                  <IconStethoscope className='h-4 w-4' />
                  <span className='hidden sm:inline'>Top 10 Diagnosa</span>
                  <span className='sm:hidden'>Diagnosa</span>
                </TabsTrigger>
                <TabsTrigger
                  value='keluhan'
                  className='flex items-center gap-1.5'
                >
                  <IconMessageCircle className='h-4 w-4' />
                  <span className='hidden sm:inline'>Top 10 Keluhan</span>
                  <span className='sm:hidden'>Keluhan</span>
                </TabsTrigger>
                <TabsTrigger value='obat' className='flex items-center gap-1.5'>
                  <IconPill className='h-4 w-4' />
                  <span className='hidden sm:inline'>
                    Top 10 Pemakaian Obat
                  </span>
                  <span className='sm:hidden'>Obat</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Top 10 Diagnosa */}
              <TabsContent value='diagnosa' className='space-y-4'>
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Diagnosa Terbanyak</CardTitle>
                      <CardDescription>
                        Berdasarkan jumlah kasus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={diagnosaConfig}
                        className='h-[460px] w-full'
                      >
                        <BarChart data={top10Diagnosa} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' fontSize={12} />
                          <YAxis
                            dataKey='name'
                            type='category'
                            fontSize={11}
                            width={100}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey='jumlah' radius={[0, 4, 4, 0]}>
                            {top10Diagnosa.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`hsl(192, 100%, ${35 + index * 5}%)`}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detail Diagnosa</CardTitle>
                      <CardDescription>
                        Kode ICD-10 dan jumlah kasus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {top10Diagnosa.map((item: any, index: number) => (
                          <div
                            key={item.name}
                            className='flex items-center justify-between rounded-lg border p-3'
                          >
                            <div className='flex items-center gap-3'>
                              <Badge
                                variant='outline'
                                className='w-8 justify-center'
                              >
                                {index + 1}
                              </Badge>
                              <div>
                                <p className='font-medium'>{item.name}</p>
                                <p className='text-muted-foreground text-sm'>
                                  {item.kode}
                                </p>
                              </div>
                            </div>
                            <Badge variant='secondary'>
                              {(item.jumlah || 0).toLocaleString()} kasus
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab Top 10 Keluhan */}
              <TabsContent value='keluhan' className='space-y-4'>
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Keluhan Pasien</CardTitle>
                      <CardDescription>
                        Keluhan yang paling sering dilaporkan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={keluhanConfig}
                        className='h-[460px] w-full'
                      >
                        <BarChart data={top10Keluhan} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' fontSize={12} />
                          <YAxis
                            dataKey='name'
                            type='category'
                            fontSize={11}
                            width={100}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey='jumlah' radius={[0, 4, 4, 0]}>
                            {top10Keluhan.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`hsl(270, 80%, ${40 + index * 5}%)`}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detail Keluhan</CardTitle>
                      <CardDescription>Jumlah laporan keluhan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {top10Keluhan.map((item: any, index: number) => (
                          <div
                            key={item.name}
                            className='flex items-center justify-between rounded-lg border p-3'
                          >
                            <div className='flex items-center gap-3'>
                              <Badge
                                variant='outline'
                                className='w-8 justify-center'
                              >
                                {index + 1}
                              </Badge>
                              <p className='font-medium'>{item.name}</p>
                            </div>
                            <Badge variant='secondary'>
                              {(item.jumlah || 0).toLocaleString()} laporan
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab Top 10 Pemakaian Obat */}
              <TabsContent value='obat' className='space-y-4'>
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Pemakaian Obat</CardTitle>
                      <CardDescription>
                        Obat yang paling banyak digunakan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={obatConfig}
                        className='h-[460px] w-full'
                      >
                        <BarChart data={top10Obat} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' fontSize={12} />
                          <YAxis
                            dataKey='name'
                            type='category'
                            fontSize={10}
                            width={120}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey='jumlah' radius={[0, 4, 4, 0]}>
                            {top10Obat.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`hsl(142, 70%, ${30 + index * 5}%)`}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detail Pemakaian Obat</CardTitle>
                      <CardDescription>
                        Jumlah pemakaian dan satuan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {top10Obat.map((item: any, index: number) => (
                          <div
                            key={item.name}
                            className='flex items-center justify-between rounded-lg border p-3'
                          >
                            <div className='flex items-center gap-3'>
                              <Badge
                                variant='outline'
                                className='w-8 justify-center'
                              >
                                {index + 1}
                              </Badge>
                              <p className='font-medium'>{item.name}</p>
                            </div>
                            <Badge variant='secondary'>
                              {(item.jumlah || 0).toLocaleString()}{' '}
                              {item.satuan || ''}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageContainer>
  );
}
