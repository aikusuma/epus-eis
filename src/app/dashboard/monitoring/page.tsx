'use client';

import { useEffect, useState, useCallback } from 'react';
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

// Data sebaran pasien berdasarkan siklus hidup per lokasi
const sebaranPasienData = [
  {
    id: 1,
    lat: -6.8748,
    lng: 109.0526,
    desa: 'Brebes',
    bayi_l: 45,
    bayi_p: 52,
    anak_l: 120,
    anak_p: 115,
    remaja_l: 89,
    remaja_p: 95,
    dewasa_l: 234,
    dewasa_p: 256,
    lansia_l: 78,
    lansia_p: 92
  },
  {
    id: 2,
    lat: -6.889,
    lng: 109.0421,
    desa: 'Gandasuli',
    bayi_l: 32,
    bayi_p: 38,
    anak_l: 85,
    anak_p: 90,
    remaja_l: 65,
    remaja_p: 70,
    dewasa_l: 178,
    dewasa_p: 195,
    lansia_l: 55,
    lansia_p: 62
  },
  {
    id: 3,
    lat: -6.8623,
    lng: 109.0687,
    desa: 'Pasarbatang',
    bayi_l: 28,
    bayi_p: 35,
    anak_l: 72,
    anak_p: 78,
    remaja_l: 58,
    remaja_p: 62,
    dewasa_l: 156,
    dewasa_p: 168,
    lansia_l: 48,
    lansia_p: 55
  },
  {
    id: 4,
    lat: -6.8956,
    lng: 109.0312,
    desa: 'Limbangan Kulon',
    bayi_l: 25,
    bayi_p: 30,
    anak_l: 65,
    anak_p: 68,
    remaja_l: 52,
    remaja_p: 55,
    dewasa_l: 142,
    dewasa_p: 155,
    lansia_l: 42,
    lansia_p: 48
  },
  {
    id: 5,
    lat: -6.8512,
    lng: 109.0845,
    desa: 'Kaligangsa',
    bayi_l: 38,
    bayi_p: 42,
    anak_l: 98,
    anak_p: 105,
    remaja_l: 75,
    remaja_p: 82,
    dewasa_l: 198,
    dewasa_p: 215,
    lansia_l: 62,
    lansia_p: 70
  },
  {
    id: 6,
    lat: -6.8789,
    lng: 109.0156,
    desa: 'Wanasari',
    bayi_l: 22,
    bayi_p: 28,
    anak_l: 58,
    anak_p: 62,
    remaja_l: 45,
    remaja_p: 48,
    dewasa_l: 125,
    dewasa_p: 138,
    lansia_l: 38,
    lansia_p: 45
  },
  {
    id: 7,
    lat: -6.9012,
    lng: 109.0589,
    desa: 'Bulakamba',
    bayi_l: 35,
    bayi_p: 40,
    anak_l: 92,
    anak_p: 98,
    remaja_l: 70,
    remaja_p: 75,
    dewasa_l: 185,
    dewasa_p: 198,
    lansia_l: 58,
    lansia_p: 65
  },
  {
    id: 8,
    lat: -6.8456,
    lng: 109.0234,
    desa: 'Tanjung',
    bayi_l: 18,
    bayi_p: 22,
    anak_l: 48,
    anak_p: 52,
    remaja_l: 38,
    remaja_p: 42,
    dewasa_l: 105,
    dewasa_p: 115,
    lansia_l: 32,
    lansia_p: 38
  }
];

// Top 10 Diagnosa
const top10Diagnosa = [
  { name: 'ISPA', jumlah: 1245, kode: 'J06.9' },
  { name: 'Hipertensi', jumlah: 892, kode: 'I10' },
  { name: 'Diabetes Mellitus', jumlah: 756, kode: 'E11.9' },
  { name: 'Gastritis', jumlah: 623, kode: 'K29.7' },
  { name: 'Dermatitis', jumlah: 534, kode: 'L30.9' },
  { name: 'Myalgia', jumlah: 478, kode: 'M79.1' },
  { name: 'Cephalgia', jumlah: 425, kode: 'R51' },
  { name: 'Dyspepsia', jumlah: 398, kode: 'K30' },
  { name: 'Febris', jumlah: 356, kode: 'R50.9' },
  { name: 'Arthralgia', jumlah: 312, kode: 'M25.5' }
];

// Top 10 Keluhan
const top10Keluhan = [
  { name: 'Batuk', jumlah: 1567 },
  { name: 'Demam', jumlah: 1234 },
  { name: 'Sakit Kepala', jumlah: 1089 },
  { name: 'Nyeri Perut', jumlah: 876 },
  { name: 'Pilek', jumlah: 798 },
  { name: 'Mual', jumlah: 654 },
  { name: 'Pusing', jumlah: 589 },
  { name: 'Nyeri Sendi', jumlah: 534 },
  { name: 'Lemas', jumlah: 478 },
  { name: 'Sesak Nafas', jumlah: 423 }
];

// Top 10 Pemakaian Obat
const top10Obat = [
  { name: 'Paracetamol 500mg', jumlah: 8956, satuan: 'Tab' },
  { name: 'Amoxicillin 500mg', jumlah: 5678, satuan: 'Kaps' },
  { name: 'Antasida DOEN', jumlah: 4532, satuan: 'Tab' },
  { name: 'Vitamin B Complex', jumlah: 4123, satuan: 'Tab' },
  { name: 'Amlodipine 5mg', jumlah: 3876, satuan: 'Tab' },
  { name: 'Metformin 500mg', jumlah: 3654, satuan: 'Tab' },
  { name: 'Omeprazole 20mg', jumlah: 3234, satuan: 'Kaps' },
  { name: 'Cetirizine 10mg', jumlah: 2987, satuan: 'Tab' },
  { name: 'Ibuprofen 400mg', jumlah: 2756, satuan: 'Tab' },
  { name: 'Salbutamol 2mg', jumlah: 2543, satuan: 'Tab' }
];

// Data siklus hidup summary
const siklusHidupSummary = [
  { name: 'Bayi (0-1)', laki: 243, perempuan: 287, color: '#ec4899' },
  { name: 'Anak (1-12)', laki: 638, perempuan: 668, color: '#f97316' },
  { name: 'Remaja (12-25)', laki: 492, perempuan: 529, color: '#eab308' },
  { name: 'Dewasa (25-60)', laki: 1323, perempuan: 1440, color: '#22c55e' },
  { name: 'Lansia (>60)', laki: 413, perempuan: 475, color: '#6366f1' }
];

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
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const { currentTab, setTab } = useTabFromUrl('diagnosa');

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    console.log('Monitoring Filters changed:', newFilters);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total per siklus hidup
  const totalByGender = siklusHidupSummary.reduce(
    (acc, curr) => ({
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
        <div className='grid gap-4 md:grid-cols-5'>
          {siklusHidupSummary.map((item, index) => (
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
                  {(item.laki + item.perempuan).toLocaleString()}
                </div>
                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                  <span>L: {item.laki.toLocaleString()}</span>
                  <span>|</span>
                  <span>P: {item.perempuan.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                  {sebaranPasienData.map((lokasi) => {
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
              {siklusHidupSummary.map((item) => (
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
                        {top10Diagnosa.map((entry, index) => (
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
                    {top10Diagnosa.map((item, index) => (
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
                          {item.jumlah.toLocaleString()} kasus
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
                        {top10Keluhan.map((entry, index) => (
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
                    {top10Keluhan.map((item, index) => (
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
                          {item.jumlah.toLocaleString()} laporan
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
                        {top10Obat.map((entry, index) => (
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
                    {top10Obat.map((item, index) => (
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
                          {item.jumlah.toLocaleString()} {item.satuan}
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
