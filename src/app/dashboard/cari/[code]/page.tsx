'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import {
  IconVirus,
  IconUser,
  IconCalendar,
  IconBuilding,
  IconChartBar,
  IconLoader2,
  IconTrendingUp,
  IconArrowLeft
} from '@tabler/icons-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

interface Icd10 {
  id: string;
  code: string;
  display: string;
  version: string;
  _count?: {
    diagnoses: number;
  };
}

interface Diagnosis {
  id: string;
  pasienNama: string;
  pasienUmur: number;
  pasienGender: string;
  puskesmas: string;
  tanggalPeriksa: string;
  icd10: {
    code: string;
    display: string;
  };
}

interface TrendData {
  date: string;
  minggu: string;
  laki: number;
  perempuan: number;
  total: number;
}

interface MonthlyTrendData {
  date: string;
  bulan: string;
  laki: number;
  perempuan: number;
  total: number;
}

export default function CariDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [icd10, setIcd10] = useState<Icd10 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDiagnoses, setIsLoadingDiagnoses] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<MonthlyTrendData[]>(
    []
  );

  // Fetch ICD-10 by code
  useEffect(() => {
    const fetchIcd10 = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/eis/search?type=by-code&code=${encodeURIComponent(code)}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setIcd10(data.data);
          // Fetch additional data
          fetchDetails(data.data.id);
        } else {
          // Not found, redirect back
          router.push('/dashboard/cari');
        }
      } catch (error) {
        console.error('Failed to fetch ICD-10:', error);
        router.push('/dashboard/cari');
      } finally {
        setIsLoading(false);
      }
    };

    if (code) {
      fetchIcd10();
    }
  }, [code, router]);

  const fetchDetails = async (icd10Id: string) => {
    setIsLoadingDiagnoses(true);
    setIsLoadingTrend(true);

    try {
      const [diagRes, trendRes, monthlyRes] = await Promise.all([
        fetch(`/api/eis/search?type=diagnoses&icd10Id=${icd10Id}&limit=50`),
        fetch(`/api/eis/search?type=trend&icd10Id=${icd10Id}`),
        fetch(`/api/eis/search?type=monthly-trend&icd10Id=${icd10Id}`)
      ]);

      const diagData = await diagRes.json();
      const trendDataRes = await trendRes.json();
      const monthlyDataRes = await monthlyRes.json();

      if (diagData.success) {
        setDiagnoses(diagData.data);
      }
      if (trendDataRes.success) {
        setTrendData(trendDataRes.data);
      }
      if (monthlyDataRes.success) {
        setMonthlyTrendData(monthlyDataRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoadingDiagnoses(false);
      setIsLoadingTrend(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex h-[50vh] items-center justify-center'>
          <IconLoader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!icd10) {
    return (
      <PageContainer>
        <div className='flex h-[50vh] flex-col items-center justify-center gap-4'>
          <p className='text-muted-foreground'>Penyakit tidak ditemukan</p>
          <Button asChild>
            <Link href='/dashboard/cari'>Kembali ke Pencarian</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/dashboard/cari'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Kembali ke Pencarian
            </Link>
          </Button>
        </div>

        <Card className='border-primary/50'>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-4'>
                <div className='bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full'>
                  <IconVirus className='h-7 w-7' />
                </div>
                <div>
                  <Badge variant='default' className='mb-1 font-mono text-lg'>
                    {icd10.code}
                  </Badge>
                  <CardTitle className='text-xl'>{icd10.display}</CardTitle>
                  <CardDescription>Versi: {icd10.version}</CardDescription>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-primary text-3xl font-bold'>
                  {icd10._count?.diagnoses || 0}
                </div>
                <p className='text-muted-foreground text-sm'>Total Diagnosa</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue='statistik' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='statistik'>Statistik</TabsTrigger>
            <TabsTrigger value='daftar'>Daftar Pasien</TabsTrigger>
          </TabsList>

          <TabsContent value='daftar'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  Daftar Diagnosa Terbaru
                </CardTitle>
                <CardDescription>
                  Menampilkan {diagnoses.length} diagnosa terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDiagnoses ? (
                  <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className='bg-muted h-20 animate-pulse rounded-lg'
                      />
                    ))}
                  </div>
                ) : diagnoses.length === 0 ? (
                  <div className='text-muted-foreground py-8 text-center'>
                    Tidak ada data diagnosa
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {diagnoses.map((diag) => (
                      <div
                        key={diag.id}
                        className='flex items-center justify-between rounded-lg border p-4'
                      >
                        <div className='flex items-center gap-4'>
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              diag.pasienGender === 'L'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            <IconUser className='h-5 w-5' />
                          </div>
                          <div>
                            <p className='font-medium'>{diag.pasienNama}</p>
                            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                              <span>
                                {diag.pasienGender === 'L'
                                  ? 'Laki-laki'
                                  : 'Perempuan'}
                              </span>
                              <span>•</span>
                              <span>{diag.pasienUmur} tahun</span>
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='flex items-center gap-1 text-sm'>
                            <IconBuilding className='text-muted-foreground h-4 w-4' />
                            <span>{diag.puskesmas}</span>
                          </div>
                          <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                            <IconCalendar className='h-4 w-4' />
                            <span>{formatDate(diag.tanggalPeriksa)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='statistik'>
            <div className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Pasien
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{diagnoses.length}</div>
                  <p className='text-muted-foreground text-xs'>Data tersedia</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Laki-laki
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-blue-600'>
                    {diagnoses.filter((d) => d.pasienGender === 'L').length}
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {diagnoses.length > 0
                      ? `${((diagnoses.filter((d) => d.pasienGender === 'L').length / diagnoses.length) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Perempuan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-pink-600'>
                    {diagnoses.filter((d) => d.pasienGender === 'P').length}
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {diagnoses.length > 0
                      ? `${((diagnoses.filter((d) => d.pasienGender === 'P').length / diagnoses.length) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            <Card className='mt-4'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <IconTrendingUp className='h-5 w-5' />
                  Trend Kasus (90 Hari Terakhir)
                </CardTitle>
                <CardDescription>
                  Jumlah kasus per minggu berdasarkan jenis kelamin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrend ? (
                  <div className='bg-muted h-[300px] animate-pulse rounded-lg' />
                ) : trendData.length === 0 ? (
                  <div className='text-muted-foreground flex h-[300px] items-center justify-center'>
                    Tidak ada data trend
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height={300}>
                    <AreaChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='minggu'
                        className='text-xs'
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis className='text-xs' tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='laki'
                        name='Laki-laki'
                        stackId='1'
                        stroke='#3b82f6'
                        fill='#3b82f6'
                        fillOpacity={0.6}
                      />
                      <Area
                        type='monotone'
                        dataKey='perempuan'
                        name='Perempuan'
                        stackId='1'
                        stroke='#ec4899'
                        fill='#ec4899'
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card className='mt-4'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <IconChartBar className='h-5 w-5' />
                  Trend Bulanan (12 Bulan Terakhir)
                </CardTitle>
                <CardDescription>
                  Jumlah kasus per bulan berdasarkan jenis kelamin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrend ? (
                  <div className='bg-muted h-[300px] animate-pulse rounded-lg' />
                ) : monthlyTrendData.length === 0 ? (
                  <div className='text-muted-foreground flex h-[300px] items-center justify-center'>
                    Tidak ada data trend bulanan
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='bulan'
                        className='text-xs'
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor='end'
                        height={60}
                      />
                      <YAxis className='text-xs' tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey='laki'
                        name='Laki-laki'
                        stackId='1'
                        fill='#3b82f6'
                      />
                      <Bar
                        dataKey='perempuan'
                        name='Perempuan'
                        stackId='1'
                        fill='#ec4899'
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className='mt-4'>
              <CardHeader>
                <CardTitle className='text-lg'>Distribusi Umur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[
                    { label: '0-17 tahun (Anak)', min: 0, max: 17 },
                    { label: '18-40 tahun (Dewasa Muda)', min: 18, max: 40 },
                    { label: '41-60 tahun (Dewasa)', min: 41, max: 60 },
                    { label: '>60 tahun (Lansia)', min: 61, max: 999 }
                  ].map((group) => {
                    const count = diagnoses.filter(
                      (d) =>
                        d.pasienUmur >= group.min && d.pasienUmur <= group.max
                    ).length;
                    const percentage =
                      diagnoses.length > 0
                        ? (count / diagnoses.length) * 100
                        : 0;
                    return (
                      <div key={group.label} className='space-y-1'>
                        <div className='flex justify-between text-sm'>
                          <span>{group.label}</span>
                          <span className='font-medium'>
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className='bg-muted h-2 overflow-hidden rounded-full'>
                          <div
                            className='bg-primary h-full rounded-full transition-all'
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className='mt-4'>
              <CardHeader>
                <CardTitle className='text-lg'>Distribusi Puskesmas</CardTitle>
              </CardHeader>
              <CardContent>
                {diagnoses.length === 0 ? (
                  <div className='text-muted-foreground py-4 text-center'>
                    Tidak ada data
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {Object.entries(
                      diagnoses.reduce(
                        (acc, d) => {
                          acc[d.puskesmas] = (acc[d.puskesmas] || 0) + 1;
                          return acc;
                        },
                        {} as Record<string, number>
                      )
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([puskesmas, count]) => {
                        const percentage = (count / diagnoses.length) * 100;
                        return (
                          <div key={puskesmas} className='space-y-1'>
                            <div className='flex justify-between text-sm'>
                              <span>{puskesmas}</span>
                              <span className='font-medium'>
                                {count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className='bg-muted h-2 overflow-hidden rounded-full'>
                              <div
                                className='bg-primary h-full rounded-full transition-all'
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
