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
  IconSearch,
  IconAlertTriangle,
  IconStethoscope,
  IconDental,
  IconTrendingUp,
  IconTrendingDown
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
import { useKlaster3Data, FilterParams } from '@/hooks/use-eis-data';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';

const COLORS = [
  '#019dae',
  '#0284c7',
  '#0369a1',
  '#075985',
  '#164e63',
  '#155e75'
];

const chartConfig = {
  sasaran: { label: 'Sasaran', color: 'var(--muted)' },
  capaian: { label: 'Capaian', color: 'var(--primary)' },
  jumlahPasien: { label: 'Jumlah Pasien', color: 'var(--primary)' },
  positif: { label: 'Positif', color: 'var(--destructive)' },
  negatif: { label: 'Negatif', color: 'var(--chart-2)' },
  terdeteksi: { label: 'Terdeteksi', color: 'var(--chart-3)' },
  butuhPerawatan: { label: 'Butuh Perawatan', color: 'var(--destructive)' },
  jumlah: { label: 'Jumlah', color: 'var(--primary)' }
} satisfies ChartConfig;

export default function Klaster3Page() {
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('deteksi');

  // Fetch data using SWR hook
  const { data, isLoading, isError } = useKlaster3Data(filters);

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
  const deteksiDiniData = useMemo(() => {
    if (!data?.deteksiDini) return [];
    return data.deteksiDini.map((item: any) => ({
      jenis: item.jenis,
      jumlahPasien: item.sasaran,
      positif: item.capaian,
      negatif: item.sasaran - item.capaian
    }));
  }, [data?.deteksiDini]);

  const faktorRisikoData = useMemo(() => {
    if (!data?.faktorRisiko) return [];
    return data.faktorRisiko.map((item: any) => ({
      faktor: item.faktor,
      jumlahPasien: item.jumlahKasus,
      terdeteksi: item.jumlahKasus
    }));
  }, [data?.faktorRisiko]);

  const pemeriksaanGigiData = useMemo(() => {
    if (!data?.pemeriksaanGigi) return [];
    return data.pemeriksaanGigi.map((item: any) => ({
      kategori: item.kategori,
      jumlahPasien: item.diperiksa,
      butuhPerawatan: item.perluPerawatan
    }));
  }, [data?.pemeriksaanGigi]);

  // Summary data
  const summary = data?.summary || {
    totalPasienDeteksi: 0,
    totalPositif: 0,
    totalNegatif: 0,
    tingkatDeteksi: 0,
    totalPasienRisiko: 0,
    totalRisiko: 0,
    persenRisiko: 0,
    totalPemeriksaan: 0,
    butuhPerawatan: 0,
    persenButuhPerawatan: 0
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <DashboardFilter onFilterChange={handleFilterChange} />

        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Klaster 3: Deteksi Dini & PTM
          </h2>
        </div>

        <Tabs value={currentTab} onValueChange={setTab} className='space-y-4'>
          <TabsList className='flex-wrap'>
            <TabsTrigger value='deteksi' className='flex items-center gap-2'>
              <IconSearch className='size-4' />
              Deteksi Dini
            </TabsTrigger>
            <TabsTrigger value='risiko' className='flex items-center gap-2'>
              <IconAlertTriangle className='size-4' />
              Faktor Risiko
            </TabsTrigger>
            <TabsTrigger value='diagnosis' className='flex items-center gap-2'>
              <IconStethoscope className='size-4' />
              Diagnosis PTM
            </TabsTrigger>
            <TabsTrigger value='gigi' className='flex items-center gap-2'>
              <IconDental className='size-4' />
              Pemeriksaan Gigi
            </TabsTrigger>
          </TabsList>

          {/* Tab Deteksi Dini */}
          <TabsContent value='deteksi' className='space-y-4'>
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Skrining</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalPasienDeteksi.toLocaleString()}
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
                      <CardDescription>Kasus Positif</CardDescription>
                      <CardTitle className='text-3xl text-red-600'>
                        {summary.totalPositif.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='destructive'>
                        {summary.tingkatDeteksi}% dari total
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Hasil Negatif</CardDescription>
                      <CardTitle className='text-3xl text-green-600'>
                        {summary.totalNegatif.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-green-600'>
                        Sehat
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Jenis Deteksi</CardDescription>
                      <CardTitle className='text-3xl'>
                        {deteksiDiniData.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Aktif</Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Capaian Deteksi Dini per Jenis</CardTitle>
                      <CardDescription>Positif vs Negatif</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[350px]'
                      >
                        <BarChart data={deteksiDiniData} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' />
                          <YAxis
                            dataKey='jenis'
                            type='category'
                            width={120}
                            fontSize={11}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='positif'
                            fill='var(--destructive)'
                            radius={4}
                          />
                          <Bar
                            dataKey='negatif'
                            fill='var(--chart-2)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Pasien Deteksi</CardTitle>
                      <CardDescription>Per jenis pemeriksaan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[350px]'
                      >
                        <PieChart>
                          <Pie
                            data={deteksiDiniData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ jenis, percent }) =>
                              `${jenis}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill='#8884d8'
                            dataKey='jumlahPasien'
                          >
                            {deteksiDiniData.map((_: any, index: number) => (
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

          {/* Tab Faktor Risiko */}
          <TabsContent value='risiko' className='space-y-4'>
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Diperiksa</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalPasienRisiko.toLocaleString()}
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
                      <CardDescription>
                        Faktor Risiko Terdeteksi
                      </CardDescription>
                      <CardTitle className='text-3xl text-yellow-600'>
                        {summary.totalRisiko.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-yellow-600'>
                        {summary.persenRisiko}% dari total
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Jenis Faktor</CardDescription>
                      <CardTitle className='text-3xl'>
                        {faktorRisikoData.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline'>Dipantau</Badge>
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
                        Monitoring
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Faktor Risiko</CardTitle>
                      <CardDescription>Terdeteksi per jenis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={faktorRisikoData} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis type='number' />
                          <YAxis
                            dataKey='faktor'
                            type='category'
                            width={120}
                            fontSize={11}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='terdeteksi'
                            fill='var(--chart-3)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Proporsi Faktor Risiko</CardTitle>
                      <CardDescription>Persentase per jenis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <PieChart>
                          <Pie
                            data={faktorRisikoData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ faktor, percent }) =>
                              `${faktor}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            dataKey='terdeteksi'
                          >
                            {faktorRisikoData.map((_: any, index: number) => (
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

          {/* Tab Diagnosis PTM */}
          <TabsContent value='diagnosis' className='space-y-4'>
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Hasil Deteksi Dini</CardTitle>
                      <CardDescription>Positif vs Negatif</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={deteksiDiniData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis
                            dataKey='jenis'
                            angle={-45}
                            textAnchor='end'
                            height={80}
                            fontSize={10}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='positif'
                            fill='var(--destructive)'
                            radius={4}
                          />
                          <Bar
                            dataKey='negatif'
                            fill='var(--chart-2)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ringkasan Diagnosis</CardTitle>
                      <CardDescription>Statistik keseluruhan</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex justify-between'>
                        <span>Total Pasien</span>
                        <span className='font-semibold'>
                          {summary.totalPasienDeteksi.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Kasus Positif</span>
                        <span className='font-semibold text-red-600'>
                          {summary.totalPositif.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Tingkat Deteksi</span>
                        <span className='font-semibold'>
                          {summary.tingkatDeteksi}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Pemeriksaan Gigi */}
          <TabsContent value='gigi' className='space-y-4'>
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Pemeriksaan</CardDescription>
                      <CardTitle className='text-3xl'>
                        {summary.totalPemeriksaan.toLocaleString()}
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
                      <CardDescription>Butuh Perawatan</CardDescription>
                      <CardTitle className='text-3xl text-yellow-600'>
                        {summary.butuhPerawatan.toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant='outline' className='text-yellow-600'>
                        {summary.persenButuhPerawatan}% dari total
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Kategori Pasien</CardDescription>
                      <CardTitle className='text-3xl'>
                        {pemeriksaanGigiData.length}
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
                        Berjalan
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Pemeriksaan Gigi per Kategori</CardTitle>
                      <CardDescription>
                        Jumlah pasien vs butuh perawatan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <BarChart data={pemeriksaanGigiData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='kategori' />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey='jumlahPasien'
                            fill='var(--primary)'
                            radius={4}
                          />
                          <Bar
                            dataKey='butuhPerawatan'
                            fill='var(--destructive)'
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Pemeriksaan Gigi</CardTitle>
                      <CardDescription>Per kategori pasien</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className='h-[300px]'
                      >
                        <PieChart>
                          <Pie
                            data={pemeriksaanGigiData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ kategori, percent }) =>
                              `${kategori}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            dataKey='jumlahPasien'
                          >
                            {pemeriksaanGigiData.map(
                              (_: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
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
        </Tabs>
      </div>
    </PageContainer>
  );
}
