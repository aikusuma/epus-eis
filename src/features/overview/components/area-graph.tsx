'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useOverviewData } from '@/hooks/use-eis-data';
import { useOverviewFilterParams } from '@/features/overview/context/overview-filter-context';

const chartConfig = {
  jumlah: {
    label: 'Jumlah Kasus',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  const filters = useOverviewFilterParams();
  const { data, isLoading } = useOverviewData(filters);

  const chartData = React.useMemo(() => {
    if (!data?.topPenyakit || data.topPenyakit.length === 0) {
      return [];
    }
    return data.topPenyakit
      .slice(0, 8)
      .map((p: any) => ({ nama: p.nama, jumlah: p.jumlah }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className='@container/card flex h-full w-full flex-col'>
        <CardHeader>
          <CardTitle>Tren Penyakit Utama</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 px-2 pt-4 sm:px-6 sm:pt-6'>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
        <CardFooter className='mt-auto'>
          <Skeleton className='h-8 w-48' />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='@container/card flex h-full w-full flex-col'>
      <CardHeader>
        <CardTitle>Tren Penyakit Utama</CardTitle>
        <CardDescription>8 penyakit terbanyak bulan ini</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[360px] w-full'
        >
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ left: 12, right: 12 }}
          >
            <defs>
              <linearGradient id='fillDisease' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.9}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.25}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis type='number' />
            <YAxis
              dataKey='nama'
              type='category'
              width={160}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.08 }}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey='jumlah' fill='url(#fillDisease)' radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Top 8 based on data bulan ini
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Periode: bulan berjalan
            </div>
          </div>
        </div>
        <div className='mt-2 w-full border-t pt-4'>
          <Button variant='outline' size='sm' className='w-full' asChild>
            <Link href='/dashboard/laporan?report=penyakit'>
              Lihat Lebih Lanjut →
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
