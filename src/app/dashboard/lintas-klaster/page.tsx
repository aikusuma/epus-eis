'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import { Badge } from '@/components/ui/badge';
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
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  IconAmbulance,
  IconPill,
  IconMicroscope,
  IconBed,
  IconTrendingUp,
  IconTrendingDown,
  IconClock
} from '@tabler/icons-react';
import { useTabFromUrl } from '@/hooks/use-tab-from-url';

// Data harian Gawat Darurat (30 hari terakhir)
const gawatDaruratData = [
  {
    tanggal: '1 Jan',
    kunjungan: 45,
    triase_merah: 5,
    triase_kuning: 15,
    triase_hijau: 25
  },
  {
    tanggal: '2 Jan',
    kunjungan: 52,
    triase_merah: 7,
    triase_kuning: 18,
    triase_hijau: 27
  },
  {
    tanggal: '3 Jan',
    kunjungan: 38,
    triase_merah: 3,
    triase_kuning: 12,
    triase_hijau: 23
  },
  {
    tanggal: '4 Jan',
    kunjungan: 61,
    triase_merah: 8,
    triase_kuning: 20,
    triase_hijau: 33
  },
  {
    tanggal: '5 Jan',
    kunjungan: 55,
    triase_merah: 6,
    triase_kuning: 17,
    triase_hijau: 32
  },
  {
    tanggal: '6 Jan',
    kunjungan: 42,
    triase_merah: 4,
    triase_kuning: 14,
    triase_hijau: 24
  },
  {
    tanggal: '7 Jan',
    kunjungan: 48,
    triase_merah: 5,
    triase_kuning: 16,
    triase_hijau: 27
  },
  {
    tanggal: '8 Jan',
    kunjungan: 39,
    triase_merah: 3,
    triase_kuning: 11,
    triase_hijau: 25
  },
  {
    tanggal: '9 Jan',
    kunjungan: 57,
    triase_merah: 7,
    triase_kuning: 19,
    triase_hijau: 31
  },
  {
    tanggal: '10 Jan',
    kunjungan: 63,
    triase_merah: 9,
    triase_kuning: 21,
    triase_hijau: 33
  },
  {
    tanggal: '11 Jan',
    kunjungan: 44,
    triase_merah: 4,
    triase_kuning: 14,
    triase_hijau: 26
  },
  {
    tanggal: '12 Jan',
    kunjungan: 51,
    triase_merah: 6,
    triase_kuning: 17,
    triase_hijau: 28
  },
  {
    tanggal: '13 Jan',
    kunjungan: 46,
    triase_merah: 5,
    triase_kuning: 15,
    triase_hijau: 26
  },
  {
    tanggal: '14 Jan',
    kunjungan: 58,
    triase_merah: 7,
    triase_kuning: 19,
    triase_hijau: 32
  }
];

// Data harian Farmasi
const farmasiData = [
  { tanggal: '1 Jan', resep: 234, obat_keluar: 1250, racikan: 45 },
  { tanggal: '2 Jan', resep: 256, obat_keluar: 1380, racikan: 52 },
  { tanggal: '3 Jan', resep: 198, obat_keluar: 1050, racikan: 38 },
  { tanggal: '4 Jan', resep: 287, obat_keluar: 1520, racikan: 61 },
  { tanggal: '5 Jan', resep: 265, obat_keluar: 1420, racikan: 55 },
  { tanggal: '6 Jan', resep: 212, obat_keluar: 1150, racikan: 42 },
  { tanggal: '7 Jan', resep: 243, obat_keluar: 1300, racikan: 48 },
  { tanggal: '8 Jan', resep: 189, obat_keluar: 1020, racikan: 36 },
  { tanggal: '9 Jan', resep: 278, obat_keluar: 1480, racikan: 58 },
  { tanggal: '10 Jan', resep: 301, obat_keluar: 1620, racikan: 65 },
  { tanggal: '11 Jan', resep: 225, obat_keluar: 1200, racikan: 44 },
  { tanggal: '12 Jan', resep: 254, obat_keluar: 1350, racikan: 51 },
  { tanggal: '13 Jan', resep: 231, obat_keluar: 1240, racikan: 46 },
  { tanggal: '14 Jan', resep: 289, obat_keluar: 1540, racikan: 59 }
];

// Data harian Laboratorium
const laboratoriumData = [
  {
    tanggal: '1 Jan',
    pemeriksaan: 156,
    hematologi: 45,
    kimia_darah: 52,
    urinalisis: 35,
    serologi: 24
  },
  {
    tanggal: '2 Jan',
    pemeriksaan: 178,
    hematologi: 52,
    kimia_darah: 58,
    urinalisis: 40,
    serologi: 28
  },
  {
    tanggal: '3 Jan',
    pemeriksaan: 134,
    hematologi: 38,
    kimia_darah: 44,
    urinalisis: 30,
    serologi: 22
  },
  {
    tanggal: '4 Jan',
    pemeriksaan: 192,
    hematologi: 56,
    kimia_darah: 64,
    urinalisis: 43,
    serologi: 29
  },
  {
    tanggal: '5 Jan',
    pemeriksaan: 175,
    hematologi: 50,
    kimia_darah: 59,
    urinalisis: 39,
    serologi: 27
  },
  {
    tanggal: '6 Jan',
    pemeriksaan: 145,
    hematologi: 42,
    kimia_darah: 48,
    urinalisis: 32,
    serologi: 23
  },
  {
    tanggal: '7 Jan',
    pemeriksaan: 168,
    hematologi: 48,
    kimia_darah: 56,
    urinalisis: 38,
    serologi: 26
  },
  {
    tanggal: '8 Jan',
    pemeriksaan: 128,
    hematologi: 36,
    kimia_darah: 42,
    urinalisis: 28,
    serologi: 22
  },
  {
    tanggal: '9 Jan',
    pemeriksaan: 186,
    hematologi: 54,
    kimia_darah: 62,
    urinalisis: 42,
    serologi: 28
  },
  {
    tanggal: '10 Jan',
    pemeriksaan: 198,
    hematologi: 58,
    kimia_darah: 66,
    urinalisis: 45,
    serologi: 29
  },
  {
    tanggal: '11 Jan',
    pemeriksaan: 152,
    hematologi: 44,
    kimia_darah: 50,
    urinalisis: 34,
    serologi: 24
  },
  {
    tanggal: '12 Jan',
    pemeriksaan: 170,
    hematologi: 49,
    kimia_darah: 57,
    urinalisis: 38,
    serologi: 26
  },
  {
    tanggal: '13 Jan',
    pemeriksaan: 158,
    hematologi: 46,
    kimia_darah: 52,
    urinalisis: 35,
    serologi: 25
  },
  {
    tanggal: '14 Jan',
    pemeriksaan: 188,
    hematologi: 55,
    kimia_darah: 63,
    urinalisis: 42,
    serologi: 28
  }
];

// Data harian Rawat Inap
const rawatInapData = [
  {
    tanggal: '1 Jan',
    pasien_masuk: 12,
    pasien_keluar: 10,
    bed_terpakai: 45,
    bed_kosong: 15
  },
  {
    tanggal: '2 Jan',
    pasien_masuk: 15,
    pasien_keluar: 8,
    bed_terpakai: 52,
    bed_kosong: 8
  },
  {
    tanggal: '3 Jan',
    pasien_masuk: 8,
    pasien_keluar: 14,
    bed_terpakai: 46,
    bed_kosong: 14
  },
  {
    tanggal: '4 Jan',
    pasien_masuk: 18,
    pasien_keluar: 12,
    bed_terpakai: 52,
    bed_kosong: 8
  },
  {
    tanggal: '5 Jan',
    pasien_masuk: 14,
    pasien_keluar: 16,
    bed_terpakai: 50,
    bed_kosong: 10
  },
  {
    tanggal: '6 Jan',
    pasien_masuk: 10,
    pasien_keluar: 11,
    bed_terpakai: 49,
    bed_kosong: 11
  },
  {
    tanggal: '7 Jan',
    pasien_masuk: 16,
    pasien_keluar: 13,
    bed_terpakai: 52,
    bed_kosong: 8
  },
  {
    tanggal: '8 Jan',
    pasien_masuk: 7,
    pasien_keluar: 15,
    bed_terpakai: 44,
    bed_kosong: 16
  },
  {
    tanggal: '9 Jan',
    pasien_masuk: 19,
    pasien_keluar: 10,
    bed_terpakai: 53,
    bed_kosong: 7
  },
  {
    tanggal: '10 Jan',
    pasien_masuk: 13,
    pasien_keluar: 14,
    bed_terpakai: 52,
    bed_kosong: 8
  },
  {
    tanggal: '11 Jan',
    pasien_masuk: 11,
    pasien_keluar: 12,
    bed_terpakai: 51,
    bed_kosong: 9
  },
  {
    tanggal: '12 Jan',
    pasien_masuk: 17,
    pasien_keluar: 9,
    bed_terpakai: 59,
    bed_kosong: 1
  },
  {
    tanggal: '13 Jan',
    pasien_masuk: 9,
    pasien_keluar: 18,
    bed_terpakai: 50,
    bed_kosong: 10
  },
  {
    tanggal: '14 Jan',
    pasien_masuk: 14,
    pasien_keluar: 11,
    bed_terpakai: 53,
    bed_kosong: 7
  }
];

// Chart configs
const gawatDaruratConfig: ChartConfig = {
  triase_merah: { label: 'Triase Merah', color: '#ef4444' },
  triase_kuning: { label: 'Triase Kuning', color: '#eab308' },
  triase_hijau: { label: 'Triase Hijau', color: '#22c55e' }
};

const farmasiConfig: ChartConfig = {
  resep: { label: 'Jumlah Resep', color: 'var(--primary)' },
  racikan: { label: 'Obat Racikan', color: '#8b5cf6' }
};

const laboratoriumConfig: ChartConfig = {
  hematologi: { label: 'Hematologi', color: '#ef4444' },
  kimia_darah: { label: 'Kimia Darah', color: '#3b82f6' },
  urinalisis: { label: 'Urinalisis', color: '#eab308' },
  serologi: { label: 'Serologi', color: '#22c55e' }
};

const rawatInapConfig: ChartConfig = {
  pasien_masuk: { label: 'Pasien Masuk', color: '#22c55e' },
  pasien_keluar: { label: 'Pasien Keluar', color: '#ef4444' },
  bed_terpakai: { label: 'Bed Terpakai', color: 'var(--primary)' },
  bed_kosong: { label: 'Bed Kosong', color: '#94a3b8' }
};

export default function LintasKlasterPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const { currentTab, setTab } = useTabFromUrl('gawat-darurat');

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    console.log('Lintas Klaster Filters changed:', newFilters);
  }, []);

  return (
    <PageContainer>
      <div className='space-y-6'>
        <DashboardFilter onFilterChange={handleFilterChange} />

        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Lintas Klaster
            </h2>
            <p className='text-muted-foreground'>
              Monitoring harian layanan Gawat Darurat, Farmasi, Laboratorium,
              dan Rawat Inap
            </p>
          </div>
          <Badge variant='outline' className='flex items-center gap-1'>
            <IconClock className='h-3.5 w-3.5' />
            Data 14 Hari Terakhir
          </Badge>
        </div>

        <Tabs value={currentTab} onValueChange={setTab} className='space-y-4'>
          <TabsList className='grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4'>
            <TabsTrigger
              value='gawat-darurat'
              className='flex items-center gap-1.5'
            >
              <IconAmbulance className='h-4 w-4' />
              <span className='hidden sm:inline'>Gawat Darurat</span>
              <span className='sm:hidden'>UGD</span>
            </TabsTrigger>
            <TabsTrigger value='farmasi' className='flex items-center gap-1.5'>
              <IconPill className='h-4 w-4' />
              <span>Farmasi</span>
            </TabsTrigger>
            <TabsTrigger
              value='laboratorium'
              className='flex items-center gap-1.5'
            >
              <IconMicroscope className='h-4 w-4' />
              <span className='hidden sm:inline'>Laboratorium</span>
              <span className='sm:hidden'>Lab</span>
            </TabsTrigger>
            <TabsTrigger
              value='rawat-inap'
              className='flex items-center gap-1.5'
            >
              <IconBed className='h-4 w-4' />
              <span className='hidden sm:inline'>Rawat Inap</span>
              <span className='sm:hidden'>Ranap</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Gawat Darurat */}
          <TabsContent value='gawat-darurat' className='space-y-4'>
            {/* Summary Stats */}
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Kunjungan
                  </CardTitle>
                  <IconAmbulance className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>699</div>
                  <div className='flex items-center gap-1 text-xs text-green-600'>
                    <IconTrendingUp className='h-3 w-3' />
                    +12.5% dari periode lalu
                  </div>
                </CardContent>
              </Card>
              <Card className='border-red-200 bg-red-50 dark:bg-red-950/20'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Triase Merah
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-red-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-red-600'>79</div>
                  <p className='text-muted-foreground text-xs'>
                    Kasus gawat darurat
                  </p>
                </CardContent>
              </Card>
              <Card className='border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Triase Kuning
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-yellow-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-yellow-600'>228</div>
                  <p className='text-muted-foreground text-xs'>
                    Kasus mendesak
                  </p>
                </CardContent>
              </Card>
              <Card className='border-green-200 bg-green-50 dark:bg-green-950/20'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Triase Hijau
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-green-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>392</div>
                  <p className='text-muted-foreground text-xs'>
                    Kasus tidak mendesak
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Kunjungan Harian UGD</CardTitle>
                  <CardDescription>Total kunjungan per hari</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      kunjungan: { label: 'Kunjungan', color: 'var(--primary)' }
                    }}
                    className='h-[300px] w-full'
                  >
                    <AreaChart data={gawatDaruratData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type='monotone'
                        dataKey='kunjungan'
                        stroke='var(--primary)'
                        fill='var(--primary)'
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Triase Harian</CardTitle>
                  <CardDescription>
                    Berdasarkan tingkat kegawatan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={gawatDaruratConfig}
                    className='h-[300px] w-full'
                  >
                    <BarChart data={gawatDaruratData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey='triase_merah'
                        stackId='a'
                        fill='#ef4444'
                        name='Merah'
                      />
                      <Bar
                        dataKey='triase_kuning'
                        stackId='a'
                        fill='#eab308'
                        name='Kuning'
                      />
                      <Bar
                        dataKey='triase_hijau'
                        stackId='a'
                        fill='#22c55e'
                        name='Hijau'
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Farmasi */}
          <TabsContent value='farmasi' className='space-y-4'>
            {/* Summary Stats */}
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Resep
                  </CardTitle>
                  <IconPill className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>3,462</div>
                  <div className='flex items-center gap-1 text-xs text-green-600'>
                    <IconTrendingUp className='h-3 w-3' />
                    +8.3% dari periode lalu
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Obat Keluar
                  </CardTitle>
                  <IconPill className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>18,520</div>
                  <p className='text-muted-foreground text-xs'>Item obat</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Obat Racikan
                  </CardTitle>
                  <IconPill className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>701</div>
                  <p className='text-muted-foreground text-xs'>Resep racikan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Rata-rata/Hari
                  </CardTitle>
                  <IconPill className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>247</div>
                  <p className='text-muted-foreground text-xs'>
                    Resep per hari
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Jumlah Resep Harian</CardTitle>
                  <CardDescription>Trend resep masuk per hari</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={farmasiConfig}
                    className='h-[300px] w-full'
                  >
                    <LineChart data={farmasiData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='resep'
                        stroke='var(--primary)'
                        strokeWidth={2}
                        dot={{ fill: 'var(--primary)' }}
                      />
                      <Line
                        type='monotone'
                        dataKey='racikan'
                        stroke='#8b5cf6'
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6' }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pemakaian Obat Harian</CardTitle>
                  <CardDescription>
                    Jumlah item obat yang keluar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      obat_keluar: {
                        label: 'Obat Keluar',
                        color: 'var(--primary)'
                      }
                    }}
                    className='h-[300px] w-full'
                  >
                    <AreaChart data={farmasiData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type='monotone'
                        dataKey='obat_keluar'
                        stroke='var(--primary)'
                        fill='var(--primary)'
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Laboratorium */}
          <TabsContent value='laboratorium' className='space-y-4'>
            {/* Summary Stats */}
            <div className='grid gap-4 md:grid-cols-5'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Pemeriksaan
                  </CardTitle>
                  <IconMicroscope className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>2,328</div>
                  <div className='flex items-center gap-1 text-xs text-green-600'>
                    <IconTrendingUp className='h-3 w-3' />
                    +5.7% dari periode lalu
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Hematologi
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-red-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>673</div>
                  <p className='text-muted-foreground text-xs'>
                    28.9% dari total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Kimia Darah
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-blue-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>773</div>
                  <p className='text-muted-foreground text-xs'>
                    33.2% dari total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Urinalisis
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-yellow-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>521</div>
                  <p className='text-muted-foreground text-xs'>
                    22.4% dari total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Serologi
                  </CardTitle>
                  <div className='h-3 w-3 rounded-full bg-green-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>361</div>
                  <p className='text-muted-foreground text-xs'>
                    15.5% dari total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Total Pemeriksaan Harian</CardTitle>
                  <CardDescription>
                    Trend pemeriksaan lab per hari
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      pemeriksaan: {
                        label: 'Pemeriksaan',
                        color: 'var(--primary)'
                      }
                    }}
                    className='h-[300px] w-full'
                  >
                    <AreaChart data={laboratoriumData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type='monotone'
                        dataKey='pemeriksaan'
                        stroke='var(--primary)'
                        fill='var(--primary)'
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pemeriksaan per Kategori</CardTitle>
                  <CardDescription>
                    Distribusi jenis pemeriksaan harian
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={laboratoriumConfig}
                    className='h-[300px] w-full'
                  >
                    <BarChart data={laboratoriumData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey='hematologi'
                        stackId='a'
                        fill='#ef4444'
                        name='Hematologi'
                      />
                      <Bar
                        dataKey='kimia_darah'
                        stackId='a'
                        fill='#3b82f6'
                        name='Kimia Darah'
                      />
                      <Bar
                        dataKey='urinalisis'
                        stackId='a'
                        fill='#eab308'
                        name='Urinalisis'
                      />
                      <Bar
                        dataKey='serologi'
                        stackId='a'
                        fill='#22c55e'
                        name='Serologi'
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Rawat Inap */}
          <TabsContent value='rawat-inap' className='space-y-4'>
            {/* Summary Stats */}
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Masuk
                  </CardTitle>
                  <IconTrendingUp className='h-4 w-4 text-green-600' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>183</div>
                  <p className='text-muted-foreground text-xs'>
                    Pasien masuk (14 hari)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Keluar
                  </CardTitle>
                  <IconTrendingDown className='h-4 w-4 text-red-600' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-red-600'>173</div>
                  <p className='text-muted-foreground text-xs'>
                    Pasien keluar (14 hari)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Bed Terpakai
                  </CardTitle>
                  <IconBed className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>53</div>
                  <p className='text-muted-foreground text-xs'>
                    Dari 60 bed (88.3%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Bed Kosong
                  </CardTitle>
                  <IconBed className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>7</div>
                  <p className='text-muted-foreground text-xs'>
                    Tersedia hari ini
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Pasien Masuk & Keluar</CardTitle>
                  <CardDescription>Pergerakan pasien harian</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={rawatInapConfig}
                    className='h-[300px] w-full'
                  >
                    <LineChart data={rawatInapData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='pasien_masuk'
                        stroke='#22c55e'
                        strokeWidth={2}
                        dot={{ fill: '#22c55e' }}
                        name='Masuk'
                      />
                      <Line
                        type='monotone'
                        dataKey='pasien_keluar'
                        stroke='#ef4444'
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                        name='Keluar'
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Okupansi Bed Harian</CardTitle>
                  <CardDescription>Pemakaian tempat tidur</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={rawatInapConfig}
                    className='h-[300px] w-full'
                  >
                    <AreaChart data={rawatInapData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='tanggal' fontSize={12} />
                      <YAxis fontSize={12} domain={[0, 60]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='bed_terpakai'
                        stackId='1'
                        stroke='var(--primary)'
                        fill='var(--primary)'
                        fillOpacity={0.6}
                        name='Terpakai'
                      />
                      <Area
                        type='monotone'
                        dataKey='bed_kosong'
                        stackId='1'
                        stroke='#94a3b8'
                        fill='#94a3b8'
                        fillOpacity={0.3}
                        name='Kosong'
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
