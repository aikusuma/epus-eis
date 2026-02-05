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
  IconUsers,
  IconPill,
  IconCash,
  IconTrendingUp,
  IconTrendingDown
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

// Data SDM
const sdmData = [
  { kategori: 'Dokter Umum', jumlah: 78, target: 100 },
  { kategori: 'Dokter Gigi', jumlah: 42, target: 50 },
  { kategori: 'Bidan', jumlah: 156, target: 180 },
  { kategori: 'Perawat', jumlah: 234, target: 250 },
  { kategori: 'Apoteker', jumlah: 38, target: 45 },
  { kategori: 'Analis Lab', jumlah: 45, target: 50 }
];

const sdmTrendData = [
  { bulan: 'Jan', dokter: 75, perawat: 228, bidan: 150 },
  { bulan: 'Feb', dokter: 76, perawat: 230, bidan: 152 },
  { bulan: 'Mar', dokter: 76, perawat: 231, bidan: 154 },
  { bulan: 'Apr', dokter: 77, perawat: 232, bidan: 155 },
  { bulan: 'Mei', dokter: 78, perawat: 234, bidan: 156 },
  { bulan: 'Jun', dokter: 78, perawat: 234, bidan: 156 }
];

// Data Stok Obat
const stokObatData = [
  { nama: 'Paracetamol 500mg', stok: 12500, pemakaian: 8500, satuan: 'tablet' },
  { nama: 'Amoxicillin 500mg', stok: 8200, pemakaian: 5600, satuan: 'kapsul' },
  { nama: 'OBH Combi', stok: 3400, pemakaian: 2100, satuan: 'botol' },
  { nama: 'Antasida', stok: 5600, pemakaian: 3200, satuan: 'tablet' },
  { nama: 'Vitamin C', stok: 15000, pemakaian: 9800, satuan: 'tablet' },
  { nama: 'Salbutamol', stok: 2300, pemakaian: 1500, satuan: 'tablet' },
  { nama: 'Metformin 500mg', stok: 6700, pemakaian: 4200, satuan: 'tablet' },
  { nama: 'Amlodipine 5mg', stok: 4500, pemakaian: 3100, satuan: 'tablet' }
];

const pemakaianObatTrend = [
  { bulan: 'Jan', pemakaian: 45000 },
  { bulan: 'Feb', pemakaian: 42000 },
  { bulan: 'Mar', pemakaian: 48000 },
  { bulan: 'Apr', pemakaian: 51000 },
  { bulan: 'Mei', pemakaian: 49000 },
  { bulan: 'Jun', pemakaian: 52000 }
];

// Data Keuangan
const keuanganData = [
  { kategori: 'Pendapatan JKN', nominal: 2450000000 },
  { kategori: 'Pendapatan Umum', nominal: 380000000 },
  { kategori: 'BLUD', nominal: 890000000 },
  { kategori: 'DAK', nominal: 1200000000 }
];

const keuanganTrend = [
  { bulan: 'Jan', pendapatan: 420, pengeluaran: 380 },
  { bulan: 'Feb', pendapatan: 445, pengeluaran: 395 },
  { bulan: 'Mar', pendapatan: 480, pengeluaran: 410 },
  { bulan: 'Apr', pendapatan: 510, pengeluaran: 430 },
  { bulan: 'Mei', pendapatan: 495, pengeluaran: 420 },
  { bulan: 'Jun', pendapatan: 530, pengeluaran: 445 }
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

export default function Klaster1Page() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const { currentTab, setTab } = useTabFromUrl('sdm');

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    // In a real app, this would fetch data based on filters
    console.log('Filters changed:', newFilters);
  }, []);

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
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Tenaga Kesehatan</CardDescription>
                  <CardTitle className='text-3xl'>593</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    +2.3% dari tahun lalu
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Rasio Nakes/Penduduk</CardDescription>
                  <CardTitle className='text-3xl'>1:2,890</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Target: 1:2,500</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Dokter Aktif</CardDescription>
                  <CardTitle className='text-3xl'>120</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    78 Umum, 42 Gigi
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Ketersediaan SDM</CardDescription>
                  <CardTitle className='text-3xl'>87.2%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Perlu tambahan 82 orang
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
                  <ChartContainer config={sdmChartConfig} className='h-[300px]'>
                    <BarChart data={sdmData} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' />
                      <YAxis dataKey='kategori' type='category' width={100} />
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
                  <ChartContainer config={sdmChartConfig} className='h-[300px]'>
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
          </TabsContent>

          {/* Tab Obat */}
          <TabsContent value='obat' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Item Obat</CardDescription>
                  <CardTitle className='text-3xl'>1,245</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Fornas 2024</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Stok Kritis</CardDescription>
                  <CardTitle className='text-3xl text-red-600'>23</CardTitle>
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
                  <CardDescription>Expired Bulan Ini</CardDescription>
                  <CardTitle className='text-3xl text-yellow-600'>8</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Segera distribusikan
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Pemakaian Bulan Ini</CardDescription>
                  <CardTitle className='text-3xl'>52,000</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    +6.1% dari bulan lalu
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
                      <Bar dataKey='stok' fill='var(--color-stok)' radius={4} />
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
                  <CardTitle>Tren Pemakaian Obat</CardTitle>
                  <CardDescription>
                    Total pemakaian 6 bulan terakhir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={obatChartConfig}
                    className='h-[350px]'
                  >
                    <LineChart data={pemakaianObatTrend}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='bulan' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type='monotone'
                        dataKey='pemakaian'
                        stroke='var(--primary)'
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Keuangan */}
          <TabsContent value='keuangan' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Pendapatan</CardDescription>
                  <CardTitle className='text-3xl'>Rp 4.92 M</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    +15.2% YoY
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Klaim JKN</CardDescription>
                  <CardTitle className='text-3xl'>Rp 2.45 M</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>49.8% dari total</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Realisasi Anggaran</CardDescription>
                  <CardTitle className='text-3xl'>72.5%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    Semester I
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Saldo BLUD</CardDescription>
                  <CardTitle className='text-3xl'>Rp 890 Jt</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>Tersedia</Badge>
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
                        {keuanganData.map((_, index) => (
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
                    Dalam jutaan rupiah - 6 bulan terakhir
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
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
