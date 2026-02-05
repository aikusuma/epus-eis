'use client';

import { useState, useCallback, useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconBabyCarriage,
  IconVaccine,
  IconHeartbeat,
  IconTrendingUp,
  IconTrendingDown,
  IconMoodKid
} from '@tabler/icons-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useTabFromUrl } from '@/hooks/use-tab-from-url';
import { useKlaster2Data, FilterParams } from '@/hooks/use-eis-data';
import { Skeleton } from '@/components/ui/skeleton';

const BULAN_NAMES = [
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
const COLORS = ['#019dae', '#0284c7', '#0369a1', '#075985', '#164e63'];

const chartConfig = {
  k1: { label: 'K1', color: 'var(--primary)' },
  k4: { label: 'K4', color: 'var(--chart-2)' },
  sasaran: { label: 'Sasaran', color: 'var(--muted)' },
  capaian: { label: 'Capaian', color: 'var(--primary)' },
  idl: { label: 'IDL', color: 'var(--chart-3)' }
} satisfies ChartConfig;

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='mt-2 h-8 w-16' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-5 w-20' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='mt-1 h-4 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-[300px] w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Klaster2Page() {
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('anc');

  // Fetch data using SWR hook
  const { data, isLoading, isError } = useKlaster2Data(filters);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const bulan = newFilters.dateRange?.from?.getMonth()
      ? newFilters.dateRange.from.getMonth() + 1
      : undefined;
    const tahun = newFilters.dateRange?.from?.getFullYear() || undefined;

    setFilters({
      puskesmasId: newFilters.puskesmasId || undefined,
      bulan: bulan,
      tahun: tahun
    });
  }, []);

  // Prepare chart data from API response
  const ancData = useMemo(() => {
    if (!data?.anc) return [];
    // anc is single aggregate object, not array
    return [
      {
        puskesmas: 'Total',
        k1: data.anc.k1 || 0,
        k4: data.anc.k4 || 0,
        sasaran: data.anc.target || 0
      }
    ];
  }, [data?.anc]);

  const ancTrendData = useMemo(() => {
    if (!data?.ancTrend) return [];
    return data.ancTrend.map((item: any) => ({
      bulan: item.bulan,
      k1: item.k1,
      k4: item.k4
    }));
  }, [data?.ancTrend]);

  const imunisasiData = useMemo(() => {
    if (!data?.imunisasi) return [];
    return data.imunisasi.map((item: any) => ({
      jenis: item.jenis,
      sasaran: item.sasaran,
      capaian: item.capaian
    }));
  }, [data?.imunisasi]);

  // Summary data
  const summary = data?.summary || {
    capaianK1: 0,
    capaianK4: 0,
    totalK1: 0,
    totalK4: 0,
    capaianIdl: 0,
    totalIdl: 0,
    sasaranImunisasi: 0
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Klaster 2: Ibu dan Anak
          </h2>
        </div>

        <DashboardFilter onFilterChange={handleFilterChange} />

        <Tabs value={currentTab} onValueChange={setTab} className='space-y-4'>
          <TabsList className='flex-wrap'>
            <TabsTrigger value='anc' className='flex items-center gap-2'>
              <IconHeartbeat className='size-4' />
              Antenatal Care
            </TabsTrigger>
            <TabsTrigger
              value='imunisasi-bayi'
              className='flex items-center gap-2'
            >
              <IconBabyCarriage className='size-4' />
              Imunisasi Bayi
            </TabsTrigger>
            <TabsTrigger
              value='imunisasi-baduta'
              className='flex items-center gap-2'
            >
              <IconMoodKid className='size-4' />
              Imunisasi Baduta
            </TabsTrigger>
            <TabsTrigger value='bias' className='flex items-center gap-2'>
              <IconVaccine className='size-4' />
              BIAS
            </TabsTrigger>
          </TabsList>

          {/* Tab Antenatal Care */}
          <TabsContent value='anc' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Kunjungan K1</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalK1.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        {summary.capaianK1}% dari sasaran
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Kunjungan K4</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalK4.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        {summary.capaianK4}% capaian K4
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total IDL</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalIdl.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        {summary.capaianIdl}% dari sasaran
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Sasaran Imunisasi</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.sasaranImunisasi.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Bayi & Baduta</Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Capaian ANC per Puskesmas</CardTitle>
                      <CardDescription>K1 dan K4 vs Sasaran</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={ancData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='puskesmas' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey='k1' fill='var(--color-k1)' radius={4} />
                          <Bar dataKey='k4' fill='var(--color-k4)' radius={4} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tren ANC Bulanan</CardTitle>
                      <CardDescription>Perkembangan K1 dan K4</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <LineChart data={ancTrendData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='bulan' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type='monotone'
                            dataKey='k1'
                            stroke='var(--primary)'
                            strokeWidth={2}
                          />
                          <Line
                            type='monotone'
                            dataKey='k4'
                            stroke='var(--chart-2)'
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Imunisasi Bayi */}
          <TabsContent value='imunisasi-bayi' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Sasaran Bayi</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.sasaranImunisasi.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Tahun ini</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total IDL</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalIdl.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        {summary.capaianIdl}% capaian
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Jenis Imunisasi</CardDescription>
                      <CardTitle className='text-3xl'>
                        {imunisasiData.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Terdaftar</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Status</CardDescription>
                      <CardTitle className='text-3xl text-green-600'>
                        Aktif
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        Berjalan baik
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Capaian Imunisasi</CardTitle>
                      <CardDescription>
                        Sasaran vs Capaian per jenis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[350px]'
                      >
                        <BarChart data={imunisasiData} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' />
                          <YAxis
                            dataKey='jenis'
                            type='category'
                            width={120}
                            fontSize={12}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='sasaran'
                            fill='var(--color-sasaran)'
                            radius={4}
                          />
                          <Bar
                            dataKey='capaian'
                            fill='var(--color-capaian)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Capaian Imunisasi</CardTitle>
                      <CardDescription>
                        Proporsi per jenis imunisasi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[350px]'
                      >
                        <PieChart>
                          <Pie
                            data={imunisasiData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ jenis, percent }) =>
                              `${jenis}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill='#8884d8'
                            dataKey='capaian'
                          >
                            {imunisasiData.map((_: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Imunisasi Baduta */}
          <TabsContent value='imunisasi-baduta' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Imunisasi Baduta</CardTitle>
                      <CardDescription>
                        Data imunisasi anak di bawah dua tahun
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={imunisasiData.slice(0, 4)}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='jenis' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='sasaran'
                            fill='var(--color-sasaran)'
                            radius={4}
                          />
                          <Bar
                            dataKey='capaian'
                            fill='var(--color-capaian)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ringkasan Baduta</CardTitle>
                      <CardDescription>Statistik keseluruhan</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex justify-between'>
                        <span>Total Sasaran</span>
                        <span className='font-semibold'>
                          {summary.sasaranImunisasi.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Total Capaian</span>
                        <span className='font-semibold text-green-600'>
                          {summary.totalIdl.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Persentase</span>
                        <span className='font-semibold'>
                          {summary.capaianIdl}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab BIAS */}
          <TabsContent value='bias' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>BIAS (Bulan Imunisasi Anak Sekolah)</CardTitle>
                      <CardDescription>
                        Data imunisasi anak sekolah
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={imunisasiData.slice(0, 3)}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='jenis' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='sasaran'
                            fill='var(--color-sasaran)'
                            radius={4}
                          />
                          <Bar
                            dataKey='capaian'
                            fill='var(--color-capaian)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ringkasan BIAS</CardTitle>
                      <CardDescription>Statistik keseluruhan</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex justify-between'>
                        <span>Sasaran BIAS</span>
                        <span className='font-semibold'>
                          {summary.sasaranImunisasi.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Sudah Imunisasi</span>
                        <span className='font-semibold text-green-600'>
                          {summary.totalIdl.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Capaian</span>
                        <span className='font-semibold'>
                          {summary.capaianIdl}%
                        </span>
                      </div>
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
