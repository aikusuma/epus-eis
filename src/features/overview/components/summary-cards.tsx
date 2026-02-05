'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconStethoscope,
  IconBuildingHospital,
  IconVirus
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOverviewData } from '@/hooks/use-eis-data';
import { useOverviewFilterParams } from '@/features/overview/context/overview-filter-context';

interface SummaryCardsProps {
  filters?: {
    puskesmasId?: string;
    bulan?: number;
    tahun?: number;
  };
}

export function SummaryCards({ filters: propFilters }: SummaryCardsProps) {
  const contextFilters = useOverviewFilterParams();
  const filters = propFilters || contextFilters;
  const { data, isLoading } = useOverviewData(filters);

  const summaryData = useMemo(() => {
    if (!data) {
      return {
        totalKunjungan: 0,
        pertumbuhanPersen: 0,
        kasusIspa: 0,
        kasusIspaTrend: 0,
        kasusHipertensi: 0,
        kasusHipertensiTrend: 0,
        puskesmasAktif: 0
      };
    }

    const summary = data.summary || {};

    // Find ISPA (J06 codes) and Hipertensi (I10) from top penyakit
    const topPenyakit = data.topPenyakit || [];
    const ispa = topPenyakit.find(
      (p: any) =>
        p.icd10Code?.startsWith('J06') || p.icd10Code?.startsWith('J00')
    );
    const hipertensi = topPenyakit.find((p: any) =>
      p.icd10Code?.startsWith('I10')
    );

    return {
      totalKunjungan: summary.totalKunjungan || 0,
      pertumbuhanPersen: summary.pertumbuhanPersen || 0,
      kasusIspa: ispa?.jumlah || 0,
      kasusIspaTrend: -5.2, // Would come from comparison data
      kasusHipertensi: hipertensi?.jumlah || 0,
      kasusHipertensiTrend: 8.3, // Would come from comparison data
      puskesmasAktif: summary.totalPuskesmas || 0
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 items-stretch gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='@container/card flex h-full flex-col'>
            <CardHeader>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='mt-2 h-8 w-24' />
            </CardHeader>
            <CardFooter className='mt-auto'>
              <Skeleton className='h-4 w-40' />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 items-stretch gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <Card className='@container/card flex h-full flex-col'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconUsers className='size-4' />
            Total Kunjungan
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {(summaryData.totalKunjungan || 0).toLocaleString('id-ID')}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              {(summaryData.pertumbuhanPersen || 0) >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {(summaryData.pertumbuhanPersen || 0) >= 0 ? '+' : ''}
              {(summaryData.pertumbuhanPersen || 0).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='mt-auto flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            {(summaryData.pertumbuhanPersen || 0) >= 0 ? 'Naik' : 'Turun'} dari
            bulan lalu{' '}
            {(summaryData.pertumbuhanPersen || 0) >= 0 ? (
              <IconTrendingUp className='size-4' />
            ) : (
              <IconTrendingDown className='size-4' />
            )}
          </div>
          <div className='text-muted-foreground'>Periode: Bulan ini</div>
        </CardFooter>
      </Card>

      <Card className='@container/card flex h-full flex-col'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconVirus className='size-4' />
            Kasus ISPA
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {(summaryData.kasusIspa || 0).toLocaleString('id-ID')}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              {(summaryData.kasusIspaTrend || 0) < 0 ? (
                <IconTrendingDown />
              ) : (
                <IconTrendingUp />
              )}
              {(summaryData.kasusIspaTrend || 0) >= 0 ? '+' : ''}
              {(summaryData.kasusIspaTrend || 0).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='mt-auto flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            {(summaryData.kasusIspaTrend || 0) < 0 ? 'Turun' : 'Naik'} dari
            bulan lalu{' '}
            {(summaryData.kasusIspaTrend || 0) < 0 ? (
              <IconTrendingDown className='size-4' />
            ) : (
              <IconTrendingUp className='size-4' />
            )}
          </div>
          <div className='text-muted-foreground'>Penyakit terbanyak #1</div>
        </CardFooter>
      </Card>

      <Card className='@container/card flex h-full flex-col'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconStethoscope className='size-4' />
            Kasus Hipertensi
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {(summaryData.kasusHipertensi || 0).toLocaleString('id-ID')}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              {(summaryData.kasusHipertensiTrend || 0) > 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {(summaryData.kasusHipertensiTrend || 0) >= 0 ? '+' : ''}
              {(summaryData.kasusHipertensiTrend || 0).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='mt-auto flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Perlu perhatian{' '}
            {(summaryData.kasusHipertensiTrend || 0) > 0 ? (
              <IconTrendingUp className='size-4' />
            ) : (
              <IconTrendingDown className='size-4' />
            )}
          </div>
          <div className='text-muted-foreground'>PTM prioritas tinggi</div>
        </CardFooter>
      </Card>

      <Card className='@container/card flex h-full flex-col'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconBuildingHospital className='size-4' />
            Puskesmas Aktif
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {summaryData.puskesmasAktif}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconTrendingUp />
              100%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='mt-auto flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Semua puskesmas aktif <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>
            {summaryData.puskesmasAktif} puskesmas di Kab. Brebes
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
