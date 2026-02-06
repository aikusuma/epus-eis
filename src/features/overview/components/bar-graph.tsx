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
import { CountUp } from '@/components/ui/count-up';

export const description = 'Grafik kunjungan pasien';

const chartConfig = {
  total: { label: 'Total Kunjungan', color: 'url(#fillTotal)' },
  bpjs: { label: 'BPJS', color: 'url(#fillBpjs)' },
  umum: { label: 'Umum', color: 'url(#fillUmum)' }
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

  const [activeTab, setActiveTab] = React.useState<'bpjs' | 'umum'>('bpjs');

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
      <CardHeader className='@container/card-header flex auto-rows-min grid-rows-[auto_auto] flex-col items-stretch gap-1.5 space-y-0 border-b !p-0 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] sm:flex-row [.border-b]:pb-6'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Data Kunjungan</CardTitle>
          <CardDescription>
            Total kunjungan per bulan (BPJS vs Umum)
          </CardDescription>
        </div>
        <div className='flex'>
          {(['bpjs', 'umum'] as const).map((tab) => (
            <button
              key={tab}
              data-active={activeTab === tab}
              className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
              onClick={() => setActiveTab(tab)}
            >
              <span className='text-muted-foreground text-xs'>
                {chartConfig[tab].label}
              </span>
              <span className='text-lg leading-none font-bold sm:text-3xl'>
                <CountUp
                  value={chartData.reduce(
                    (acc, curr) => acc + (curr[tab] || 0),
                    0
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[360px] w-full'
        >
          <BarChart data={chartData} stackOffset='none'>
            <defs>
              <linearGradient id='fillBpjs' x1='0' y1='0' x2='0' y2='1'>
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
              <linearGradient id='fillUmum' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--muted-foreground)'
                  stopOpacity={0.6}
                />
                <stop
                  offset='100%'
                  stopColor='var(--muted-foreground)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
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
              dataKey={activeTab}
              stackId='a'
              fill={`url(#fill${activeTab === 'bpjs' ? 'Bpjs' : 'Umum'})`}
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey={activeTab === 'bpjs' ? 'umum' : 'bpjs'}
              stackId='a'
              fill='rgba(148,163,184,0.3)'
              radius={[6, 6, 0, 0]}
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
