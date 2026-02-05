'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import {
  IconSearch,
  IconVirus,
  IconUser,
  IconCalendar,
  IconBuilding,
  IconChartBar,
  IconLoader2,
  IconTrendingUp
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

// Type definitions
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

interface OverallTrendData {
  bulan: string;
  [key: string]: string | number;
}

interface DiseaseInfo {
  code: string;
  display: string;
}

// Chart colors for disease trends
const DISEASE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6' // violet
];

export default function CariPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDiagnoses, setIsLoadingDiagnoses] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingOverallTrend, setIsLoadingOverallTrend] = useState(true);
  const [searchResults, setSearchResults] = useState<Icd10[]>([]);
  const [topIcd10, setTopIcd10] = useState<Icd10[]>([]);
  const [overallTrendData, setOverallTrendData] = useState<OverallTrendData[]>(
    []
  );
  const [diseaseList, setDiseaseList] = useState<DiseaseInfo[]>([]);
  const [selectedIcd10, setSelectedIcd10] = useState<Icd10 | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<MonthlyTrendData[]>(
    []
  );

  // Fetch top ICD-10 on mount
  useEffect(() => {
    const fetchTopIcd10 = async () => {
      try {
        const res = await fetch('/api/eis/search?type=top&limit=10');
        const data = await res.json();
        if (data.success) {
          setTopIcd10(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch top ICD-10:', error);
      }
    };
    fetchTopIcd10();
  }, []);

  // Fetch overall disease trend on mount
  useEffect(() => {
    const fetchOverallTrend = async () => {
      setIsLoadingOverallTrend(true);
      try {
        const res = await fetch('/api/eis/search?type=overall-trend');
        const data = await res.json();
        if (data.success) {
          setOverallTrendData(data.data);
          setDiseaseList(data.diseases);
        }
      } catch (error) {
        console.error('Failed to fetch overall trend:', error);
      } finally {
        setIsLoadingOverallTrend(false);
      }
    };
    fetchOverallTrend();
  }, []);

  // Search function with debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/eis/search?q=${encodeURIComponent(query)}&limit=20`
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle ICD10 selection - fetch diagnoses and trend
  const handleSelectIcd10 = async (icd10: Icd10) => {
    setSelectedIcd10(icd10);
    setIsLoadingDiagnoses(true);
    setIsLoadingTrend(true);

    // Fetch diagnoses, weekly trend, and monthly trend in parallel
    try {
      const [diagRes, trendRes, monthlyRes] = await Promise.all([
        fetch(`/api/eis/search?type=diagnoses&icd10Id=${icd10.id}&limit=50`),
        fetch(`/api/eis/search?type=trend&icd10Id=${icd10.id}`),
        fetch(`/api/eis/search?type=monthly-trend&icd10Id=${icd10.id}`)
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Display items - use search results if searching, otherwise top ICD-10
  const displayItems = searchQuery ? searchResults : topIcd10;

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Cari Penyakit</h2>
          <p className='text-muted-foreground'>
            Cari penyakit berdasarkan kode ICD-10 atau nama penyakit
          </p>
        </div>

        {/* Disease Trend Chart - Only show on root search page */}
        {!selectedIcd10 && (
          <Card className='overflow-hidden'>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <IconTrendingUp className='text-primary h-5 w-5' />
                    Trend Penyakit 6 Bulan Terakhir
                  </CardTitle>
                  <CardDescription>
                    Top 5 penyakit berdasarkan jumlah diagnosa
                  </CardDescription>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {diseaseList.map((disease, index) => (
                    <Badge
                      key={disease.code}
                      variant='outline'
                      className='flex items-center gap-1.5'
                      style={{
                        borderColor:
                          DISEASE_COLORS[index % DISEASE_COLORS.length]
                      }}
                    >
                      <div
                        className='h-2 w-2 rounded-full'
                        style={{
                          backgroundColor:
                            DISEASE_COLORS[index % DISEASE_COLORS.length]
                        }}
                      />
                      <span className='font-mono text-xs'>{disease.code}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoadingOverallTrend ? (
                <div className='flex h-[280px] items-center justify-center'>
                  <IconLoader2 className='text-muted-foreground h-8 w-8 animate-spin' />
                </div>
              ) : overallTrendData.length > 0 ? (
                <div className='h-[280px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart
                      data={overallTrendData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        {diseaseList.map((disease, index) => (
                          <linearGradient
                            key={`gradient-${disease.code}`}
                            id={`gradient-${disease.code}`}
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                          >
                            <stop
                              offset='5%'
                              stopColor={
                                DISEASE_COLORS[index % DISEASE_COLORS.length]
                              }
                              stopOpacity={0.4}
                            />
                            <stop
                              offset='95%'
                              stopColor={
                                DISEASE_COLORS[index % DISEASE_COLORS.length]
                              }
                              stopOpacity={0}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='bulan'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value: string) => {
                          const disease = diseaseList.find(
                            (d) => d.code === value
                          );
                          return disease
                            ? `${value} - ${disease.display}`
                            : value;
                        }}
                      />
                      {diseaseList.map((disease, index) => (
                        <Area
                          key={disease.code}
                          type='monotone'
                          dataKey={disease.code}
                          stroke={DISEASE_COLORS[index % DISEASE_COLORS.length]}
                          strokeWidth={2}
                          fill={`url(#gradient-${disease.code})`}
                          dot={{ r: 3, strokeWidth: 2 }}
                          activeDot={{ r: 5, strokeWidth: 2 }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className='text-muted-foreground flex h-[280px] items-center justify-center'>
                  Tidak ada data trend penyakit
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className='pt-6'>
            <div className='relative'>
              <IconSearch className='text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2' />
              <Input
                type='text'
                placeholder='Ketik kode ICD-10 atau nama penyakit... (contoh: I10, ISPA, Hipertensi, Diabetes)'
                className='h-14 pl-12 text-lg'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isLoading && (
                <IconLoader2 className='text-muted-foreground absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 animate-spin' />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Search Suggestions / Search Results */}
        {!selectedIcd10 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {searchQuery ? 'Hasil Pencarian' : 'Penyakit Umum'}
              </CardTitle>
              <CardDescription>
                {searchQuery
                  ? `Ditemukan ${searchResults.length} hasil untuk "${searchQuery}"`
                  : 'Klik untuk melihat detail diagnosa'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayItems.length === 0 && !isLoading ? (
                <div className='py-8 text-center'>
                  <IconSearch className='text-muted-foreground/50 mx-auto h-12 w-12' />
                  <h3 className='mt-4 text-lg font-medium'>
                    {searchQuery ? 'Tidak ditemukan' : 'Belum ada data'}
                  </h3>
                  <p className='text-muted-foreground'>
                    {searchQuery
                      ? `Tidak ada hasil untuk "${searchQuery}"`
                      : 'Data ICD-10 belum tersedia di database'}
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      className='hover:bg-accent flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors'
                      onClick={() => handleSelectIcd10(item)}
                    >
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full'>
                          <IconVirus className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='secondary' className='font-mono'>
                              {item.code}
                            </Badge>
                            <span className='font-medium'>{item.display}</span>
                          </div>
                          <p className='text-muted-foreground text-sm'>
                            Versi: {item.version}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-primary flex items-center gap-1'>
                          <IconChartBar className='h-4 w-4' />
                          <span className='font-semibold'>
                            {item._count?.diagnoses || 0}
                          </span>
                        </div>
                        <p className='text-muted-foreground text-xs'>
                          diagnosa
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected ICD10 Detail */}
        {selectedIcd10 && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSelectedIcd10(null);
                  setDiagnoses([]);
                  setTrendData([]);
                  setMonthlyTrendData([]);
                }}
              >
                ← Kembali ke pencarian
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
                      <Badge
                        variant='default'
                        className='mb-1 font-mono text-lg'
                      >
                        {selectedIcd10.code}
                      </Badge>
                      <CardTitle className='text-xl'>
                        {selectedIcd10.display}
                      </CardTitle>
                      <CardDescription>
                        Versi: {selectedIcd10.version}
                      </CardDescription>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-primary text-3xl font-bold'>
                      {selectedIcd10._count?.diagnoses || 0}
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      Total Diagnosa
                    </p>
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
                      <div className='text-2xl font-bold'>
                        {diagnoses.length}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Data tersedia
                      </p>
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
                        {
                          label: '18-40 tahun (Dewasa Muda)',
                          min: 18,
                          max: 40
                        },
                        { label: '41-60 tahun (Dewasa)', min: 41, max: 60 },
                        { label: '>60 tahun (Lansia)', min: 61, max: 999 }
                      ].map((group) => {
                        const count = diagnoses.filter(
                          (d) =>
                            d.pasienUmur >= group.min &&
                            d.pasienUmur <= group.max
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
                    <CardTitle className='text-lg'>
                      Distribusi Puskesmas
                    </CardTitle>
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
        )}
      </div>
    </PageContainer>
  );
}
