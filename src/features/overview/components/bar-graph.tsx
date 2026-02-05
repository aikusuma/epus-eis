'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
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
import { useOverviewData } from '@/hooks/use-eis-data';

export const description = 'Grafik kunjungan pasien';

const chartConfig = {
  views: {
    label: 'Kunjungan'
  },
  rawatJalan: {
    label: 'BPJS',
    color: 'var(--primary)'
  },
  rawatInap: {
    label: 'Umum',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const { data, isLoading } = useOverviewData();

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('rawatJalan');

  // Transform trend data for chart - use BPJS/Umum as proxy for rawat jalan/inap
  const chartData = React.useMemo(() => {
    if (!data?.trend || data.trend.length === 0) return [];

    // Use trend data with bpjs/umum breakdown
    return data.trend.map((item: any) => ({
      date: item.bulan,
      rawatJalan: item.bpjs || 0,
      rawatInap: item.umum || 0
    }));
  }, [data]);

  const total = React.useMemo(
    () => ({
      rawatJalan: chartData.reduce(
        (acc: number, curr: any) => acc + (curr.rawatJalan || 0),
        0
      ),
      rawatInap: chartData.reduce(
        (acc: number, curr: any) => acc + (curr.rawatInap || 0),
        0
      )
    }),
    [chartData]
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className='@container/card !pt-3'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
            <CardTitle>Kunjungan</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Data Kunjungan</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              Total kunjungan bulan ini
            </span>
            <span className='@[540px]/card:hidden'>Bulan ini</span>
          </CardDescription>
        </div>
        <div className='flex'>
          {(['rawatJalan', 'rawatInap'] as const).map((key) => {
            const chart = key;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                onClick={() => setActiveChart(chart)}
              >
                <span className='text-muted-foreground text-xs'>
                  {chartConfig[chart].label}
                </span>
                <span className='text-lg leading-none font-bold sm:text-3xl'>
                  {total[key]?.toLocaleString('id-ID')}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='nama'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                if (typeof value === 'string' && value.length > 10) {
                  return value.substring(0, 10) + '...';
                }
                return value;
              }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[180px]'
                  nameKey='views'
                  labelFormatter={(value) => value}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillBar)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
