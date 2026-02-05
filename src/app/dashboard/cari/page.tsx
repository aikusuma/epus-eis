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
import PageContainer from '@/components/layout/page-container';
import {
  IconSearch,
  IconVirus,
  IconChartBar,
  IconLoader2,
  IconTrendingUp
} from '@tabler/icons-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

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
  const [isLoadingOverallTrend, setIsLoadingOverallTrend] = useState(true);
  const [searchResults, setSearchResults] = useState<Icd10[]>([]);
  const [topIcd10, setTopIcd10] = useState<Icd10[]>([]);
  const [overallTrendData, setOverallTrendData] = useState<OverallTrendData[]>(
    []
  );
  const [diseaseList, setDiseaseList] = useState<DiseaseInfo[]>([]);

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

        {/* Disease Trend Chart */}
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
                      borderColor: DISEASE_COLORS[index % DISEASE_COLORS.length]
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
                  <Link
                    key={item.id}
                    href={`/dashboard/cari/${item.code}`}
                    className='hover:bg-accent flex items-center justify-between rounded-lg border p-4 transition-colors'
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
                      <p className='text-muted-foreground text-xs'>diagnosa</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
