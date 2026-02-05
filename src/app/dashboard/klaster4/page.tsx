'use client';

import { useState, useCallback } from 'react';
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

// Data 12 Kasus Diagnosa Terbanyak
const top12DiagnosaData = [
  { diagnosa: 'ISPA', kode: 'J06.9', jumlah: 8234, trend: 'down' },
  { diagnosa: 'Hipertensi', kode: 'I10', jumlah: 6512, trend: 'up' },
  { diagnosa: 'Diabetes Mellitus', kode: 'E11.9', jumlah: 4567, trend: 'up' },
  { diagnosa: 'Gastritis', kode: 'K29.7', jumlah: 3890, trend: 'stable' },
  { diagnosa: 'Diare', kode: 'A09', jumlah: 3456, trend: 'down' },
  { diagnosa: 'Dermatitis', kode: 'L30.9', jumlah: 2987, trend: 'stable' },
  { diagnosa: 'Artritis', kode: 'M13.9', jumlah: 2654, trend: 'up' },
  { diagnosa: 'Faringitis', kode: 'J02.9', jumlah: 2345, trend: 'down' },
  { diagnosa: 'Myalgia', kode: 'M79.1', jumlah: 2123, trend: 'stable' },
  { diagnosa: 'Cephalgia', kode: 'R51', jumlah: 1987, trend: 'stable' },
  { diagnosa: 'Konjungtivitis', kode: 'H10.9', jumlah: 1654, trend: 'down' },
  { diagnosa: 'Anemia', kode: 'D64.9', jumlah: 1432, trend: 'up' }
];

// Data Bahaya Tinggi
const bahayaTinggiData = [
  { diagnosa: 'TB Paru', kode: 'A15.0', jumlah: 456, severity: 'high' },
  { diagnosa: 'Stroke', kode: 'I64', jumlah: 234, severity: 'high' },
  { diagnosa: 'Gagal Jantung', kode: 'I50.9', jumlah: 198, severity: 'high' },
  { diagnosa: 'Gagal Ginjal', kode: 'N19', jumlah: 167, severity: 'high' },
  { diagnosa: 'Kanker', kode: 'C80.9', jumlah: 145, severity: 'high' },
  { diagnosa: 'Pneumonia', kode: 'J18.9', jumlah: 134, severity: 'high' },
  { diagnosa: 'Sepsis', kode: 'A41.9', jumlah: 89, severity: 'high' },
  { diagnosa: 'Infark Miokard', kode: 'I21.9', jumlah: 78, severity: 'high' },
  { diagnosa: 'Meningitis', kode: 'G03.9', jumlah: 45, severity: 'high' },
  { diagnosa: 'Ensefalitis', kode: 'G04.9', jumlah: 23, severity: 'high' }
];

// Data Bahaya Sedang
const bahayaSedangData = [
  { diagnosa: 'DHF', kode: 'A91', jumlah: 567, severity: 'medium' },
  { diagnosa: 'Asma Bronkial', kode: 'J45.9', jumlah: 456, severity: 'medium' },
  { diagnosa: 'Epilepsi', kode: 'G40.9', jumlah: 345, severity: 'medium' },
  { diagnosa: 'Tifoid', kode: 'A01.0', jumlah: 289, severity: 'medium' },
  { diagnosa: 'Hepatitis', kode: 'B19.9', jumlah: 234, severity: 'medium' },
  { diagnosa: 'Vertigo', kode: 'H81.9', jumlah: 198, severity: 'medium' },
  { diagnosa: 'Appendisitis', kode: 'K37', jumlah: 167, severity: 'medium' },
  { diagnosa: 'Batu Ginjal', kode: 'N20.0', jumlah: 145, severity: 'medium' },
  { diagnosa: 'Hernia', kode: 'K40.9', jumlah: 123, severity: 'medium' },
  { diagnosa: 'Fraktur', kode: 'T14.2', jumlah: 112, severity: 'medium' }
];

// Data Bahaya Rendah
const bahayaRendahData = [
  { diagnosa: 'Common Cold', kode: 'J00', jumlah: 4567, severity: 'low' },
  { diagnosa: 'Caries Gigi', kode: 'K02.9', jumlah: 3456, severity: 'low' },
  { diagnosa: 'Dispepsia', kode: 'K30', jumlah: 2987, severity: 'low' },
  { diagnosa: 'Alergi', kode: 'T78.4', jumlah: 2345, severity: 'low' },
  { diagnosa: 'Otitis Media', kode: 'H66.9', jumlah: 1876, severity: 'low' },
  { diagnosa: 'Urtikaria', kode: 'L50.9', jumlah: 1543, severity: 'low' },
  { diagnosa: 'Scabies', kode: 'B86', jumlah: 1234, severity: 'low' },
  { diagnosa: 'Tinea', kode: 'B35.9', jumlah: 987, severity: 'low' },
  { diagnosa: 'Impetigo', kode: 'L01.0', jumlah: 765, severity: 'low' },
  { diagnosa: 'Vulnus', kode: 'T14.1', jumlah: 654, severity: 'low' }
];

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
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const { currentTab, setTab } = useTabFromUrl('top12');

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    console.log('Klaster 4 Filters changed:', newFilters);
  }, []);

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
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Kasus</CardDescription>
                  <CardTitle className='text-3xl'>41,841</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Top 12 Diagnosa</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Kasus Terbanyak</CardDescription>
                  <CardTitle className='text-3xl'>ISPA</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingDown className='mr-1 size-3' />
                    -5.2% dari bulan lalu
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Tren Naik</CardDescription>
                  <CardTitle className='text-3xl text-red-600'>4</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='destructive'>Perlu perhatian</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Tren Turun</CardDescription>
                  <CardTitle className='text-3xl text-green-600'>4</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    Membaik
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>12 Kasus Diagnosa Terbanyak</CardTitle>
                <CardDescription>Bulan ini - semua puskesmas</CardDescription>
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
                    <Bar dataKey='jumlah' fill='var(--primary)' radius={4} />
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
                  {top12DiagnosaData.map((item, index) => (
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

            <Card>
              <CardHeader>
                <CardTitle className='text-red-600'>
                  10 Kasus Diagnosa Bahaya Tinggi
                </CardTitle>
                <CardDescription>
                  Memerlukan penanganan prioritas
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
                      {bahayaTinggiData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill='#dc2626' />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className='grid gap-4 md:grid-cols-2'>
              {bahayaTinggiData.slice(0, 6).map((item) => (
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
                      {item.jumlah} kasus
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
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

            <Card>
              <CardHeader>
                <CardTitle className='text-yellow-600'>
                  10 Kasus Diagnosa Bahaya Sedang
                </CardTitle>
                <CardDescription>Memerlukan pemantauan berkala</CardDescription>
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
                      {bahayaSedangData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill='#f59e0b' />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className='grid gap-4 md:grid-cols-2'>
              {bahayaSedangData.slice(0, 6).map((item) => (
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
                      {item.jumlah} kasus
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
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

            <Card>
              <CardHeader>
                <CardTitle className='text-green-600'>
                  10 Kasus Diagnosa Bahaya Rendah
                </CardTitle>
                <CardDescription>
                  Penanganan standar rawat jalan
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
                      {bahayaRendahData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill='#22c55e' />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className='grid gap-4 md:grid-cols-2'>
              {bahayaRendahData.slice(0, 6).map((item) => (
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
                      {item.jumlah} kasus
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
