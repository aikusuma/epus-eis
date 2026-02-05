'use client';

import * as React from 'react';
import Link from 'next/link';
import { IconMars, IconVenus } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

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
  pasien: {
    label: 'Pasien'
  },
  lakiLaki: {
    label: 'Laki-laki',
    color: 'var(--primary)'
  },
  perempuan: {
    label: 'Perempuan',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  const filters = useOverviewFilterParams();
  const { data, isLoading } = useOverviewData(filters);

  const chartData = React.useMemo(() => {
    // Calculate gender totals from distribusiUsia
    if (!data?.distribusiUsia || data.distribusiUsia.length === 0) {
      return [
        { gender: 'lakiLaki', pasien: 0, fill: 'var(--primary)' },
        { gender: 'perempuan', pasien: 0, fill: 'var(--primary-light)' }
      ];
    }

    const totalLaki = data.distribusiUsia.reduce(
      (acc: number, curr: any) => acc + (curr.laki || 0),
      0
    );
    const totalPerempuan = data.distribusiUsia.reduce(
      (acc: number, curr: any) => acc + (curr.perempuan || 0),
      0
    );

    return [
      { gender: 'lakiLaki', pasien: totalLaki, fill: 'var(--primary)' },
      {
        gender: 'perempuan',
        pasien: totalPerempuan,
        fill: 'var(--primary-light)'
      }
    ];
  }, [data]);

  const totalPasien = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.pasien, 0);
  }, [chartData]);

  const perempuanPercent =
    totalPasien > 0
      ? ((chartData[1].pasien / totalPasien) * 100).toFixed(1)
      : '0';

  if (isLoading) {
    return (
      <Card className='@container/card flex h-full w-full flex-col'>
        <CardHeader>
          <CardTitle>Distribusi Gender</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-1 items-center justify-center px-2 pt-4 sm:px-6 sm:pt-6'>
          <Skeleton className='h-[250px] w-[250px] rounded-full' />
        </CardContent>
        <CardFooter className='mt-auto flex-col gap-2 text-sm'>
          <Skeleton className='h-4 w-48' />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='@container/card flex h-full w-full flex-col'>
      <CardHeader>
        <CardTitle>Distribusi Gender</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Perbandingan jumlah pasien laki-laki dan perempuan bulan ini
          </span>
          <span className='@[540px]/card:hidden'>Pasien per gender</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {['lakiLaki', 'perempuan'].map((gender, index) => (
                <linearGradient
                  key={gender}
                  id={`fill${gender}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--primary)'
                    stopOpacity={1 - index * 0.3}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary)'
                    stopOpacity={0.8 - index * 0.3}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.gender})`
              }))}
              dataKey='pasien'
              nameKey='gender'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {(totalPasien || 0).toLocaleString('id-ID')}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Pasien
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='mt-auto flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          <IconVenus className='h-4 w-4' />
          Perempuan: {perempuanPercent}%<span className='mx-2'>|</span>
          <IconMars className='h-4 w-4' />
          Laki-laki: {(100 - parseFloat(perempuanPercent)).toFixed(1)}%
        </div>
        <div className='text-muted-foreground leading-none'>Data bulan ini</div>
        <div className='mt-2 w-full border-t pt-4'>
          <Button variant='outline' size='sm' className='w-full' asChild>
            <Link href='/dashboard/laporan?report=kunjungan'>
              Lihat Lebih Lanjut →
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
