'use client';

import React, { useState, useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconHospital,
  IconUsers,
  IconCalendar,
  IconFilter,
  IconArrowUpRight,
  IconActivity
} from '@tabler/icons-react';

export const KUNINGAN_PUSKESMAS_LIST = [
  'Puskesmas Darma',
  'Puskesmas Kadugede',
  'Puskesmas Nusaherang',
  'Puskesmas Ciniru',
  'Puskesmas Hantara',
  'Puskesmas Selajambe Kuningan',
  'Puskesmas Subang',
  'Puskesmas Cilebak',
  'Puskesmas Karangkencana',
  'Puskesmas Cibingbin',
  'Puskesmas Cibeureum',
  'Puskesmas Ciwaru',
  'Puskesmas Luragung',
  'Puskesmas Cimahi',
  'Puskesmas Cidahu Kuningan',
  'Puskesmas Kalimanggis',
  'Puskesmas Ciawigebang Kuningan',
  'Puskesmas Cihaur',
  'Puskesmas Cipicung',
  'Puskesmas Mekarwangi',
  'Puskesmas Maleber',
  'Puskesmas Garawangi',
  'Puskesmas Sindangagung',
  'Puskesmas Kuningan',
  'Puskesmas Windu Sengkahan',
  'Puskesmas Lamepayung',
  'Puskesmas Suka Mulya Kuningan',
  'Puskesmas Kramatmulya',
  'Puskesmas Jalaksana',
  'Puskesmas Japara',
  'Puskesmas Cilimus',
  'Puskesmas Linggarjati',
  'Puskesmas Manggari',
  'Puskesmas Cigandamekar',
  'Puskesmas Mandirancan',
  'Puskesmas Pancalang',
  'Puskesmas Pasawahan Kuningan'
];

const RS_LIST = [
  "RSUD '45 Kuningan",
  'RSUD Linggajati',
  'RS Sekar Kamulyan',
  'RS Juanda',
  'RS KMC',
  'RS Wijaya Kusumah',
  'RS Permata Kuningan'
];

const POLI_LIST = [
  'Poli Penyakit Dalam',
  'Poli Anak',
  'Poli Kandungan (Obgyn)',
  'Poli Bedah',
  'Poli Mata',
  'Poli Saraf',
  'Poli Jantung'
];

// Generate deterministic/consistent mock data simulating September 2026 data
const generateMockData = () => {
  const data = [];
  const baseDate = new Date('2026-09-01T00:00:00Z').getTime();

  for (let i = 0; i < 600; i++) {
    const randomOffset = Math.floor(((i * 7919) % 30) * 24 * 60 * 60 * 1000);
    const date = new Date(baseDate + randomOffset);
    const pkmIndex = (i * 13) % KUNINGAN_PUSKESMAS_LIST.length;
    const rsIndex = (i * 7) % RS_LIST.length;
    const poliIndex = (i * 11) % POLI_LIST.length;
    const jumlahPasien = ((i * 3) % 4) + 1; // 1 to 4 patients

    data.push({
      id: i + 1,
      tanggal: date.toISOString().split('T')[0],
      puskesmas: KUNINGAN_PUSKESMAS_LIST[pkmIndex],
      rumahSakit: RS_LIST[rsIndex],
      poli: POLI_LIST[poliIndex],
      jumlahPasien
    });
  }
  return data;
};

const rawData = generateMockData();

export default function MonitoringRujukanSection() {
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [selectedPuskesmas, setSelectedPuskesmas] = useState('Semua Puskesmas');

  const { filteredData, top5Cards, matrixData, pkmColumns, rsRows } = useMemo(() => {
    const filtered = rawData.filter((item) => {
      const isAfterStart = !startDate || item.tanggal >= startDate;
      const isBeforeEnd = !endDate || item.tanggal <= endDate;
      const isMatchPkm =
        selectedPuskesmas === 'Semua Puskesmas' || item.puskesmas === selectedPuskesmas;

      return isAfterStart && isBeforeEnd && isMatchPkm;
    });

    const cardMap: Record<string, { rs: string; poli: string; count: number }> = {};
    filtered.forEach((item) => {
      const key = `${item.rumahSakit} - ${item.poli}`;
      if (!cardMap[key]) {
        cardMap[key] = { rs: item.rumahSakit, poli: item.poli, count: 0 };
      }
      cardMap[key].count += item.jumlahPasien;
    });

    const sortedCards = Object.values(cardMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const matrix: Record<string, Record<string, number>> = {};
    const pkmSet = new Set<string>();
    const rsSet = new Set<string>();

    filtered.forEach((item) => {
      pkmSet.add(item.puskesmas);
      rsSet.add(item.rumahSakit);

      if (!matrix[item.rumahSakit]) {
        matrix[item.rumahSakit] = {};
      }
      if (!matrix[item.rumahSakit][item.puskesmas]) {
        matrix[item.rumahSakit][item.puskesmas] = 0;
      }
      matrix[item.rumahSakit][item.puskesmas] += item.jumlahPasien;
    });

    // If specific puskesmas is selected, show only that column, otherwise show columns present in data
    const cols =
      selectedPuskesmas !== 'Semua Puskesmas'
        ? [selectedPuskesmas]
        : Array.from(pkmSet).sort();

    const rows = Array.from(rsSet).sort();

    return {
      filteredData: filtered,
      top5Cards: sortedCards,
      matrixData: matrix,
      pkmColumns: cols,
      rsRows: rows
    };
  }, [startDate, endDate, selectedPuskesmas]);

  return (
    <div className='w-full max-w-full min-w-0 space-y-6 overflow-hidden'>
      {/* Filter Section */}
      <Card className='border-slate-200/70 shadow-xs'>
        <CardContent className='p-4 md:p-5'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end'>
            <div>
              <label className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider'>
                <IconCalendar className='h-4 w-4 text-teal-600' /> Tanggal Mulai
              </label>
              <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='border-input bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2'
              />
            </div>

            <div>
              <label className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider'>
                <IconCalendar className='h-4 w-4 text-teal-600' /> Tanggal Akhir
              </label>
              <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='border-input bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2'
              />
            </div>

            <div className='sm:col-span-2'>
              <label className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider'>
                <IconFilter className='h-4 w-4 text-teal-600' /> Filter Puskesmas
              </label>
              <select
                value={selectedPuskesmas}
                onChange={(e) => setSelectedPuskesmas(e.target.value)}
                className='border-input bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2'
              >
                <option value='Semua Puskesmas'>
                  Semua Puskesmas Kab. Kuningan ({KUNINGAN_PUSKESMAS_LIST.length} Puskesmas)
                </option>
                {KUNINGAN_PUSKESMAS_LIST.map((pkm) => (
                  <option key={pkm} value={pkm}>
                    {pkm}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Rujukan Cards */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-base font-bold'>Top 5 Rujukan Terbanyak</h3>
          <Badge variant='secondary' className='text-xs font-normal'>
            Berdasarkan RS & Poli
          </Badge>
        </div>

        {top5Cards.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='text-muted-foreground p-8 text-center text-sm'>
              Tidak ada data rujukan pada periode ini.
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full min-w-0'>
            {top5Cards.map((card, idx) => (
              <Card
                key={idx}
                className='group relative overflow-hidden transition-shadow hover:shadow-md'
              >
                <div className='absolute top-0 right-0 p-4 opacity-5 transition-all duration-300 group-hover:scale-110 group-hover:opacity-10'>
                  <IconHospital className='h-16 w-16 text-teal-600' />
                </div>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <span className='inline-flex h-7 w-7 items-center justify-center rounded-md bg-teal-500/10 text-xs font-bold text-teal-600'>
                      #{idx + 1}
                    </span>
                    <IconArrowUpRight className='text-muted-foreground/50 h-4 w-4' />
                  </div>
                  <CardTitle className='line-clamp-1 pt-1 text-sm font-bold' title={card.rs}>
                    {card.rs}
                  </CardTitle>
                  <p className='text-muted-foreground line-clamp-1 text-xs'>{card.poli}</p>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='flex items-end justify-between'>
                    <div>
                      <span className='text-2xl font-black text-teal-600'>{card.count}</span>
                      <span className='text-muted-foreground ml-1.5 text-xs font-medium'>
                        Pasien
                      </span>
                    </div>
                    <IconUsers className='text-muted-foreground/30 h-5 w-5' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cross-tab / Matrix: RS vs Puskesmas */}
      <Card className='border-slate-200/70 shadow-xs w-full max-w-full min-w-0 overflow-hidden'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base font-bold'>
            Distribusi Rujukan (RS vs Puskesmas)
          </CardTitle>
          <p className='text-muted-foreground text-xs'>
            Matriks penyebaran rujukan dari Puskesmas Kuningan ke Rumah Sakit tujuan
          </p>
        </CardHeader>
        <CardContent className='p-0 w-full min-w-0 overflow-hidden'>
          {rsRows.length === 0 ? (
            <div className='text-muted-foreground p-8 text-center text-sm'>
              Tidak ada sebaran data rujukan.
            </div>
          ) : (
            <div className='w-full max-w-full min-w-0 overflow-x-auto'>
              <table className='w-full border-collapse text-left text-sm whitespace-nowrap'>
                <thead>
                  <tr className='bg-muted/50 border-y text-xs'>
                    <th className='bg-muted/70 text-foreground sticky left-0 z-10 border-r px-4 py-3.5 font-bold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                      Rumah Sakit Rujukan
                    </th>
                    {pkmColumns.map((pkm) => (
                      <th
                        key={pkm}
                        className='text-muted-foreground border-r px-3.5 py-3.5 text-center font-semibold'
                        title={pkm}
                      >
                        {pkm.replace('Puskesmas ', 'PKM ')}
                      </th>
                    ))}
                    <th className='bg-teal-500/10 text-center font-bold text-teal-700 dark:text-teal-400 px-4 py-3.5'>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {rsRows.map((rs) => {
                    let totalRS = 0;
                    return (
                      <tr key={rs} className='hover:bg-muted/30 transition-colors'>
                        <td className='bg-card text-foreground sticky left-0 border-r px-4 py-3 font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                          {rs}
                        </td>
                        {pkmColumns.map((pkm) => {
                          const val = matrixData[rs]?.[pkm] || 0;
                          totalRS += val;
                          return (
                            <td key={pkm} className='border-r px-3 py-3 text-center'>
                              {val > 0 ? (
                                <span className='inline-flex min-w-[2rem] items-center justify-center rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400'>
                                  {val}
                                </span>
                              ) : (
                                <span className='text-muted-foreground/30'>-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className='bg-teal-500/5 px-4 py-3 text-center font-bold text-teal-700 dark:text-teal-400'>
                          {totalRS}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className='bg-muted/60 border-t font-bold'>
                    <td className='bg-muted/80 text-foreground sticky left-0 border-r px-4 py-3.5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                      Total Keseluruhan
                    </td>
                    {pkmColumns.map((pkm) => {
                      let totalPkm = 0;
                      rsRows.forEach((rs) => {
                        totalPkm += matrixData[rs]?.[pkm] || 0;
                      });
                      return (
                        <td key={pkm} className='border-r px-3 py-3.5 text-center text-xs font-bold'>
                          {totalPkm}
                        </td>
                      );
                    })}
                    <td className='bg-teal-500/15 text-center font-black text-teal-700 dark:text-teal-400 px-4 py-3.5'>
                      {filteredData.reduce((sum, item) => sum + item.jumlahPasien, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
