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

// Data Deteksi Dini
const deteksiDiniData = [
  { jenis: 'Kanker Serviks (IVA)', sasaran: 15000, capaian: 8934 },
  { jenis: 'Kanker Payudara (SADANIS)', sasaran: 15000, capaian: 9876 },
  { jenis: 'Tuberculosis', sasaran: 5000, capaian: 4234 },
  { jenis: 'Hipertensi', sasaran: 25000, capaian: 21456 },
  { jenis: 'Diabetes Mellitus', sasaran: 20000, capaian: 16789 },
  { jenis: 'Gangguan Jiwa', sasaran: 3000, capaian: 2345 }
];

const deteksiTrendData = [
  { bulan: 'Jan', iva: 1200, sadanis: 1400, tb: 650 },
  { bulan: 'Feb', iva: 1350, sadanis: 1520, tb: 720 },
  { bulan: 'Mar', iva: 1480, sadanis: 1650, tb: 680 },
  { bulan: 'Apr', iva: 1560, sadanis: 1720, tb: 750 },
  { bulan: 'Mei', iva: 1620, sadanis: 1780, tb: 710 },
  { bulan: 'Jun', iva: 1724, sadanis: 1806, tb: 724 }
];

// Data Faktor Risiko
const faktorRisikoData = [
  { faktor: 'Merokok', jumlah: 12456, persentase: 28.5 },
  { faktor: 'Obesitas', jumlah: 8934, persentase: 20.4 },
  { faktor: 'Kurang Aktivitas Fisik', jumlah: 15678, persentase: 35.8 },
  { faktor: 'Konsumsi Alkohol', jumlah: 2345, persentase: 5.4 },
  { faktor: 'Diet Tidak Sehat', jumlah: 18234, persentase: 41.7 }
];

const risikoPerUsiaData = [
  { usia: '15-24', merokok: 2500, obesitas: 1200, kurangAktivitas: 3400 },
  { usia: '25-34', merokok: 3200, obesitas: 2100, kurangAktivitas: 4200 },
  { usia: '35-44', merokok: 3100, obesitas: 2800, kurangAktivitas: 3900 },
  { usia: '45-54', merokok: 2400, obesitas: 1900, kurangAktivitas: 2800 },
  { usia: '55-64', merokok: 1256, obesitas: 934, kurangAktivitas: 1378 }
];

// Data Diagnosis
const diagnosisPTMData = [
  { penyakit: 'Hipertensi', jumlah: 15678, trend: 'up' },
  { penyakit: 'Diabetes Mellitus', jumlah: 8934, trend: 'up' },
  { penyakit: 'PPOK', jumlah: 2345, trend: 'down' },
  { penyakit: 'Jantung Koroner', jumlah: 1234, trend: 'up' },
  { penyakit: 'Stroke', jumlah: 567, trend: 'stable' },
  { penyakit: 'Kanker', jumlah: 234, trend: 'up' }
];

const diagnosisTrendData = [
  { bulan: 'Jan', hipertensi: 2400, dm: 1350, ppok: 380 },
  { bulan: 'Feb', hipertensi: 2550, dm: 1420, ppok: 395 },
  { bulan: 'Mar', hipertensi: 2680, dm: 1490, ppok: 385 },
  { bulan: 'Apr', hipertensi: 2750, dm: 1560, ppok: 390 },
  { bulan: 'Mei', hipertensi: 2620, dm: 1510, ppok: 400 },
  { bulan: 'Jun', hipertensi: 2678, dm: 1604, ppok: 395 }
];

// Data Pemeriksaan Gigi
const gigiData = [
  { kategori: 'Karies Gigi', jumlah: 8934 },
  { kategori: 'Gingivitis', jumlah: 4567 },
  { kategori: 'Periodontitis', jumlah: 2345 },
  { kategori: 'Pulpitis', jumlah: 1234 },
  { kategori: 'Abses', jumlah: 567 },
  { kategori: 'Maloklusi', jumlah: 890 }
];

const gigiPerUsiaData = [
  { usia: '0-5', karies: 1200, gingivitis: 300 },
  { usia: '6-12', karies: 2500, gingivitis: 800 },
  { usia: '13-18', karies: 1800, gingivitis: 1200 },
  { usia: '19-44', karies: 2134, gingivitis: 1567 },
  { usia: '45-59', karies: 800, gingivitis: 500 },
  { usia: '60+', karies: 500, gingivitis: 200 }
];

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
  iva: { label: 'IVA', color: 'var(--primary)' },
  sadanis: { label: 'SADANIS', color: 'var(--chart-2)' },
  tb: { label: 'TB', color: 'var(--chart-3)' },
  merokok: { label: 'Merokok', color: 'var(--primary)' },
  obesitas: { label: 'Obesitas', color: 'var(--chart-2)' },
  kurangAktivitas: { label: 'Kurang Aktivitas', color: 'var(--chart-3)' },
  hipertensi: { label: 'Hipertensi', color: 'var(--primary)' },
  dm: { label: 'Diabetes', color: 'var(--chart-2)' },
  ppok: { label: 'PPOK', color: 'var(--chart-3)' },
  karies: { label: 'Karies', color: 'var(--primary)' },
  gingivitis: { label: 'Gingivitis', color: 'var(--chart-2)' },
  jumlah: { label: 'Jumlah', color: 'var(--primary)' }
} satisfies ChartConfig;

export default function Klaster3Page() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const { currentTab, setTab } = useTabFromUrl('deteksi');

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    console.log('Klaster 3 Filters changed:', newFilters);
  }, []);

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
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Skrining</CardDescription>
                  <CardTitle className='text-3xl'>63,634</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    +18.5% dari tahun lalu
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Capaian IVA</CardDescription>
                  <CardTitle className='text-3xl'>59.6%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Target 80%
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Capaian SADANIS</CardDescription>
                  <CardTitle className='text-3xl'>65.8%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Target 80%
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Kasus Ditemukan</CardDescription>
                  <CardTitle className='text-3xl text-red-600'>127</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='destructive'>Perlu tindak lanjut</Badge>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Capaian Deteksi Dini per Jenis</CardTitle>
                  <CardDescription>Sasaran vs Capaian</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[350px]'>
                    <BarChart data={deteksiDiniData} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' />
                      <YAxis
                        dataKey='jenis'
                        type='category'
                        width={150}
                        fontSize={11}
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
                  <CardTitle>Tren Deteksi Dini</CardTitle>
                  <CardDescription>6 bulan terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[350px]'>
                    <LineChart data={deteksiTrendData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='bulan' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type='monotone'
                        dataKey='iva'
                        stroke='var(--primary)'
                        strokeWidth={2}
                      />
                      <Line
                        type='monotone'
                        dataKey='sadanis'
                        stroke='var(--chart-2)'
                        strokeWidth={2}
                      />
                      <Line
                        type='monotone'
                        dataKey='tb'
                        stroke='var(--chart-3)'
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Faktor Risiko */}
          <TabsContent value='risiko' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-5'>
              {faktorRisikoData.map((item, index) => (
                <Card key={item.faktor}>
                  <CardHeader className='pb-2'>
                    <CardDescription>{item.faktor}</CardDescription>
                    <CardTitle className='text-2xl'>
                      {item.jumlah.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant='outline'
                      className={index < 2 ? 'text-red-600' : 'text-yellow-600'}
                    >
                      {item.persentase}% populasi
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Faktor Risiko</CardTitle>
                  <CardDescription>Jumlah kasus per faktor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <PieChart>
                      <Pie
                        data={faktorRisikoData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ faktor, persentase }) =>
                          `${faktor.split(' ')[0]}: ${persentase}%`
                        }
                        outerRadius={100}
                        dataKey='jumlah'
                      >
                        {faktorRisikoData.map((_, index) => (
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

              <Card>
                <CardHeader>
                  <CardTitle>Faktor Risiko per Kelompok Usia</CardTitle>
                  <CardDescription>Top 3 faktor risiko</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <BarChart data={risikoPerUsiaData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='usia' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey='merokok'
                        fill='var(--color-merokok)'
                        radius={4}
                      />
                      <Bar
                        dataKey='obesitas'
                        fill='var(--color-obesitas)'
                        radius={4}
                      />
                      <Bar
                        dataKey='kurangAktivitas'
                        fill='var(--color-kurangAktivitas)'
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Diagnosis PTM */}
          <TabsContent value='diagnosis' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Kasus PTM</CardDescription>
                  <CardTitle className='text-3xl'>28,992</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-red-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    +12.3% dari tahun lalu
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Hipertensi Terkontrol</CardDescription>
                  <CardTitle className='text-3xl'>67.5%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Target 80%
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>DM Terkontrol</CardDescription>
                  <CardTitle className='text-3xl'>58.2%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-yellow-600'>
                    Target 70%
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Kasus PTM per Jenis Penyakit</CardTitle>
                  <CardDescription>Total kasus aktif</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <BarChart data={diagnosisPTMData} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' />
                      <YAxis dataKey='penyakit' type='category' width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey='jumlah'
                        fill='var(--color-jumlah)'
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tren Diagnosis PTM</CardTitle>
                  <CardDescription>6 bulan terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <LineChart data={diagnosisTrendData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='bulan' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type='monotone'
                        dataKey='hipertensi'
                        stroke='var(--primary)'
                        strokeWidth={2}
                      />
                      <Line
                        type='monotone'
                        dataKey='dm'
                        stroke='var(--chart-2)'
                        strokeWidth={2}
                      />
                      <Line
                        type='monotone'
                        dataKey='ppok'
                        stroke='var(--chart-3)'
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Pemeriksaan Gigi */}
          <TabsContent value='gigi' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Total Pemeriksaan</CardDescription>
                  <CardTitle className='text-3xl'>18,537</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-green-600'>
                    <IconTrendingUp className='mr-1 size-3' />
                    +8.7% dari tahun lalu
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Kasus Karies</CardDescription>
                  <CardTitle className='text-3xl'>8,934</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline' className='text-red-600'>
                    48.2% dari pemeriksaan
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Tindakan Pencabutan</CardDescription>
                  <CardTitle className='text-3xl'>2,345</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>12.7% dari kasus</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Rujukan</CardDescription>
                  <CardTitle className='text-3xl'>234</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant='outline'>1.3% dari pemeriksaan</Badge>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Kasus Gigi</CardTitle>
                  <CardDescription>Per jenis kelainan</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <PieChart>
                      <Pie
                        data={gigiData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ kategori, jumlah }) =>
                          `${kategori}: ${jumlah.toLocaleString()}`
                        }
                        outerRadius={100}
                        dataKey='jumlah'
                      >
                        {gigiData.map((_, index) => (
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

              <Card>
                <CardHeader>
                  <CardTitle>Kasus Gigi per Kelompok Usia</CardTitle>
                  <CardDescription>Karies dan Gingivitis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className='h-[300px]'>
                    <BarChart data={gigiPerUsiaData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='usia' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey='karies'
                        fill='var(--color-karies)'
                        radius={4}
                      />
                      <Bar
                        dataKey='gingivitis'
                        fill='var(--color-gingivitis)'
                        radius={4}
                      />
                    </BarChart>
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
