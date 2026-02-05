'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconCalendar,
  IconBuildingHospital,
  IconUsers,
  IconVirus,
  IconPill,
  IconStethoscope,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconBabyCarriage,
  IconHeartbeat
} from '@tabler/icons-react';
import {
  useOverviewData,
  useKlaster1Data,
  useKlaster2Data,
  useKlaster3Data,
  useLintasKlasterData
} from '@/hooks/use-eis-data';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';

// Report types available
const REPORT_TYPES = [
  {
    id: 'kunjungan',
    label: 'Laporan Kunjungan',
    icon: IconUsers,
    description: 'Data kunjungan pasien per bulan'
  },
  {
    id: 'penyakit',
    label: 'Laporan Top 10 Penyakit',
    icon: IconVirus,
    description: 'Penyakit terbanyak berdasarkan diagnosa'
  },
  {
    id: 'obat',
    label: 'Laporan Top 10 Obat',
    icon: IconPill,
    description: 'Obat terbanyak digunakan'
  },
  {
    id: 'sdm',
    label: 'Laporan SDM Kesehatan',
    icon: IconStethoscope,
    description: 'Data tenaga kesehatan'
  },
  {
    id: 'imunisasi',
    label: 'Laporan Imunisasi',
    icon: IconBuildingHospital,
    description: 'Capaian program imunisasi'
  },
  {
    id: 'anc',
    label: 'Laporan ANC (Ibu Hamil)',
    icon: IconUsers,
    description: 'Pemeriksaan kehamilan'
  },
  {
    id: 'siklus-hidup',
    label: 'Sebaran Siklus Hidup',
    icon: IconBabyCarriage,
    description: 'Distribusi pasien berdasarkan usia'
  },
  {
    id: 'rawat-inap',
    label: 'Laporan Rawat Inap',
    icon: IconBuildingHospital,
    description: 'Data rawat inap dan BOR'
  },
  {
    id: 'deteksi-dini',
    label: 'Laporan Deteksi Dini',
    icon: IconHeartbeat,
    description: 'Skrining PTM dan kanker'
  }
];

const PAGE_SIZES = [10, 25, 50, 100];

// Excel export function
function exportToExcel(
  data: any[],
  filename: string,
  columns: { key: string; header: string }[]
) {
  // Create CSV content
  const headers = columns.map((c) => c.header).join(',');
  const rows = data
    .map((row) =>
      columns
        .map((c) => {
          const value = row[c.key];
          // Escape commas and quotes
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    )
    .join('\n');

  const csvContent = `${headers}\n${rows}`;

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function LaporanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialReport = searchParams.get('report') || '';

  const [selectedReport, setSelectedReport] = useState<string>(initialReport);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Update URL when report changes
  useEffect(() => {
    if (selectedReport) {
      router.replace(`/dashboard/laporan?report=${selectedReport}`, {
        scroll: false
      });
    }
  }, [selectedReport, router]);

  // Filter state
  const [puskesmasId, setPuskesmasId] = useState<string>('all');
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());

  // Handle filter change
  const handleFilterChange = useCallback((filters: FilterValues) => {
    setPuskesmasId(filters.puskesmasId);
    if (filters.dateRange?.from) {
      setBulan(filters.dateRange.from.getMonth() + 1);
      setTahun(filters.dateRange.from.getFullYear());
    }
    setCurrentPage(1); // Reset page on filter change
  }, []);

  // Fetch all data hooks with filter
  const filterParams = { puskesmasId, bulan, tahun };
  const { data: overviewData, isLoading: loadingOverview } =
    useOverviewData(filterParams);
  const { data: klaster1Data, isLoading: loadingK1 } =
    useKlaster1Data(filterParams);
  const { data: klaster2Data, isLoading: loadingK2 } =
    useKlaster2Data(filterParams);
  const { data: klaster3Data, isLoading: loadingK3 } =
    useKlaster3Data(filterParams);
  const { data: lintasData, isLoading: loadingLintas } =
    useLintasKlasterData(filterParams);

  const isLoading =
    loadingOverview || loadingK1 || loadingK2 || loadingK3 || loadingLintas;

  // Get report data based on selection
  const { tableData, columns, title } = useMemo(() => {
    switch (selectedReport) {
      case 'kunjungan':
        return {
          title: 'Laporan Kunjungan Pasien',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'bulan', header: 'Bulan' },
            { key: 'kunjungan', header: 'Total Kunjungan' },
            { key: 'bpjs', header: 'Pasien BPJS' },
            { key: 'umum', header: 'Pasien Umum' }
          ],
          tableData: (overviewData?.trend || []).map((t: any, i: number) => ({
            no: i + 1,
            bulan: t.bulan,
            kunjungan: t.kunjungan || 0,
            bpjs: t.bpjs || 0,
            umum: t.umum || 0
          }))
        };

      case 'penyakit':
        return {
          title: 'Laporan Top 10 Penyakit',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'icd10Code', header: 'Kode ICD-10' },
            { key: 'nama', header: 'Nama Penyakit' },
            { key: 'jumlah', header: 'Jumlah Kasus' }
          ],
          tableData: (overviewData?.topPenyakit || []).map(
            (p: any, i: number) => ({
              no: i + 1,
              icd10Code: p.icd10Code,
              nama: p.nama || p.icd10Code,
              jumlah: p.jumlah
            })
          )
        };

      case 'obat':
        return {
          title: 'Laporan Top 10 Pemakaian Obat',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'namaObat', header: 'Nama Obat' },
            { key: 'stok', header: 'Stok' },
            { key: 'pemakaian', header: 'Pemakaian' },
            { key: 'status', header: 'Status' }
          ],
          tableData: (klaster1Data?.obat || []).map((o: any, i: number) => ({
            no: i + 1,
            namaObat: o.namaObat,
            stok: o.stok || 0,
            pemakaian: o.pemakaian || 0,
            status: o.stok < 100 ? 'Kritis' : o.stok < 300 ? 'Rendah' : 'Normal'
          }))
        };

      case 'sdm':
        return {
          title: 'Laporan SDM Kesehatan',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'kategori', header: 'Kategori Tenaga' },
            { key: 'jumlah', header: 'Jumlah' },
            { key: 'target', header: 'Target' },
            { key: 'capaian', header: 'Capaian (%)' }
          ],
          tableData: (klaster1Data?.sdm || []).map((s: any, i: number) => ({
            no: i + 1,
            kategori: s.kategori,
            jumlah: s.jumlah || 0,
            target: s.target || 0,
            capaian: s.target ? Math.round((s.jumlah / s.target) * 100) : 0
          }))
        };

      case 'imunisasi':
        return {
          title: 'Laporan Capaian Imunisasi',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'nama', header: 'Jenis Imunisasi' },
            { key: 'kategori', header: 'Kategori' },
            { key: 'sasaran', header: 'Sasaran' },
            { key: 'capaian', header: 'Capaian' },
            { key: 'persen', header: 'Persentase (%)' }
          ],
          tableData: (klaster2Data?.imunisasi || []).map(
            (im: any, i: number) => ({
              no: i + 1,
              nama: im.jenisImunisasi || im.nama,
              kategori: im.kategori || '-',
              sasaran: im.sasaran || im.target || 0,
              capaian: im.capaian || 0,
              persen:
                im.sasaran || im.target
                  ? Math.round((im.capaian / (im.sasaran || im.target)) * 100)
                  : 0
            })
          )
        };

      case 'anc':
        const ancTrend = klaster2Data?.ancTrend || [];
        return {
          title: 'Laporan ANC (Pemeriksaan Ibu Hamil)',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'bulan', header: 'Bulan' },
            { key: 'k1', header: 'K1' },
            { key: 'k4', header: 'K4' },
            { key: 'target', header: 'Target' },
            { key: 'capaianK4', header: 'Capaian K4 (%)' }
          ],
          tableData: ancTrend.map((a: any, i: number) => ({
            no: i + 1,
            bulan: `Bulan ${a.bulan}`,
            k1: a.k1 || 0,
            k4: a.k4 || 0,
            target: a.target || 80,
            capaianK4: a.target ? Math.round((a.k4 / a.target) * 100) : 0
          }))
        };

      case 'siklus-hidup':
        // Pull from distribusiUsia in overview data
        const distribusi = overviewData?.distribusiUsia || [];
        const siklusHidupLabels: Record<string, string> = {
          bayi: 'Bayi (0-11 bulan)',
          balita: 'Balita (1-4 tahun)',
          anak: 'Anak (5-14 tahun)',
          remaja: 'Remaja (15-24 tahun)',
          dewasa: 'Dewasa (25-44 tahun)',
          paruh_baya: 'Paruh Baya (45-59 tahun)',
          lansia: 'Lansia (60+ tahun)'
        };

        return {
          title: 'Sebaran Data Pasien Berdasarkan Siklus Hidup',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'golongan', header: 'Golongan Umur' },
            { key: 'laki', header: 'Laki-laki' },
            { key: 'perempuan', header: 'Perempuan' },
            { key: 'total', header: 'Total' },
            { key: 'persen', header: 'Persentase (%)' }
          ],
          tableData: distribusi.map((d: any, i: number) => {
            const total = (d.laki || 0) + (d.perempuan || 0);
            const grandTotal = distribusi.reduce(
              (acc: number, curr: any) =>
                acc + (curr.laki || 0) + (curr.perempuan || 0),
              0
            );
            return {
              no: i + 1,
              golongan:
                siklusHidupLabels[d.kelompok] || d.kelompok || `Group ${i + 1}`,
              laki: d.laki || 0,
              perempuan: d.perempuan || 0,
              total,
              persen:
                grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0
            };
          })
        };

      case 'rawat-inap':
        return {
          title: 'Laporan Rawat Inap',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'tanggal', header: 'Tanggal' },
            { key: 'masuk', header: 'Pasien Masuk' },
            { key: 'keluar', header: 'Pasien Keluar' },
            { key: 'bed_terisi', header: 'Bed Terisi' },
            { key: 'bed_total', header: 'Total Bed' },
            { key: 'bor', header: 'BOR (%)' }
          ],
          tableData: Array.isArray(lintasData?.rawatInap)
            ? lintasData.rawatInap.map((r: any, i: number) => ({
                no: i + 1,
                tanggal: r.tanggal
                  ? new Date(r.tanggal).toLocaleDateString('id-ID')
                  : '-',
                masuk: r.pasienMasuk || 0,
                keluar: r.pasienKeluar || 0,
                bed_terisi: r.bedTerisi || 0,
                bed_total: r.bedTotal || 0,
                bor: r.bedTotal
                  ? Math.round((r.bedTerisi / r.bedTotal) * 100)
                  : 0
              }))
            : []
        };

      case 'deteksi-dini':
        return {
          title: 'Laporan Deteksi Dini & Skrining PTM',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'jenis', header: 'Jenis Skrining' },
            { key: 'sasaran', header: 'Sasaran' },
            { key: 'capaian', header: 'Capaian' },
            { key: 'persen', header: 'Persentase (%)' }
          ],
          tableData: (klaster3Data?.deteksiDini || []).map(
            (d: any, i: number) => ({
              no: i + 1,
              jenis: d.jenis,
              sasaran: d.sasaran || 0,
              capaian: d.capaian || 0,
              persen: d.sasaran ? Math.round((d.capaian / d.sasaran) * 100) : 0
            })
          )
        };

      default:
        return { title: '', columns: [], tableData: [] };
    }
  }, [
    selectedReport,
    overviewData,
    klaster1Data,
    klaster2Data,
    klaster3Data,
    lintasData
  ]);

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;

    const query = searchQuery.toLowerCase();
    return tableData.filter((row: any) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [tableData, searchQuery]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleExport = useCallback(() => {
    if (filteredData.length > 0 && columns.length > 0) {
      const filename = `laporan_${selectedReport}_${bulan}_${tahun}`;
      exportToExcel(filteredData, filename, columns);
    }
  }, [filteredData, columns, selectedReport, bulan, tahun]);

  const selectedReportInfo = REPORT_TYPES.find((r) => r.id === selectedReport);

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Laporan</h2>
            <p className='text-muted-foreground'>
              Pilih jenis laporan untuk ditampilkan dan export ke Excel
            </p>
          </div>
          <Badge variant='outline' className='flex items-center gap-1'>
            <IconCalendar className='h-3.5 w-3.5' />
            {new Date().toLocaleDateString('id-ID', {
              month: 'long',
              year: 'numeric'
            })}
          </Badge>
        </div>

        {/* Filter */}
        <DashboardFilter
          onFilterChange={handleFilterChange}
          showJenisLayanan={false}
        />

        {/* Report Selection */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconFileSpreadsheet className='h-5 w-5' />
              Pilih Jenis Laporan
            </CardTitle>
            <CardDescription>
              Klik salah satu jenis laporan untuk menampilkan data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
              {REPORT_TYPES.map((report) => {
                const Icon = report.icon;
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      setSelectedReport(report.id);
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className={`hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
                      isSelected ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span className='text-xs font-medium'>{report.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {selectedReport && (
          <Card>
            <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  {selectedReportInfo?.description}
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  onClick={handleExport}
                  disabled={filteredData.length === 0}
                  className='gap-2'
                >
                  <IconDownload className='h-4 w-4' />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Page Size */}
              <div className='mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='relative w-full md:w-72'>
                  <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    placeholder='Cari data...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-9'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-sm'>
                    Tampilkan:
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='w-20'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className='text-muted-foreground text-sm'>
                    dari {filteredData.length} data
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : paginatedData.length === 0 ? (
                <div className='text-muted-foreground py-12 text-center'>
                  <IconFileSpreadsheet className='mx-auto h-12 w-12 opacity-50' />
                  <p className='mt-2'>
                    {searchQuery
                      ? `Tidak ditemukan data untuk "${searchQuery}"`
                      : 'Tidak ada data untuk laporan ini'}
                  </p>
                </div>
              ) : (
                <>
                  <div className='overflow-x-auto rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((col) => (
                            <TableHead key={col.key}>{col.header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((row: any, index: number) => (
                          <TableRow key={index}>
                            {columns.map((col) => (
                              <TableCell key={col.key}>
                                {col.key === 'status' ? (
                                  <Badge
                                    variant={
                                      row[col.key] === 'Kritis'
                                        ? 'destructive'
                                        : row[col.key] === 'Rendah'
                                          ? 'secondary'
                                          : 'default'
                                    }
                                  >
                                    {row[col.key]}
                                  </Badge>
                                ) : typeof row[col.key] === 'number' ? (
                                  row[col.key].toLocaleString('id-ID')
                                ) : (
                                  (row[col.key] ?? '-')
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className='mt-4 flex items-center justify-between'>
                      <div className='text-muted-foreground text-sm'>
                        Halaman {currentPage} dari {totalPages}
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <IconChevronLeft className='h-4 w-4' />
                          Sebelumnya
                        </Button>
                        <div className='flex items-center gap-1'>
                          {Array.from({ length: Math.min(5, totalPages) }).map(
                            (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={i}
                                  variant={
                                    currentPage === pageNum
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size='sm'
                                  className='h-8 w-8 p-0'
                                  onClick={() => setCurrentPage(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Selanjutnya
                          <IconChevronRight className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Selection State */}
        {!selectedReport && (
          <Card>
            <CardContent className='py-12 text-center'>
              <IconFileSpreadsheet className='text-muted-foreground mx-auto h-16 w-16 opacity-50' />
              <h3 className='mt-4 text-lg font-medium'>Pilih Jenis Laporan</h3>
              <p className='text-muted-foreground mt-1'>
                Klik salah satu jenis laporan di atas untuk menampilkan data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
