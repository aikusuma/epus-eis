'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  IconVirus,
  IconHeartbeat,
  IconTemperature,
  IconLungs,
  IconDroplet
} from '@tabler/icons-react';
import { useOverviewData } from '@/hooks/use-eis-data';
import { useOverviewFilterParams } from '@/features/overview/context/overview-filter-context';

type IconComponent = typeof IconVirus;

const iconMap: Record<string, IconComponent> = {
  J: IconLungs, // Respiratory
  I: IconHeartbeat, // Cardiovascular
  E: IconDroplet, // Endocrine
  K: IconVirus, // Digestive
  R: IconTemperature // Symptoms
};

const kategoriMap: Record<string, string> = {
  J: 'menular',
  I: 'PTM',
  E: 'PTM',
  K: 'umum',
  R: 'umum'
};

function getIconForCode(code: string): IconComponent {
  const firstChar = code?.charAt(0) || '';
  return iconMap[firstChar] || IconVirus;
}

function getKategoriForCode(code: string) {
  const firstChar = code?.charAt(0) || '';
  return kategoriMap[firstChar] || 'umum';
}

interface PenyakitItem {
  code: string;
  name: string;
  icon: IconComponent;
  count: number;
  trend: string;
  percent: string;
  kategori: string;
}

export function RecentSales() {
  const filters = useOverviewFilterParams();
  const { data, isLoading } = useOverviewData(filters);

  const topPenyakit: PenyakitItem[] = useMemo(() => {
    if (!data?.topPenyakit) return [];

    return data.topPenyakit.slice(0, 5).map((p: any) => ({
      code: p.icd10Code,
      name: p.nama || p.icd10Code,
      icon: getIconForCode(p.icd10Code),
      count: p.jumlah,
      trend: 'stable',
      percent: '+0%',
      kategori: getKategoriForCode(p.icd10Code)
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className='flex h-full w-full flex-col'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>Top 5 Penyakit</CardTitle>
          <CardDescription className='text-xs'>Loading...</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pt-0'>
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center gap-2'>
                <Skeleton className='h-7 w-7 rounded-full' />
                <div className='flex-1 space-y-1'>
                  <Skeleton className='h-3 w-32' />
                  <Skeleton className='h-2 w-16' />
                </div>
                <Skeleton className='h-5 w-16' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className='flex h-full w-full flex-col'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Top 5 Penyakit</CardTitle>
        <CardDescription className='text-xs'>
          Berdasarkan jumlah kunjungan bulan ini
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col pt-0'>
        <div className='space-y-3'>
          {topPenyakit.map((penyakit, index) => {
            const Icon = penyakit.icon;
            return (
              <div
                key={index}
                className='grid gap-1 border-b pb-3 last:border-b-0 last:pb-0'
              >
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full'>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-base leading-tight font-semibold'>
                      {penyakit.name}
                    </p>
                    <p className='text-muted-foreground text-xs tracking-widest uppercase'>
                      {penyakit.code}
                    </p>
                  </div>
                  <div className='text-right'>
                    <span className='text-xl leading-tight font-bold tabular-nums'>
                      {(penyakit.count || 0).toLocaleString('id-ID')}
                    </span>
                    <div className='text-muted-foreground text-[11px]'>
                      {penyakit.percent}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className='mt-auto border-t pt-4'>
          <Button variant='outline' size='sm' className='w-full' asChild>
            <Link href='/dashboard/laporan?report=penyakit'>
              Lihat Lebih Lanjut →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
