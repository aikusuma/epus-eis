'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { useLintasKlasterData, FilterParams } from '@/hooks/use-eis-data';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('gawat-darurat');

  // Fetch data using SWR
  const { data, isLoading, isError } = useLintasKlasterData(filters);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const date = newFilters.dateRange?.from;
    setFilters({
      puskesmasId: newFilters.puskesmasId || undefined,
      tanggal: date ? date.toISOString() : undefined
    });
  }, []);

  // Transform data for charts
  const gawatDaruratData = useMemo(() => {
    if (!data?.gawatDarurat?.data) return [];
    return data.gawatDarurat.data.map((item: any) => ({
      tanggal: new Date(item.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      kunjungan: item.totalKunjungan,
      triase_merah: item.triaseMerah,
      triase_kuning: item.triaseKuning,
      triase_hijau: item.triaseHijau
    }));
  }, [data?.gawatDarurat?.data]);

  const farmasiData = useMemo(() => {
    if (!data?.farmasi?.data) return [];
    return data.farmasi.data.map((item: any) => ({
      tanggal: new Date(item.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      resep: item.jumlahResep,
      obat_keluar: item.obatKeluar,
      racikan: item.racikan
    }));
  }, [data?.farmasi?.data]);

  const laboratoriumData = useMemo(() => {
    if (!data?.laboratorium?.data) return [];
    return data.laboratorium.data.map((item: any) => ({
      tanggal: new Date(item.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      pemeriksaan: item.totalPemeriksaan,
      hematologi: item.hematologi,
      kimia_darah: item.kimiaDarah,
      urinalisis: item.urinalisis,
      serologi: item.serologi
    }));
  }, [data?.laboratorium?.data]);

  const rawatInapData = useMemo(() => {
    if (!data?.rawatInap?.data) return [];
    return data.rawatInap.data.map((item: any) => ({
      tanggal: new Date(item.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      }),
      pasien_masuk: item.pasienMasuk,
      pasien_keluar: item.pasienKeluar,
      bed_terpakai: item.bedTerpakai,
      bed_kosong: item.bedKosong
    }));
  }, [data?.rawatInap?.data]);

  // Summary data
  const gawatDaruratSummary = data?.gawatDarurat?.summary || {
    totalKunjungan: 0,
    triaseMerah: 0,
    triaseKuning: 0,
    triaseHijau: 0
  };

  const farmasiSummary = data?.farmasi?.summary || {
    totalResep: 0,
    totalObatKeluar: 0,
    totalRacikan: 0
  };

  const laboratoriumSummary = data?.laboratorium?.summary || {
    totalPemeriksaan: 0,
    hematologi: 0,
    kimiaDarah: 0,
    urinalisis: 0,
    serologi: 0
  };

  const rawatInapSummary = data?.rawatInap?.summary || {
    totalPasienMasuk: 0,
    totalPasienKeluar: 0,
    bedTerpakai: 0,
    bedKosong: 0
  };

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
            {isLoading ? (
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-4'>
                  {[...Array(4)].map((_, i) => (
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
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <Skeleton className='h-6 w-48' />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className='h-[300px]' />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <Skeleton className='h-6 w-48' />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className='h-[300px]' />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <>
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
                      <div className='text-2xl font-bold'>
                        {gawatDaruratSummary.totalKunjungan?.toLocaleString() ||
                          0}
                      </div>
                      <div className='flex items-center gap-1 text-xs text-green-600'>
                        <IconTrendingUp className='h-3 w-3' />
                        Data periode ini
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
                      <div className='text-2xl font-bold text-red-600'>
                        {gawatDaruratSummary.triaseMerah?.toLocaleString() || 0}
                      </div>
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
                      <div className='text-2xl font-bold text-yellow-600'>
                        {gawatDaruratSummary.triaseKuning?.toLocaleString() ||
                          0}
                      </div>
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
                      <div className='text-2xl font-bold text-green-600'>
                        {gawatDaruratSummary.triaseHijau?.toLocaleString() || 0}
                      </div>
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
                      <CardDescription>
                        Total kunjungan per hari
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          kunjungan: {
                            label: 'Kunjungan',
                            color: 'var(--primary)'
                          }
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
              </>
            )}
          </TabsContent>

          {/* Tab Farmasi */}
          <TabsContent value='farmasi' className='space-y-4'>
            {isLoading ? (
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-4'>
                  {[...Array(4)].map((_, i) => (
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
              </div>
            ) : (
              <>
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
                      <div className='text-2xl font-bold'>
                        {farmasiSummary.totalResep?.toLocaleString() || 0}
                      </div>
                      <div className='flex items-center gap-1 text-xs text-green-600'>
                        <IconTrendingUp className='h-3 w-3' />
                        Data periode ini
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
                      <div className='text-2xl font-bold'>
                        {farmasiSummary.totalObatKeluar?.toLocaleString() || 0}
                      </div>
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
                      <div className='text-2xl font-bold'>
                        {farmasiSummary.totalRacikan?.toLocaleString() || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Resep racikan
                      </p>
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
                      <div className='text-2xl font-bold'>
                        {farmasiData.length > 0
                          ? Math.round(
                              farmasiSummary.totalResep / farmasiData.length
                            )
                          : 0}
                      </div>
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
                      <CardDescription>
                        Trend resep masuk per hari
                      </CardDescription>
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
              </>
            )}
          </TabsContent>

          {/* Tab Laboratorium */}
          <TabsContent value='laboratorium' className='space-y-4'>
            {isLoading ? (
              <div className='space-y-4'>
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
              </div>
            ) : (
              <>
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
                      <div className='text-2xl font-bold'>
                        {laboratoriumSummary.totalPemeriksaan?.toLocaleString() ||
                          0}
                      </div>
                      <div className='flex items-center gap-1 text-xs text-green-600'>
                        <IconTrendingUp className='h-3 w-3' />
                        Data periode ini
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
                      <div className='text-2xl font-bold'>
                        {laboratoriumSummary.hematologi?.toLocaleString() || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {laboratoriumSummary.totalPemeriksaan
                          ? (
                              (laboratoriumSummary.hematologi /
                                laboratoriumSummary.totalPemeriksaan) *
                              100
                            ).toFixed(1)
                          : 0}
                        % dari total
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
                      <div className='text-2xl font-bold'>
                        {laboratoriumSummary.kimiaDarah?.toLocaleString() || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {laboratoriumSummary.totalPemeriksaan
                          ? (
                              (laboratoriumSummary.kimiaDarah /
                                laboratoriumSummary.totalPemeriksaan) *
                              100
                            ).toFixed(1)
                          : 0}
                        % dari total
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
                      <div className='text-2xl font-bold'>
                        {laboratoriumSummary.urinalisis?.toLocaleString() || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {laboratoriumSummary.totalPemeriksaan
                          ? (
                              (laboratoriumSummary.urinalisis /
                                laboratoriumSummary.totalPemeriksaan) *
                              100
                            ).toFixed(1)
                          : 0}
                        % dari total
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
                      <div className='text-2xl font-bold'>
                        {laboratoriumSummary.serologi?.toLocaleString() || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {laboratoriumSummary.totalPemeriksaan
                          ? (
                              (laboratoriumSummary.serologi /
                                laboratoriumSummary.totalPemeriksaan) *
                              100
                            ).toFixed(1)
                          : 0}
                        % dari total
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
              </>
            )}
          </TabsContent>

          {/* Tab Rawat Inap */}
          <TabsContent value='rawat-inap' className='space-y-4'>
            {isLoading ? (
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-4'>
                  {[...Array(4)].map((_, i) => (
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
              </div>
            ) : (
              <>
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
                      <div className='text-2xl font-bold text-green-600'>
                        {rawatInapSummary.totalPasienMasuk?.toLocaleString() ||
                          0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Pasien masuk periode ini
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
                      <div className='text-2xl font-bold text-red-600'>
                        {rawatInapSummary.totalPasienKeluar?.toLocaleString() ||
                          0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Pasien keluar periode ini
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
                      <div className='text-2xl font-bold'>
                        {rawatInapSummary.bedTerpakai || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Terpakai saat ini
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
                      <div className='text-2xl font-bold'>
                        {rawatInapSummary.bedKosong || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Tersedia saat ini
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Pasien Masuk & Keluar</CardTitle>
                      <CardDescription>
                        Pergerakan pasien harian
                      </CardDescription>
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
