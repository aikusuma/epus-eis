'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  IconMapPin,
  IconStethoscope,
  IconPill,
  IconMessageCircle,
  IconBabyCarriage,
  IconUser,
  IconFriends,
  IconWheelchair
} from '@tabler/icons-react';
import { useTabFromUrl } from '@/hooks/use-tab-from-url';
import { useMonitoringData, FilterParams } from '@/hooks/use-eis-data';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import untuk Leaflet (harus client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false
});
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

// Chart configs
const diagnosaConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Kasus', color: 'var(--primary)' }
};

const keluhanConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Keluhan', color: '#8b5cf6' }
};

const obatConfig: ChartConfig = {
  jumlah: { label: 'Jumlah Pemakaian', color: '#22c55e' }
};

const COLORS = ['#ec4899', '#f97316', '#eab308', '#22c55e', '#6366f1'];

export default function MonitoringPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('semua');
  const [filters, setFilters] = useState<FilterParams>({});
  const { currentTab, setTab } = useTabFromUrl('diagnosa');

  // Fetch data using SWR
  const { data, isLoading, isError } = useMonitoringData(filters);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const month = newFilters.dateRange?.from?.getMonth();
    const year = newFilters.dateRange?.from?.getFullYear();

    setFilters({
      puskesmasId: newFilters.puskesmasId || undefined,
      bulan: month !== undefined ? month + 1 : undefined,
      tahun: year
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Transform API data
  const top10Diagnosa = useMemo(() => {
    if (!data?.topDiagnosa) return [];
    return data.topDiagnosa.slice(0, 10).map((item: any) => ({
      name: item.nama,
      jumlah: item.jumlahKasus,
      kode: item.kodeIcd
    }));
  }, [data?.topDiagnosa]);

  const top10Keluhan = useMemo(() => {
    if (!data?.topKeluhan) return [];
    return data.topKeluhan.slice(0, 10).map((item: any) => ({
      name: item.keluhan,
      jumlah: item.jumlah
    }));
  }, [data?.topKeluhan]);

  const top10Obat = useMemo(() => {
    if (!data?.topObat) return [];
    return data.topObat.slice(0, 10).map((item: any) => ({
      name: item.namaObat,
      jumlah: item.jumlahPemakaian,
      satuan: item.satuan || 'Tab'
    }));
  }, [data?.topObat]);

  const siklusHidupSummary = useMemo(() => {
    if (!data?.kunjunganBySiklusHidup) return [];
    const kelompokColors: Record<string, string> = {
      Bayi: '#ec4899',
      Anak: '#f97316',
      Remaja: '#eab308',
      Dewasa: '#22c55e',
      Lansia: '#6366f1'
    };
    return data.kunjunganBySiklusHidup.map((item: any) => ({
      name: item.kelompok,
      laki: item.laki || Math.floor(item.jumlah * 0.48),
      perempuan: item.perempuan || Math.floor(item.jumlah * 0.52),
      color: kelompokColors[item.kelompok] || '#94a3b8'
    }));
  }, [data?.kunjunganBySiklusHidup]);

  const sebaranPasienData = useMemo(() => {
    if (!data?.kunjunganByDesa) return [];
    return data.kunjunganByDesa.map((item: any, index: number) => ({
      id: index + 1,
      lat: item.lat || -6.8748 + (Math.random() - 0.5) * 0.1,
      lng: item.lng || 109.0526 + (Math.random() - 0.5) * 0.1,
      desa: item.desa,
      bayi_l: Math.floor(item.jumlah * 0.05),
      bayi_p: Math.floor(item.jumlah * 0.06),
      anak_l: Math.floor(item.jumlah * 0.12),
      anak_p: Math.floor(item.jumlah * 0.13),
      remaja_l: Math.floor(item.jumlah * 0.1),
      remaja_p: Math.floor(item.jumlah * 0.11),
      dewasa_l: Math.floor(item.jumlah * 0.18),
      dewasa_p: Math.floor(item.jumlah * 0.2),
      lansia_l: Math.floor(item.jumlah * 0.07),
      lansia_p: Math.floor(item.jumlah * 0.08)
    }));
  }, [data?.kunjunganByDesa]);

  // Calculate total per siklus hidup
  const totalByGender = siklusHidupSummary.reduce(
    (acc: any, curr: any) => ({
      laki: acc.laki + curr.laki,
      perempuan: acc.perempuan + curr.perempuan
    }),
    { laki: 0, perempuan: 0 }
  );

  return (
    <PageContainer>
      <div className='space-y-6'>
        <DashboardFilter onFilterChange={handleFilterChange} />

        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Monitoring</h2>
            <p className='text-muted-foreground'>
              Sebaran data pasien dan statistik layanan kesehatan
            </p>
          </div>
          <Badge variant='outline' className='flex items-center gap-1'>
            <IconMapPin className='h-3.5 w-3.5' />
            Kabupaten Brebes
          </Badge>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-5'>
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className='pb-2'>
                  <Skeleton className='h-4 w-24' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-8 w-16' />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-5'>
            {siklusHidupSummary.length > 0 ? (
              siklusHidupSummary.map((item: any, index: number) => (
                <Card key={item.name}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {item.name}
                    </CardTitle>
                    <div
                      className='h-3 w-3 rounded-full'
                      style={{ backgroundColor: item.color }}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {(
                        (item.laki || 0) + (item.perempuan || 0)
                      ).toLocaleString()}
                    </div>
                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <span>L: {(item.laki || 0).toLocaleString()}</span>
                      <span>|</span>
                      <span>P: {(item.perempuan || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className='md:col-span-5'>
                <CardContent className='text-muted-foreground py-8 text-center'>
                  Tidak ada data siklus hidup
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconMapPin className='h-5 w-5' />
              Sebaran Data Pasien Berdasarkan Siklus Hidup
            </CardTitle>
            <CardDescription>
              Peta sebaran pasien per kelurahan/desa di Kabupaten Brebes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mb-4 flex flex-wrap gap-2'>
              <Badge
                variant={selectedFilter === 'semua' ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedFilter('semua')}
              >
                Semua
              </Badge>
              <Badge
                variant={selectedFilter === 'bayi' ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedFilter('bayi')}
              >
                <IconBabyCarriage className='mr-1 h-3 w-3' />
                Bayi
              </Badge>
              <Badge
                variant={selectedFilter === 'anak' ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedFilter('anak')}
              >
                Anak
              </Badge>
              <Badge
                variant={selectedFilter === 'remaja' ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedFilter('remaja')}
              >
                <IconUser className='mr-1 h-3 w-3' />
                Remaja
              </Badge>
              <Badge
                variant={selectedFilter === 'dewasa' ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedFilter('dewasa')}
              >
                <IconFriends className='mr-1 h-3 w-3' />
                Dewasa
              </Badge>
              <Badge
                variant={selectedFilter === 'lansia' ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setSelectedFilter('lansia')}
              >
                <IconWheelchair className='mr-1 h-3 w-3' />
                Lansia
              </Badge>
            </div>

            {mounted && (
              <div className='h-[400px] w-full overflow-hidden rounded-lg border'>
                <MapContainer
                  center={[-6.8748, 109.0526]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  />
                  {sebaranPasienData.map((lokasi: any) => {
                    let total = 0;
                    let label = '';

                    if (selectedFilter === 'bayi') {
                      total = lokasi.bayi_l + lokasi.bayi_p;
                      label = `Bayi L: ${lokasi.bayi_l}, P: ${lokasi.bayi_p}`;
                    } else if (selectedFilter === 'anak') {
                      total = lokasi.anak_l + lokasi.anak_p;
                      label = `Anak L: ${lokasi.anak_l}, P: ${lokasi.anak_p}`;
                    } else if (selectedFilter === 'remaja') {
                      total = lokasi.remaja_l + lokasi.remaja_p;
                      label = `Remaja L: ${lokasi.remaja_l}, P: ${lokasi.remaja_p}`;
                    } else if (selectedFilter === 'dewasa') {
                      total = lokasi.dewasa_l + lokasi.dewasa_p;
                      label = `Dewasa L: ${lokasi.dewasa_l}, P: ${lokasi.dewasa_p}`;
                    } else if (selectedFilter === 'lansia') {
                      total = lokasi.lansia_l + lokasi.lansia_p;
                      label = `Lansia L: ${lokasi.lansia_l}, P: ${lokasi.lansia_p}`;
                    } else {
                      total =
                        lokasi.bayi_l +
                        lokasi.bayi_p +
                        lokasi.anak_l +
                        lokasi.anak_p +
                        lokasi.remaja_l +
                        lokasi.remaja_p +
                        lokasi.dewasa_l +
                        lokasi.dewasa_p +
                        lokasi.lansia_l +
                        lokasi.lansia_p;
                      label = `Total Pasien`;
                    }

                    const radius = Math.max(10, Math.min(30, total / 20));

                    return (
                      <CircleMarker
                        key={lokasi.id}
                        center={[lokasi.lat, lokasi.lng]}
                        radius={radius}
                        pathOptions={{
                          fillColor: 'var(--primary)',
                          fillOpacity: 0.6,
                          color: 'var(--primary)',
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className='min-w-[180px]'>
                            <h3 className='mb-2 font-semibold'>
                              {lokasi.desa}
                            </h3>
                            <div className='space-y-1 text-sm'>
                              <p>
                                <strong>Total:</strong> {total} pasien
                              </p>
                              <p className='text-muted-foreground'>{label}</p>
                              <hr className='my-2' />
                              <p>
                                Bayi: {lokasi.bayi_l + lokasi.bayi_p} (L:
                                {lokasi.bayi_l}, P:{lokasi.bayi_p})
                              </p>
                              <p>
                                Anak: {lokasi.anak_l + lokasi.anak_p} (L:
                                {lokasi.anak_l}, P:{lokasi.anak_p})
                              </p>
                              <p>
                                Remaja: {lokasi.remaja_l + lokasi.remaja_p} (L:
                                {lokasi.remaja_l}, P:{lokasi.remaja_p})
                              </p>
                              <p>
                                Dewasa: {lokasi.dewasa_l + lokasi.dewasa_p} (L:
                                {lokasi.dewasa_l}, P:{lokasi.dewasa_p})
                              </p>
                              <p>
                                Lansia: {lokasi.lansia_l + lokasi.lansia_p} (L:
                                {lokasi.lansia_l}, P:{lokasi.lansia_p})
                              </p>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            )}

            {/* Legend */}
            <div className='mt-4 flex flex-wrap gap-4'>
              {siklusHidupSummary.map((item: any) => (
                <div
                  key={item.name}
                  className='flex items-center gap-2 text-sm'
                >
                  <div
                    className='h-3 w-3 rounded-full'
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Tabs value={currentTab} onValueChange={setTab} className='space-y-4'>
          <TabsList className='grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3'>
            <TabsTrigger value='diagnosa' className='flex items-center gap-1.5'>
              <IconStethoscope className='h-4 w-4' />
              <span className='hidden sm:inline'>Top 10 Diagnosa</span>
              <span className='sm:hidden'>Diagnosa</span>
            </TabsTrigger>
            <TabsTrigger value='keluhan' className='flex items-center gap-1.5'>
              <IconMessageCircle className='h-4 w-4' />
              <span className='hidden sm:inline'>Top 10 Keluhan</span>
              <span className='sm:hidden'>Keluhan</span>
            </TabsTrigger>
            <TabsTrigger value='obat' className='flex items-center gap-1.5'>
              <IconPill className='h-4 w-4' />
              <span className='hidden sm:inline'>Top 10 Pemakaian Obat</span>
              <span className='sm:hidden'>Obat</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Top 10 Diagnosa */}
          <TabsContent value='diagnosa' className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Diagnosa Terbanyak</CardTitle>
                  <CardDescription>Berdasarkan jumlah kasus</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={diagnosaConfig}
                    className='h-[400px] w-full'
                  >
                    <BarChart data={top10Diagnosa} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' fontSize={12} />
                      <YAxis
                        dataKey='name'
                        type='category'
                        fontSize={11}
                        width={100}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey='jumlah' radius={[0, 4, 4, 0]}>
                        {top10Diagnosa.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(192, 100%, ${35 + index * 5}%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail Diagnosa</CardTitle>
                  <CardDescription>
                    Kode ICD-10 dan jumlah kasus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {top10Diagnosa.map((item: any, index: number) => (
                      <div
                        key={item.name}
                        className='flex items-center justify-between rounded-lg border p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge
                            variant='outline'
                            className='w-8 justify-center'
                          >
                            {index + 1}
                          </Badge>
                          <div>
                            <p className='font-medium'>{item.name}</p>
                            <p className='text-muted-foreground text-sm'>
                              {item.kode}
                            </p>
                          </div>
                        </div>
                        <Badge variant='secondary'>
                          {(item.jumlah || 0).toLocaleString()} kasus
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Top 10 Keluhan */}
          <TabsContent value='keluhan' className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Keluhan Pasien</CardTitle>
                  <CardDescription>
                    Keluhan yang paling sering dilaporkan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={keluhanConfig}
                    className='h-[400px] w-full'
                  >
                    <BarChart data={top10Keluhan} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' fontSize={12} />
                      <YAxis
                        dataKey='name'
                        type='category'
                        fontSize={11}
                        width={100}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey='jumlah' radius={[0, 4, 4, 0]}>
                        {top10Keluhan.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(270, 80%, ${40 + index * 5}%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail Keluhan</CardTitle>
                  <CardDescription>Jumlah laporan keluhan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {top10Keluhan.map((item: any, index: number) => (
                      <div
                        key={item.name}
                        className='flex items-center justify-between rounded-lg border p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge
                            variant='outline'
                            className='w-8 justify-center'
                          >
                            {index + 1}
                          </Badge>
                          <p className='font-medium'>{item.name}</p>
                        </div>
                        <Badge variant='secondary'>
                          {(item.jumlah || 0).toLocaleString()} laporan
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Top 10 Pemakaian Obat */}
          <TabsContent value='obat' className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Pemakaian Obat</CardTitle>
                  <CardDescription>
                    Obat yang paling banyak digunakan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={obatConfig}
                    className='h-[400px] w-full'
                  >
                    <BarChart data={top10Obat} layout='vertical'>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis type='number' fontSize={12} />
                      <YAxis
                        dataKey='name'
                        type='category'
                        fontSize={10}
                        width={120}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey='jumlah' radius={[0, 4, 4, 0]}>
                        {top10Obat.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(142, 70%, ${30 + index * 5}%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail Pemakaian Obat</CardTitle>
                  <CardDescription>Jumlah pemakaian dan satuan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {top10Obat.map((item: any, index: number) => (
                      <div
                        key={item.name}
                        className='flex items-center justify-between rounded-lg border p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge
                            variant='outline'
                            className='w-8 justify-center'
                          >
                            {index + 1}
                          </Badge>
                          <p className='font-medium'>{item.name}</p>
                        </div>
                        <Badge variant='secondary'>
                          {(item.jumlah || 0).toLocaleString()}{' '}
                          {item.satuan || ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
