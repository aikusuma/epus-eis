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

export const description = 'Grafik kunjungan pasien harian';

// Data kunjungan harian (contoh bulan ini)
const chartData = [
  { date: '2025-01-01', rawatJalan: 342, rawatInap: 12 },
  { date: '2025-01-02', rawatJalan: 389, rawatInap: 15 },
  { date: '2025-01-03', rawatJalan: 412, rawatInap: 18 },
  { date: '2025-01-04', rawatJalan: 156, rawatInap: 8 },
  { date: '2025-01-05', rawatJalan: 123, rawatInap: 5 },
  { date: '2025-01-06', rawatJalan: 445, rawatInap: 21 },
  { date: '2025-01-07', rawatJalan: 478, rawatInap: 19 },
  { date: '2025-01-08', rawatJalan: 423, rawatInap: 16 },
  { date: '2025-01-09', rawatJalan: 398, rawatInap: 14 },
  { date: '2025-01-10', rawatJalan: 456, rawatInap: 22 },
  { date: '2025-01-11', rawatJalan: 134, rawatInap: 7 },
  { date: '2025-01-12', rawatJalan: 112, rawatInap: 4 },
  { date: '2025-01-13', rawatJalan: 489, rawatInap: 23 },
  { date: '2025-01-14', rawatJalan: 512, rawatInap: 25 },
  { date: '2025-01-15', rawatJalan: 467, rawatInap: 20 },
  { date: '2025-01-16', rawatJalan: 445, rawatInap: 18 },
  { date: '2025-01-17', rawatJalan: 398, rawatInap: 15 },
  { date: '2025-01-18', rawatJalan: 145, rawatInap: 6 },
  { date: '2025-01-19', rawatJalan: 98, rawatInap: 3 },
  { date: '2025-01-20', rawatJalan: 523, rawatInap: 24 },
  { date: '2025-01-21', rawatJalan: 489, rawatInap: 21 },
  { date: '2025-01-22', rawatJalan: 456, rawatInap: 19 },
  { date: '2025-01-23', rawatJalan: 478, rawatInap: 22 },
  { date: '2025-01-24', rawatJalan: 445, rawatInap: 17 },
  { date: '2025-01-25', rawatJalan: 167, rawatInap: 8 },
  { date: '2025-01-26', rawatJalan: 134, rawatInap: 5 },
  { date: '2025-01-27', rawatJalan: 501, rawatInap: 23 },
  { date: '2025-01-28', rawatJalan: 534, rawatInap: 26 },
  { date: '2025-01-29', rawatJalan: 489, rawatInap: 21 },
  { date: '2025-01-30', rawatJalan: 467, rawatInap: 19 },
  { date: '2025-01-31', rawatJalan: 423, rawatInap: 16 }
];

const chartConfig = {
  views: {
    label: 'Kunjungan'
  },
  rawatJalan: {
    label: 'Rawat Jalan',
    color: 'var(--primary)'
  },
  rawatInap: {
    label: 'Rawat Inap',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('rawatJalan');

  const total = React.useMemo(
    () => ({
      rawatJalan: chartData.reduce((acc, curr) => acc + curr.rawatJalan, 0),
      rawatInap: chartData.reduce((acc, curr) => acc + curr.rawatInap, 0)
    }),
    []
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Kunjungan Harian</CardTitle>
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
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short'
                });
              }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[180px]'
                  nameKey='views'
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
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
