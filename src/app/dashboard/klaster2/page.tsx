'use client';

import { useState, useCallback } from 'react';
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

// Data Antenatal Care
const ancData = [
  { puskesmas: 'Brebes', k1: 245, k4: 198, target: 250 },
  { puskesmas: 'Wanasari', k1: 189, k4: 156, target: 200 },
  { puskesmas: 'Bulakamba', k1: 267, k4: 223, target: 280 },
  { puskesmas: 'Tanjung', k1: 134, k4: 112, target: 150 },
  { puskesmas: 'Losari', k1: 178, k4: 145, target: 180 },
  { puskesmas: 'Kersana', k1: 156, k4: 134, target: 160 }
];

const ancTrendData = [
  { bulan: 'Jan', k1: 1245, k4: 1089 },
  { bulan: 'Feb', k1: 1312, k4: 1156 },
  { bulan: 'Mar', k1: 1389, k4: 1234 },
  { bulan: 'Apr', k1: 1456, k4: 1298 },
  { bulan: 'Mei', k1: 1523, k4: 1367 },
  { bulan: 'Jun', k1: 1598, k4: 1423 }
];

// Data Imunisasi Bayi
const imunisasiBayiData = [
  { jenis: 'HB-0', sasaran: 2500, capaian: 2340 },
  { jenis: 'BCG', sasaran: 2500, capaian: 2289 },
  { jenis: 'Polio 1', sasaran: 2500, capaian: 2312 },
  { jenis: 'Polio 2', sasaran: 2500, capaian: 2198 },
  { jenis: 'Polio 3', sasaran: 2500, capaian: 2067 },
  { jenis: 'DPT-HB-Hib 1', sasaran: 2500, capaian: 2234 },
  { jenis: 'DPT-HB-Hib 2', sasaran: 2500, capaian: 2145 },
  { jenis: 'DPT-HB-Hib 3', sasaran: 2500, capaian: 2023 },
  { jenis: 'Campak Rubella', sasaran: 2500, capaian: 2189 }
];

// Data Imunisasi Baduta
const imunisasiBadutaData = [
  { jenis: 'DPT-HB-Hib Lanjutan', sasaran: 2300, capaian: 2078 },
  { jenis: 'Campak Rubella Lanjutan', sasaran: 2300, capaian: 2134 }
];

// Data BIAS
const biasData = [
  { sekolah: 'SD Negeri', sasaran: 8500, capaian: 8123 },
  { sekolah: 'SD Swasta', sasaran: 2300, capaian: 2156 },
  { sekolah: 'MI', sasaran: 3200, capaian: 2987 }
];

const biasTrendData = [
  { bulan: 'Agt', dt: 4500, td: 4200, mr: 4100 },
  { bulan: 'Sep', dt: 4800, td: 4500, mr: 4400 },
  { bulan: 'Okt', dt: 5100, td: 4800, mr: 4700 },
  { bulan: 'Nov', dt: 5400, td: 5100, mr: 5000 }
];

const COLORS = ['#019dae', '#0284c7', '#0369a1', '#075985', '#164e63'];

const chartConfig = {
  k1: { label: 'K1', color: 'var(--primary)' },
  k4: { label: 'K4', color: 'var(--chart-2)' },
  sasaran: { label: 'Sasaran', color: 'var(--muted)' },
  capaian: { label: 'Capaian', color: 'var(--primary)' },
  dt: { label: 'DT', color: 'var(--primary)' },
  td: { label: 'Td', color: 'var(--chart-2)' },
  mr: { label: 'MR', color: 'var(--chart-3)' }
} satisfies ChartConfig;

export default function Klaster2Page() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const { currentTab, setTab } = useTabFromUrl('anc');

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
  }, []);

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
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Kunjungan K1</CardDescription>
                  <CardTitle className='text-3xl'>8,523</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    94.7% dari sasaran
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Kunjungan K4</CardDescription>
                  <CardTitle className='text-3xl'>7,591</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    89.1% dari K1
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Ibu Hamil Risti</CardDescription>
                  <CardTitle className='text-3xl text-yellow-600'>
                    342
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    4.0% dari total bumil
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>
                    KEK (Kekurangan Energi Kronis)
                  </CardDescription>
                  <CardTitle className='text-3xl text-red-600'>156</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='destructive'>
                    <IconTrendingDown className='mr-1 size-3' />
                    Perlu intervensi
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Capaian ANC per Puskesmas</CardTitle>
                  <CardDescription>K1 dan K4 vs Target</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <BarChart data={ancData} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' />
                      <YAxis dataKey='puskesmas' type='category' width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey='k1' fill='var(--color-k1)' radius={4} />
                      <Bar dataKey='k4' fill='var(--color-k4)' radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tren Kunjungan ANC</CardTitle>
                  <CardDescription>6 bulan terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
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
          </TabsContent>

          {/* Tab Imunisasi Bayi */}
          <TabsContent value='imunisasi-bayi' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Sasaran Bayi</CardDescription>
                  <CardTitle className='text-3xl'>2,500</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Tahun 2025</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>
                    IDL (Imunisasi Dasar Lengkap)
                  </CardDescription>
                  <CardTitle className='text-3xl'>2,023</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    80.9% capaian
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Drop Out Rate</CardDescription>
                  <CardTitle className='text-3xl text-yellow-600'>
                    12.8%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Target &lt; 10%
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>KIPI (Kejadian Ikutan)</CardDescription>
                  <CardTitle className='text-3xl'>3</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    Ringan semua
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Capaian Imunisasi Bayi per Jenis</CardTitle>
                <CardDescription>Sasaran vs Capaian</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className='h-[350px]'>
                  <BarChart data={imunisasiBayiData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='jenis'
                      angle={-45}
                      textAnchor='end'
                      height={80}
                      fontSize={11}
                    />
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
          </TabsContent>

          {/* Tab Imunisasi Baduta */}
          <TabsContent value='imunisasi-baduta' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Sasaran Baduta</CardDescription>
                  <CardTitle className='text-3xl'>2,300</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Usia 18-24 bulan</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>DPT-HB-Hib Lanjutan</CardDescription>
                  <CardTitle className='text-3xl'>2,078</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    90.3% capaian
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Campak Rubella Lanjutan</CardDescription>
                  <CardTitle className='text-3xl'>2,134</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    92.8% capaian
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Capaian Imunisasi Baduta</CardTitle>
                <CardDescription>
                  DPT-HB-Hib Lanjutan dan Campak Rubella Lanjutan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className='h-[300px]'>
                  <BarChart data={imunisasiBadutaData}>
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
          </TabsContent>

          {/* Tab BIAS */}
          <TabsContent value='bias' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Sasaran BIAS</CardDescription>
                  <CardTitle className='text-3xl'>14,000</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Anak Sekolah Kelas 1-6 SD</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Capaian DT</CardDescription>
                  <CardTitle className='text-3xl'>13,266</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    94.8%
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Capaian Td</CardDescription>
                  <CardTitle className='text-3xl'>12,987</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    92.8%
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Capaian MR</CardDescription>
                  <CardTitle className='text-3xl'>12,654</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    90.4%
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Capaian BIAS per Jenis Sekolah</CardTitle>
                  <CardDescription>
                    SD Negeri, SD Swasta, dan MI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <BarChart data={biasData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='sekolah' />
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
                  <CardTitle>Tren BIAS per Bulan</CardTitle>
                  <CardDescription>
                    Agustus - November (Masa BIAS)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <LineChart data={biasTrendData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='bulan' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type='monotone'
                        dataKey='dt'
                        stroke='var(--primary)'
                        strokeWidth={2}
                      />
                      <Line
                        type='monotone'
                        dataKey='td'
                        stroke='var(--chart-2)'
                        strokeWidth={2}
                      />
                      <Line
                        type='monotone'
                        dataKey='mr'
                        stroke='var(--chart-3)'
                        strokeWidth={2}
                      />
                    </LineChart>
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
