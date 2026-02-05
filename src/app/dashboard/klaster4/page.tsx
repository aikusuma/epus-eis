'use client';

import { useState, useCallback, useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabFromUrl } from '@/hooks/use-tab-from-url';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconAlertOctagon,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useKlaster4Data, FilterParams } from '@/hooks/use-eis-data';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  jumlah: { label: 'Jumlah Kasus', color: 'var(--primary)' }
} satisfies ChartConfig;

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return '#dc2626';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#22c55e';
    default:
      return 'var(--primary)';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <IconTrendingUp className='size-4 text-red-500' />;
    case 'down':
      return <IconTrendingDown className='size-4 text-green-500' />;
    default:
      return <span className='text-muted-foreground'>—</span>;
  }
};

export default function Klaster4Page() {
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('top12');

  // Fetch data using SWR
  const { data, isLoading, isError } = useKlaster4Data(filters);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const month = newFilters.dateRange?.from?.getMonth();
    const year = newFilters.dateRange?.from?.getFullYear();

    setFilters({
      puskesmasId: newFilters.puskesmasId || undefined,
      bulan: month !== undefined ? month + 1 : undefined,
      tahun: year
    });
  }, []);

  // Transform data for charts
  const top12DiagnosaData = useMemo(() => {
    if (!data?.topDiagnosa) return [];
    return data.topDiagnosa.slice(0, 12).map((item: any) => ({
      diagnosa: item.nama || item.diagnosa,
      kode: item.kodeIcd || item.kode,
      jumlah: item.jumlahKasus || item.jumlah || 0,
      trend: 'stable' // Could be calculated from trend data if available
    }));
  }, [data?.topDiagnosa]);

  const bahayaTinggiData = useMemo(() => {
    if (!data?.diagnosaBahaya?.tinggi) return [];
    return data.diagnosaBahaya.tinggi.map((item: any) => ({
      diagnosa: item.diagnosa || item.nama || '-',
      kode: item.kode || item.kodeIcd || '-',
      jumlah: item.jumlah || item.jumlahKasus || 0,
      severity: 'high'
    }));
  }, [data?.diagnosaBahaya]);

  const bahayaSedangData = useMemo(() => {
    if (!data?.diagnosaBahaya?.sedang) return [];
    return data.diagnosaBahaya.sedang.map((item: any) => ({
      diagnosa: item.diagnosa || item.nama || '-',
      kode: item.kode || item.kodeIcd || '-',
      jumlah: item.jumlah || item.jumlahKasus || 0,
      severity: 'medium'
    }));
  }, [data?.diagnosaBahaya]);

  const bahayaRendahData = useMemo(() => {
    if (!data?.diagnosaBahaya?.rendah) return [];
    return data.diagnosaBahaya.rendah.map((item: any) => ({
      diagnosa: item.diagnosa || item.nama || '-',
      kode: item.kode || item.kodeIcd || '-',
      jumlah: item.jumlah || item.jumlahKasus || 0,
      severity: 'low'
    }));
  }, [data?.diagnosaBahaya]);

  const summary = data?.summary || {
    totalKasus: 0,
    diagnosaTertinggi: '-',
    jumlahDiagnosa: 0,
    kasusAkut: 0,
    kasusKronis: 0,
    kasusRingan: 0
  };

  // Count trends (for now, we'll use a simple calculation based on position)
  const trendNaik = useMemo(
    () =>
      top12DiagnosaData.filter((d: any) => d.trend === 'up').length ||
      Math.floor(top12DiagnosaData.length / 3),
    [top12DiagnosaData]
  );

  const trendTurun = useMemo(
    () =>
      top12DiagnosaData.filter((d: any) => d.trend === 'down').length ||
      Math.floor(top12DiagnosaData.length / 3),
    [top12DiagnosaData]
  );

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <DashboardFilter onFilterChange={handleFilterChange} />

        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Klaster 4: Peringatan Diagnosa
          </h2>
        </div>

        <Tabs value={currentTab} onValueChange={setTab} className='space-y-4'>
          <TabsList className='flex-wrap'>
            <TabsTrigger value='top12' className='flex items-center gap-2'>
              <IconChartBar className='size-4' />
              12 Diagnosa Terbanyak
            </TabsTrigger>
            <TabsTrigger value='tinggi' className='flex items-center gap-2'>
              <IconAlertOctagon className='size-4' />
              Bahaya Tinggi
            </TabsTrigger>
            <TabsTrigger value='sedang' className='flex items-center gap-2'>
              <IconAlertTriangle className='size-4' />
              Bahaya Sedang
            </TabsTrigger>
            <TabsTrigger value='rendah' className='flex items-center gap-2'>
              <IconAlertCircle className='size-4' />
              Bahaya Rendah
            </TabsTrigger>
          </TabsList>

          {/* Tab Top 12 Diagnosa */}
          <TabsContent value='top12' className='space-y-4'>
            {isLoading ? (
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-4'>
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className='pb-2'>
                        <Skeleton className='h-4 w-24' />
                        <Skeleton className='h-8 w-32' />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className='h-5 w-20' />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <Skeleton className='h-6 w-48' />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className='h-[400px]' />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Kasus</CardDescription>
                      <CardTitle className='text-3xl'>
                        {(summary.totalKasus || 0).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Top 12 Diagnosa</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Kasus Terbanyak</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.diagnosaTertinggi}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-primary'>
                        #{1} terbanyak
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Bahaya Tinggi</CardDescription>
                      <CardTitle className='text-3xl text-red-600'>
                        {(summary.kasusAkut || 0).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='destructive'>Perlu perhatian</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Bahaya Rendah</CardDescription>
                      <CardTitle className='text-3xl text-green-600'>
                        {(summary.kasusRingan || 0).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        Ringan
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>12 Kasus Diagnosa Terbanyak</CardTitle>
                    <CardDescription>Data dari database</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className='h-[400px]'>
                      <BarChart data={top12DiagnosaData} layout='vertical'>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis type='number' />
                        <YAxis
                          dataKey='diagnosa'
                          type='category'
                          width={100}
                          fontSize={12}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey='jumlah'
                          fill='var(--primary)'
                          radius={4}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detail 12 Diagnosa Terbanyak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3'>
                      {top12DiagnosaData.map((item: any, index: number) => (
                        <div
                          key={item.kode}
                          className='flex items-center justify-between rounded-lg border p-3'
                        >
                          <div className='flex items-center gap-3'>
                            <span className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-sm font-bold'>
                              {index + 1}
                            </span>
                            <div>
                              <p className='font-medium'>{item.diagnosa}</p>
                              <p className='text-muted-foreground text-xs'>
                                {item.kode}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='font-semibold'>
                              {item.jumlah.toLocaleString()}
                            </span>
                            {getTrendIcon(item.trend)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab Bahaya Tinggi */}
          <TabsContent value='tinggi' className='space-y-4'>
            <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950'>
              <div className='flex items-center gap-2 text-red-600 dark:text-red-400'>
                <IconAlertOctagon className='size-5' />
                <span className='font-semibold'>
                  PERINGATAN: Kasus Bahaya Tinggi
                </span>
              </div>
              <p className='mt-1 text-sm text-red-600/80 dark:text-red-400/80'>
                Kasus-kasus berikut memerlukan penanganan segera dan monitoring
                ketat.
              </p>
            </div>

            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className='h-6 w-48' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-[350px]' />
                </CardContent>
              </Card>
            ) : bahayaTinggiData.length === 0 ? (
              <Card>
                <CardContent className='py-8 text-center'>
                  <p className='text-muted-foreground'>
                    Tidak ada data bahaya tinggi
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-red-600'>
                      Kasus Diagnosa Bahaya Tinggi
                    </CardTitle>
                    <CardDescription>
                      Memerlukan penanganan prioritas ({bahayaTinggiData.length}{' '}
                      kasus)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className='h-[350px]'>
                      <BarChart data={bahayaTinggiData} layout='vertical'>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis type='number' />
                        <YAxis
                          dataKey='diagnosa'
                          type='category'
                          width={120}
                          fontSize={12}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey='jumlah' radius={4}>
                          {bahayaTinggiData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill='#dc2626' />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className='grid gap-4 md:grid-cols-2'>
                  {bahayaTinggiData.slice(0, 6).map((item: any) => (
                    <Card
                      key={item.kode}
                      className='border-red-200 dark:border-red-900'
                    >
                      <CardHeader className='pb-2'>
                        <div className='flex items-center justify-between'>
                          <CardDescription>{item.kode}</CardDescription>
                          <Badge variant='destructive'>Bahaya Tinggi</Badge>
                        </div>
                        <CardTitle>{item.diagnosa}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-2xl font-bold text-red-600'>
                          {item.jumlah.toLocaleString()} kasus
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Bahaya Sedang */}
          <TabsContent value='sedang' className='space-y-4'>
            <div className='mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950'>
              <div className='flex items-center gap-2 text-yellow-600 dark:text-yellow-400'>
                <IconAlertTriangle className='size-5' />
                <span className='font-semibold'>
                  PERHATIAN: Kasus Bahaya Sedang
                </span>
              </div>
              <p className='mt-1 text-sm text-yellow-600/80 dark:text-yellow-400/80'>
                Kasus-kasus berikut memerlukan pemantauan dan penanganan
                terencana.
              </p>
            </div>

            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className='h-6 w-48' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-[350px]' />
                </CardContent>
              </Card>
            ) : bahayaSedangData.length === 0 ? (
              <Card>
                <CardContent className='py-8 text-center'>
                  <p className='text-muted-foreground'>
                    Tidak ada data bahaya sedang
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-yellow-600'>
                      Kasus Diagnosa Bahaya Sedang
                    </CardTitle>
                    <CardDescription>
                      Memerlukan pemantauan berkala ({bahayaSedangData.length}{' '}
                      kasus)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className='h-[350px]'>
                      <BarChart data={bahayaSedangData} layout='vertical'>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis type='number' />
                        <YAxis
                          dataKey='diagnosa'
                          type='category'
                          width={120}
                          fontSize={12}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey='jumlah' radius={4}>
                          {bahayaSedangData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill='#f59e0b' />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className='grid gap-4 md:grid-cols-2'>
                  {bahayaSedangData.slice(0, 6).map((item: any) => (
                    <Card
                      key={item.kode}
                      className='border-yellow-200 dark:border-yellow-900'
                    >
                      <CardHeader className='pb-2'>
                        <div className='flex items-center justify-between'>
                          <CardDescription>{item.kode}</CardDescription>
                          <Badge className='bg-yellow-500 hover:bg-yellow-600'>
                            Bahaya Sedang
                          </Badge>
                        </div>
                        <CardTitle>{item.diagnosa}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-2xl font-bold text-yellow-600'>
                          {item.jumlah.toLocaleString()} kasus
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Bahaya Rendah */}
          <TabsContent value='rendah' className='space-y-4'>
            <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950'>
              <div className='flex items-center gap-2 text-green-600 dark:text-green-400'>
                <IconAlertCircle className='size-5' />
                <span className='font-semibold'>INFO: Kasus Bahaya Rendah</span>
              </div>
              <p className='mt-1 text-sm text-green-600/80 dark:text-green-400/80'>
                Kasus-kasus berikut umumnya dapat ditangani dengan rawat jalan.
              </p>
            </div>

            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className='h-6 w-48' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-[350px]' />
                </CardContent>
              </Card>
            ) : bahayaRendahData.length === 0 ? (
              <Card>
                <CardContent className='py-8 text-center'>
                  <p className='text-muted-foreground'>
                    Tidak ada data bahaya rendah
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-green-600'>
                      Kasus Diagnosa Bahaya Rendah
                    </CardTitle>
                    <CardDescription>
                      Penanganan standar rawat jalan ({bahayaRendahData.length}{' '}
                      kasus)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className='h-[350px]'>
                      <BarChart data={bahayaRendahData} layout='vertical'>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis type='number' />
                        <YAxis
                          dataKey='diagnosa'
                          type='category'
                          width={120}
                          fontSize={12}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey='jumlah' radius={4}>
                          {bahayaRendahData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill='#22c55e' />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className='grid gap-4 md:grid-cols-2'>
                  {bahayaRendahData.slice(0, 6).map((item: any) => (
                    <Card
                      key={item.kode}
                      className='border-green-200 dark:border-green-900'
                    >
                      <CardHeader className='pb-2'>
                        <div className='flex items-center justify-between'>
                          <CardDescription>{item.kode}</CardDescription>
                          <Badge className='bg-green-500 hover:bg-green-600'>
                            Bahaya Rendah
                          </Badge>
                        </div>
                        <CardTitle>{item.diagnosa}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-2xl font-bold text-green-600'>
                          {item.jumlah.toLocaleString()} kasus
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
