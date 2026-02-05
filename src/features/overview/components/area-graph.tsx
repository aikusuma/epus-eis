'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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

// Tren kunjungan 12 bulan terakhir
const chartData = [
  { month: 'Feb 24', ispa: 7234, hipertensi: 5123 },
  { month: 'Mar 24', ispa: 7856, hipertensi: 5456 },
  { month: 'Apr 24', ispa: 7123, hipertensi: 5678 },
  { month: 'Mei 24', ispa: 6789, hipertensi: 5890 },
  { month: 'Jun 24', ispa: 6234, hipertensi: 6012 },
  { month: 'Jul 24', ispa: 7567, hipertensi: 6234 },
  { month: 'Agu 24', ispa: 8123, hipertensi: 6345 },
  { month: 'Sep 24', ispa: 8456, hipertensi: 6234 },
  { month: 'Okt 24', ispa: 8789, hipertensi: 6456 },
  { month: 'Nov 24', ispa: 8345, hipertensi: 6567 },
  { month: 'Des 24', ispa: 7890, hipertensi: 6345 },
  { month: 'Jan 25', ispa: 8234, hipertensi: 6512 }
];

const chartConfig = {
  kasus: {
    label: 'Kasus'
  },
  ispa: {
    label: 'ISPA',
    color: 'var(--primary)'
  },
  hipertensi: {
    label: 'Hipertensi',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Tren Penyakit Utama</CardTitle>
        <CardDescription>
          Perbandingan kasus ISPA dan Hipertensi 12 bulan terakhir
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillIspa' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-ispa)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-ispa)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillHipertensi' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-hipertensi)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-hipertensi)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='hipertensi'
              type='natural'
              fill='url(#fillHipertensi)'
              stroke='var(--color-hipertensi)'
              stackId='a'
            />
            <Area
              dataKey='ispa'
              type='natural'
              fill='url(#fillIspa)'
              stroke='var(--color-ispa)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Hipertensi naik 8.3% bulan ini{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Feb 2024 - Jan 2025
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
