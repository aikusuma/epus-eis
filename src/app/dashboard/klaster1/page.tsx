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
  IconUsers,
  IconPill,
  IconCash,
  IconTrendingUp,
  IconTrendingDown,
  IconLoader
} from '@tabler/icons-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useTabFromUrl } from '@/hooks/use-tab-from-url';
import { useKlaster1Data, FilterParams } from '@/hooks/use-eis-data';
import { Skeleton } from '@/components/ui/skeleton';

// Month names for trend data
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

const COLORS = [
  '#019dae',
  '#0284c7',
  '#0369a1',
  '#075985',
  '#164e63',
  '#155e75'
];

const sdmChartConfig = {
  jumlah: { label: 'Jumlah', color: 'var(--primary)' },
  target: { label: 'Target', color: 'var(--muted)' }
} satisfies ChartConfig;

const obatChartConfig = {
  stok: { label: 'Stok', color: 'var(--primary)' },
  pemakaian: { label: 'Pemakaian', color: 'var(--chart-2)' }
} satisfies ChartConfig;

const keuanganChartConfig = {
  pendapatan: { label: 'Pendapatan (Juta)', color: 'var(--primary)' },
  pengeluaran: { label: 'Pengeluaran (Juta)', color: 'var(--destructive)' }
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

export default function Klaster1Page() {
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('sdm');

  // Fetch data using SWR hook
  const { data, isLoading, isError } = useKlaster1Data(filters);

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
  const sdmData = useMemo(() => {
    if (!data?.sdm) return [];
    return data.sdm.map((item: any) => ({
      kategori: item.kategori,
      jumlah: item.jumlah,
      target: item.target
    }));
  }, [data?.sdm]);

  const sdmTrendData = useMemo(() => {
    if (!data?.sdmTrend) return [];
    return data.sdmTrend.map((item: any) => ({
      bulan: item.bulan,
      dokter: item.dokter_umum || item.dokter || 0,
      perawat: item.perawat || 0,
      bidan: item.bidan || 0
    }));
  }, [data?.sdmTrend]);

  const stokObatData = useMemo(() => {
    if (!data?.obat) return [];
    return data.obat.slice(0, 8).map((item: any) => ({
      nama: item.nama,
      stok: item.stok,
      pemakaian: item.pemakaian,
      satuan: item.satuan
    }));
  }, [data?.obat]);

  const keuanganData = useMemo(() => {
    if (!data?.keuangan) return [];
    return data.keuangan.map((item: any) => ({
      kategori: item.kategori,
      nominal: item.nominal
    }));
  }, [data?.keuangan]);

  const keuanganTrend = useMemo(() => {
    if (!data?.keuanganTrend) return [];
    return data.keuanganTrend.map((item: any) => ({
      bulan: BULAN_NAMES[item.bulan - 1] || item.bulan,
      pendapatan: item.pendapatan / 1000000, // Convert to millions
      pengeluaran: item.pengeluaran / 1000000
    }));
  }, [data?.keuanganTrend]);

  // Summary data
  const summary = data?.summary || {
    totalNakes: 0,
    targetNakes: 0,
    rasioNakes: '-',
    totalPendapatan: 0,
    totalObat: 0,
    pemakaianObat: 0
  };

  const ketersediaanSDM =
    summary.targetNakes > 0
      ? Math.round((summary.totalNakes / summary.targetNakes) * 100)
      : 0;
  const kekuranganSDM = Math.max(0, summary.targetNakes - summary.totalNakes);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Klaster 1: SDM, Obat & Keuangan
          </h2>
        </div>

        <DashboardFilter
          onFilterChange={handleFilterChange}
          showJenisLayanan={false}
        />

        <Tabs value={currentTab} onValueChange={setTab} className='space-y-4'>
          <TabsList>
            <TabsTrigger value='sdm' className='flex items-center gap-2'>
              <IconUsers className='size-4' />
              Data SDM
            </TabsTrigger>
            <TabsTrigger value='obat' className='flex items-center gap-2'>
              <IconPill className='size-4' />
              Stok & Pemakaian Obat
            </TabsTrigger>
            <TabsTrigger value='keuangan' className='flex items-center gap-2'>
              <IconCash className='size-4' />
              Data Keuangan
            </TabsTrigger>
          </TabsList>

          {/* Tab SDM */}
          <TabsContent value='sdm' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Tenaga Kesehatan</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalNakes.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        Target: {summary.targetNakes.toLocaleString()}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Rasio Nakes/Penduduk</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.rasioNakes}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Target: 1:2,500</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Ketersediaan SDM</CardDescription>
                      <CardTitle className='text-3xl'>
                        {ketersediaanSDM}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        variant='outline'
                        className={
                          kekuranganSDM > 0
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }
                      >
                        {kekuranganSDM > 0
                          ? `Perlu tambahan ${kekuranganSDM} orang`
                          : 'Tercapai'}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Pemakaian Obat</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.pemakaianObat.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        Bulan ini
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi SDM per Kategori</CardTitle>
                      <CardDescription>Jumlah vs Target</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={sdmChartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={sdmData} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' />
                          <YAxis
                            dataKey='kategori'
                            type='category'
                            width={100}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='jumlah'
                            fill='var(--color-jumlah)'
                            radius={4}
                          />
                          <Bar
                            dataKey='target'
                            fill='var(--color-target)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tren SDM 6 Bulan Terakhir</CardTitle>
                      <CardDescription>
                        Perkembangan jumlah tenaga kesehatan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={sdmChartConfig}
                        className='h-[300px]'
                      >
                        <LineChart data={sdmTrendData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='bulan' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type='monotone'
                            dataKey='dokter'
                            stroke='var(--primary)'
                            strokeWidth={2}
                          />
                          <Line
                            type='monotone'
                            dataKey='perawat'
                            stroke='var(--chart-2)'
                            strokeWidth={2}
                          />
                          <Line
                            type='monotone'
                            dataKey='bidan'
                            stroke='var(--chart-3)'
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

          {/* Tab Obat */}
          <TabsContent value='obat' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Item Obat</CardDescription>
                      <CardTitle className='text-3xl'>
                        {stokObatData.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Fornas 2024</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Stok</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalObat.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        Tersedia
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Stok Kritis</CardDescription>
                      <CardTitle className='text-3xl text-red-600'>
                        {
                          stokObatData.filter(
                            (o: any) => o.stok < o.pemakaian * 0.5
                          ).length
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='destructive'>
                        <IconTrendingDown className='mr-1 size-3' />
                        Perlu restock
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Pemakaian Bulan Ini</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.pemakaianObat.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        Aktif
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 8 Obat - Stok vs Pemakaian</CardTitle>
                      <CardDescription>
                        Perbandingan stok dan pemakaian bulan ini
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={obatChartConfig}
                        className='h-[350px]'
                      >
                        <BarChart data={stokObatData} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' />
                          <YAxis
                            dataKey='nama'
                            type='category'
                            width={120}
                            fontSize={12}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='stok'
                            fill='var(--color-stok)'
                            radius={4}
                          />
                          <Bar
                            dataKey='pemakaian'
                            fill='var(--color-pemakaian)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Stok Obat</CardTitle>
                      <CardDescription>Proporsi stok per obat</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={obatChartConfig}
                        className='h-[350px]'
                      >
                        <PieChart>
                          <Pie
                            data={stokObatData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ nama, percent }) =>
                              `${nama.substring(0, 10)}...: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill='#8884d8'
                            dataKey='stok'
                          >
                            {stokObatData.map((_: any, index: number) => (
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

          {/* Tab Keuangan */}
          <TabsContent value='keuangan' className='space-y-4'>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Pendapatan</CardDescription>
                      <CardTitle className='text-3xl'>
                        Rp {(summary.totalPendapatan / 1000000000).toFixed(2)} M
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        <IconTrendingUp className='mr-1 size-3' />
                        Tahun ini
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Kategori Terbesar</CardDescription>
                      <CardTitle className='text-3xl'>
                        {keuanganData[0]?.kategori || '-'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>
                        {keuanganData[0]
                          ? `Rp ${(keuanganData[0].nominal / 1000000000).toFixed(2)} M`
                          : '-'}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Jumlah Sumber Dana</CardDescription>
                      <CardTitle className='text-3xl'>
                        {keuanganData.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        Aktif
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Rata-rata per Bulan</CardDescription>
                      <CardTitle className='text-3xl'>
                        Rp {(summary.totalPendapatan / 12 / 1000000).toFixed(0)}{' '}
                        Jt
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Proyeksi</Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Komposisi Pendapatan</CardTitle>
                      <CardDescription>Berdasarkan sumber dana</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={keuanganChartConfig}
                        className='h-[300px]'
                      >
                        <PieChart>
                          <Pie
                            data={keuanganData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ kategori, percent }) =>
                              `${kategori}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill='#8884d8'
                            dataKey='nominal'
                          >
                            {keuanganData.map((_: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) =>
                              `Rp ${(value / 1000000000).toFixed(2)} M`
                            }
                          />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tren Pendapatan vs Pengeluaran</CardTitle>
                      <CardDescription>
                        Dalam jutaan rupiah - per bulan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={keuanganChartConfig}
                        className='h-[300px]'
                      >
                        <LineChart data={keuanganTrend}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='bulan' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type='monotone'
                            dataKey='pendapatan'
                            stroke='var(--primary)'
                            strokeWidth={2}
                          />
                          <Line
                            type='monotone'
                            dataKey='pengeluaran'
                            stroke='var(--destructive)'
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
        </Tabs>
      </div>
    </PageContainer>
  );
}
