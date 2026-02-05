'use client';

import { useState, useEffect, useCallback } from 'react';
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
  IconLoader2
} from '@tabler/icons-react';

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

interface DiagnosisDummy {
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

interface SearchResult {
  icd10: Icd10[];
  diagnoses: DiagnosisDummy[];
}

// Dummy data untuk demo (sebelum database terkoneksi)
const dummyIcd10Data: Icd10[] = [
  {
    id: '1',
    code: 'I10',
    display: 'Essential (primary) hypertension',
    version: 'ICD10_2010',
    _count: { diagnoses: 156 }
  },
  {
    id: '2',
    code: 'J06.9',
    display: 'Acute upper respiratory infection, unspecified',
    version: 'ICD10_2010',
    _count: { diagnoses: 234 }
  },
  {
    id: '3',
    code: 'K30',
    display: 'Dyspepsia',
    version: 'ICD10_2010',
    _count: { diagnoses: 89 }
  },
  {
    id: '4',
    code: 'E11.9',
    display: 'Non-insulin-dependent diabetes mellitus without complications',
    version: 'ICD10_2010',
    _count: { diagnoses: 112 }
  },
  {
    id: '5',
    code: 'M79.1',
    display: 'Myalgia',
    version: 'ICD10_2010',
    _count: { diagnoses: 67 }
  },
  {
    id: '6',
    code: 'R50.9',
    display: 'Fever, unspecified',
    version: 'ICD10_2010',
    _count: { diagnoses: 145 }
  },
  {
    id: '7',
    code: 'R51',
    display: 'Headache',
    version: 'ICD10_2010',
    _count: { diagnoses: 98 }
  },
  {
    id: '8',
    code: 'A09',
    display: 'Diarrhoea and gastroenteritis of presumed infectious origin',
    version: 'ICD10_2010',
    _count: { diagnoses: 76 }
  },
  {
    id: '9',
    code: 'M54.5',
    display: 'Low back pain',
    version: 'ICD10_2010',
    _count: { diagnoses: 54 }
  },
  {
    id: '10',
    code: 'K29.7',
    display: 'Gastritis, unspecified',
    version: 'ICD10_2010',
    _count: { diagnoses: 123 }
  }
];

// Generate dummy diagnoses
const generateDummyDiagnoses = (icd10Code: string): DiagnosisDummy[] => {
  const namaLaki = [
    'Slamet',
    'Kusnadi',
    'Suparjo',
    'Warno',
    'Karjo',
    'Sutarno',
    'Paijo',
    'Tarno',
    'Sugiarto',
    'Jumadi',
    'Warsito',
    'Darmanto',
    'Kusno',
    'Parman',
    'Suwandi'
  ];
  const namaPerempuan = [
    'Sumirah',
    'Wartini',
    'Karsini',
    'Sunarti',
    'Tumini',
    'Warsini',
    'Lastri',
    'Maryati',
    'Sutini',
    'Karmi',
    'Jumiyem',
    'Parini',
    'Suwarni',
    'Tukini',
    'Kasiyem'
  ];
  const puskesmasList = [
    'Puskesmas Brebes',
    'Puskesmas Wanasari',
    'Puskesmas Bulakamba',
    'Puskesmas Tanjung',
    'Puskesmas Losari',
    'Puskesmas Jatibarang',
    'Puskesmas Kersana',
    'Puskesmas Ketanggungan'
  ];

  // Generate random sensor for name (e.g., "Slamet S***")
  const generateSensor = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstChar = chars[Math.floor(Math.random() * chars.length)];
    const numStars = Math.floor(Math.random() * 3) + 2; // 2-4 stars
    return ` ${firstChar}${'*'.repeat(numStars)}`;
  };

  const icd10 = dummyIcd10Data.find((d) => d.code === icd10Code);
  if (!icd10) return [];

  const diagnoses: DiagnosisDummy[] = [];
  const count = Math.min(20, icd10._count?.diagnoses || 10);

  for (let i = 0; i < count; i++) {
    const isLaki = Math.random() > 0.5;
    const namaList = isLaki ? namaLaki : namaPerempuan;
    const namaDepan = namaList[Math.floor(Math.random() * namaList.length)];
    const nama = namaDepan + generateSensor();

    let umur: number;
    if (icd10Code === 'I10' || icd10Code === 'E11.9') {
      umur = Math.floor(Math.random() * 40) + 40;
    } else if (icd10Code === 'J06.9' || icd10Code === 'A09') {
      umur = Math.floor(Math.random() * 70) + 5;
    } else {
      umur = Math.floor(Math.random() * 60) + 15;
    }

    const daysAgo = Math.floor(Math.random() * 30);
    const tanggal = new Date();
    tanggal.setDate(tanggal.getDate() - daysAgo);

    diagnoses.push({
      id: `${icd10Code}-${i}`,
      pasienNama: nama,
      pasienUmur: umur,
      pasienGender: isLaki ? 'L' : 'P',
      puskesmas:
        puskesmasList[Math.floor(Math.random() * puskesmasList.length)],
      tanggalPeriksa: tanggal.toISOString(),
      icd10: {
        code: icd10.code,
        display: icd10.display
      }
    });
  }

  return diagnoses.sort(
    (a, b) =>
      new Date(b.tanggalPeriksa).getTime() -
      new Date(a.tanggalPeriksa).getTime()
  );
};

export default function CariPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Icd10[]>([]);
  const [selectedIcd10, setSelectedIcd10] = useState<Icd10 | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisDummy[]>([]);

  // Search function with debounce
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const results = dummyIcd10Data.filter(
        (item) =>
          item.code.toLowerCase().includes(query.toLowerCase()) ||
          item.display.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle ICD10 selection
  const handleSelectIcd10 = (icd10: Icd10) => {
    setSelectedIcd10(icd10);
    const diagnosisData = generateDummyDiagnoses(icd10.code);
    setDiagnoses(diagnosisData);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Cari Penyakit</h2>
          <p className='text-muted-foreground'>
            Cari penyakit berdasarkan kode ICD-10 atau nama penyakit
          </p>
        </div>

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

        {/* Quick Search Suggestions */}
        {!searchQuery && !selectedIcd10 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Penyakit Umum</CardTitle>
              <CardDescription>
                Klik untuk melihat detail diagnosa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {dummyIcd10Data.map((item) => (
                  <Button
                    key={item.id}
                    variant='outline'
                    size='sm'
                    onClick={() => handleSelectIcd10(item)}
                    className='flex items-center gap-2'
                  >
                    <Badge variant='secondary' className='font-mono'>
                      {item.code}
                    </Badge>
                    <span className='max-w-[200px] truncate'>
                      {item.display}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && !selectedIcd10 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Hasil Pencarian</CardTitle>
              <CardDescription>
                Ditemukan {searchResults.length} hasil untuk "{searchQuery}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {searchResults.map((item) => (
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
                      <p className='text-muted-foreground text-xs'>diagnosa</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {searchQuery && searchResults.length === 0 && !isLoading && (
          <Card>
            <CardContent className='py-12 text-center'>
              <IconSearch className='text-muted-foreground/50 mx-auto h-12 w-12' />
              <h3 className='mt-4 text-lg font-medium'>Tidak ditemukan</h3>
              <p className='text-muted-foreground'>
                Tidak ada hasil untuk "{searchQuery}"
              </p>
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
                        30 hari terakhir
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
                        {(
                          (diagnoses.filter((d) => d.pasienGender === 'L')
                            .length /
                            diagnoses.length) *
                          100
                        ).toFixed(1)}
                        %
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
                        {(
                          (diagnoses.filter((d) => d.pasienGender === 'P')
                            .length /
                            diagnoses.length) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </CardContent>
                  </Card>
                </div>

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
                          const percentage =
                            diagnoses.length > 0
                              ? (count / diagnoses.length) * 100
                              : 0;
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
