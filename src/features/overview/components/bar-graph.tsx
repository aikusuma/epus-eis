'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useOverviewData } from '@/hooks/use-eis-data';
import { useOverviewFilterParams } from '@/features/overview/context/overview-filter-context';

export const description = 'Grafik kunjungan pasien';

const chartConfig = {
  total: { label: 'Total Kunjungan', color: 'var(--primary)' },
  bpjs: { label: 'BPJS', color: 'var(--color-ispa, var(--primary))' },
  umum: {
    label: 'Umum',
    color: 'var(--color-hipertensi, var(--muted-foreground))'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const filters = useOverviewFilterParams();
  const { data, isLoading } = useOverviewData(filters);

  // Transform trend data for chart - total + breakdown
  const chartData = React.useMemo(() => {
    if (!data?.trend || data.trend.length === 0) return [];

    // Use trend data with bpjs/umum breakdown
    return data.trend.map((item: any) => ({
      bulan: item.bulan,
      total: item.kunjungan || 0,
      bpjs: item.bpjs || Math.round((item.kunjungan || 0) * 0.65),
      umum: item.umum || Math.round((item.kunjungan || 0) * 0.35)
    }));
  }, [data]);

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className='@container/card flex h-full w-full flex-col !pt-3'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
            <CardTitle>Kunjungan</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='flex-1 px-2 pt-4 sm:px-6 sm:pt-6'>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card flex h-full w-full flex-col !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Data Kunjungan</CardTitle>
          <CardDescription>
            Total kunjungan per bulan (BPJS vs Umum)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[360px] w-full'
        >
          <BarChart data={chartData} stackOffset='none'>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='bulan'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={<ChartTooltipContent className='w-[200px]' />}
            />
            <Legend />
            <Bar
              dataKey='bpjs'
              stackId='a'
              fill='var(--color-ispa, var(--primary))'
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey='umum'
              stackId='a'
              fill='var(--color-hipertensi, var(--muted-foreground))'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className='mt-auto border-t pt-4'>
          <Button variant='outline' size='sm' className='w-full' asChild>
            <Link href='/dashboard/laporan?report=kunjungan'>
              Lihat Lebih Lanjut →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
