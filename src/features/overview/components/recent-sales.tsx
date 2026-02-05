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
              <div key={index} className='flex items-center gap-2'>
                <div className='bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-full'>
                  <Icon className='h-3.5 w-3.5' />
                </div>
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <p className='truncate text-xs leading-none font-medium'>
                    {penyakit.name}
                  </p>
                  <p className='text-muted-foreground text-[10px]'>
                    {penyakit.code}
                  </p>
                </div>
                <div className='flex flex-col items-end gap-0.5'>
                  <span className='text-sm font-semibold tabular-nums'>
                    {(penyakit.count || 0).toLocaleString('id-ID')}
                  </span>
                  <Badge
                    variant={
                      penyakit.trend === 'up'
                        ? 'destructive'
                        : penyakit.trend === 'down'
                          ? 'secondary'
                          : 'outline'
                    }
                    className='px-1 py-0 text-[10px]'
                  >
                    {penyakit.percent}
                  </Badge>
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
