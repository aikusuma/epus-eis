'use client';

import { useState, useMemo, useCallback } from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  IconStethoscope
} from '@tabler/icons-react';
import {
  useOverviewData,
  useKlaster1Data,
  useKlaster2Data,
  useKlaster3Data,
  useKlaster4Data,
  useMonitoringData,
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
    label: 'Laporan Stok Obat',
    icon: IconPill,
    description: 'Status ketersediaan obat di puskesmas'
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
    id: 'rawat-inap',
    label: 'Laporan Rawat Inap',
    icon: IconBuildingHospital,
    description: 'Data rawat inap dan BOR'
  }
];

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
  const [selectedReport, setSelectedReport] = useState<string>('');

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
  const { data: klaster4Data, isLoading: loadingK4 } =
    useKlaster4Data(filterParams);
  const { data: monitoringData, isLoading: loadingMonitoring } =
    useMonitoringData(filterParams);
  const { data: lintasData, isLoading: loadingLintas } =
    useLintasKlasterData(filterParams);

  const isLoading =
    loadingOverview ||
    loadingK1 ||
    loadingK2 ||
    loadingK3 ||
    loadingK4 ||
    loadingMonitoring ||
    loadingLintas;

  // Get report data based on selection
  const { tableData, columns, title } = useMemo(() => {
    switch (selectedReport) {
      case 'kunjungan':
        return {
          title: 'Laporan Kunjungan Pasien',
          columns: [
            { key: 'bulan', header: 'Bulan' },
            { key: 'kunjungan', header: 'Total Kunjungan' },
            { key: 'bpjs', header: 'Pasien BPJS' },
            { key: 'umum', header: 'Pasien Umum' }
          ],
          tableData: overviewData?.trend || []
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
              ...p
            })
          )
        };

      case 'obat':
        return {
          title: 'Laporan Stok Obat',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'namaObat', header: 'Nama Obat' },
            { key: 'stokAwal', header: 'Stok Awal' },
            { key: 'pemakaian', header: 'Pemakaian' },
            { key: 'stokAkhir', header: 'Stok Akhir' },
            { key: 'status', header: 'Status' }
          ],
          tableData: (klaster1Data?.obat || []).map((o: any, i: number) => ({
            no: i + 1,
            namaObat: o.namaObat,
            stokAwal: o.stokAwal || 0,
            pemakaian: o.pemakaian || 0,
            stokAkhir: o.stokAkhir || 0,
            status: o.status || 'Normal'
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
            { key: 'target', header: 'Target' },
            { key: 'capaian', header: 'Capaian' },
            { key: 'persen', header: 'Persentase (%)' }
          ],
          tableData: (klaster2Data?.imunisasi || []).map(
            (im: any, i: number) => ({
              no: i + 1,
              nama: im.nama || im.jenisImunisasi,
              target: im.sasaran || im.target || 0,
              capaian: im.capaian || 0,
              persen:
                im.sasaran || im.target
                  ? Math.round((im.capaian / (im.sasaran || im.target)) * 100)
                  : 0
            })
          )
        };

      case 'anc':
        // ANC is a single object with k1, k4, target - not an array
        // Also use ancTrend for historical data
        const ancData = klaster2Data?.anc;
        const ancTrend = klaster2Data?.ancTrend || [];

        // Create table from trend data if available, otherwise from single object
        if (ancTrend.length > 0) {
          return {
            title: 'Laporan ANC (Pemeriksaan Ibu Hamil)',
            columns: [
              { key: 'no', header: 'No' },
              { key: 'bulan', header: 'Bulan' },
              { key: 'k1', header: 'K1' },
              { key: 'k4', header: 'K4' }
            ],
            tableData: ancTrend.map((a: any, i: number) => ({
              no: i + 1,
              bulan: `Bulan ${a.bulan}`,
              k1: a.k1 || 0,
              k4: a.k4 || 0
            }))
          };
        }

        // Fallback to single object
        return {
          title: 'Laporan ANC (Pemeriksaan Ibu Hamil)',
          columns: [
            { key: 'no', header: 'No' },
            { key: 'jenis', header: 'Jenis Pemeriksaan' },
            { key: 'target', header: 'Target' },
            { key: 'capaian', header: 'Capaian' },
            { key: 'persen', header: 'Persentase (%)' }
          ],
          tableData: ancData
            ? [
                {
                  no: 1,
                  jenis: 'Kunjungan K1 (Pertama)',
                  target: ancData.target || 0,
                  capaian: ancData.k1 || 0,
                  persen: ancData.target
                    ? Math.round((ancData.k1 / ancData.target) * 100)
                    : 0
                },
                {
                  no: 2,
                  jenis: 'Kunjungan K4 (Lengkap)',
                  target: ancData.target || 0,
                  capaian: ancData.k4 || 0,
                  persen: ancData.target
                    ? Math.round((ancData.k4 / ancData.target) * 100)
                    : 0
                }
              ]
            : []
        };

      case 'rawat-inap':
        return {
          title: 'Laporan Rawat Inap',
          columns: [
            { key: 'tanggal', header: 'Tanggal' },
            { key: 'masuk', header: 'Pasien Masuk' },
            { key: 'keluar', header: 'Pasien Keluar' },
            { key: 'bed_terisi', header: 'Bed Terisi' },
            { key: 'bed_total', header: 'Total Bed' },
            { key: 'bor', header: 'BOR (%)' }
          ],
          tableData: Array.isArray(lintasData?.rawatInap)
            ? lintasData.rawatInap.slice(0, 30).map((r: any) => ({
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

      default:
        return { title: '', columns: [], tableData: [] };
    }
  }, [selectedReport, overviewData, klaster1Data, klaster2Data, lintasData]);

  const handleExport = useCallback(() => {
    if (tableData.length > 0 && columns.length > 0) {
      const filename = `laporan_${selectedReport}_${bulan}_${tahun}`;
      exportToExcel(tableData, filename, columns);
    }
  }, [tableData, columns, selectedReport, bulan, tahun]);

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
            <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4'>
              {REPORT_TYPES.map((report) => {
                const Icon = report.icon;
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
                      isSelected ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span className='text-sm font-medium'>{report.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {selectedReport && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  {selectedReportInfo?.description}
                </CardDescription>
              </div>
              <Button
                onClick={handleExport}
                disabled={tableData.length === 0}
                className='gap-2'
              >
                <IconDownload className='h-4 w-4' />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : tableData.length === 0 ? (
                <div className='text-muted-foreground py-12 text-center'>
                  <IconFileSpreadsheet className='mx-auto h-12 w-12 opacity-50' />
                  <p className='mt-2'>Tidak ada data untuk laporan ini</p>
                </div>
              ) : (
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
                      {tableData.map((row: any, index: number) => (
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
              )}

              {tableData.length > 0 && (
                <div className='text-muted-foreground mt-4 text-sm'>
                  Total: {tableData.length} data
                </div>
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
