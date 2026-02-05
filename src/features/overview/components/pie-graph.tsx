'use client';

import * as React from 'react';
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

const chartData = [
  { gender: 'lakiLaki', pasien: 22345, fill: 'var(--primary)' },
  { gender: 'perempuan', pasien: 23333, fill: 'var(--primary-light)' }
];

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
  const totalPasien = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.pasien, 0);
  }, []);

  const perempuanPercent = ((chartData[1].pasien / totalPasien) * 100).toFixed(
    1
  );

  return (
    <Card className='@container/card'>
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
                          {totalPasien.toLocaleString('id-ID')}
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
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          <IconVenus className='h-4 w-4' />
          Perempuan: {perempuanPercent}%<span className='mx-2'>|</span>
          <IconMars className='h-4 w-4' />
          Laki-laki: {(100 - parseFloat(perempuanPercent)).toFixed(1)}%
        </div>
        <div className='text-muted-foreground leading-none'>Data bulan ini</div>
      </CardFooter>
    </Card>
  );
}
