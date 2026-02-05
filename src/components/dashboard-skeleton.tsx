'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton for dashboard cards
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='mt-2 h-8 w-16' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-5 w-20' />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for charts
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='mt-1 h-4 w-32' />
      </CardHeader>
      <CardContent>
        <Skeleton className={`h-[${height}px] w-full`} style={{ height }} />
      </CardContent>
    </Card>
  );
}

// Full loading skeleton for dashboard tabs
export function DashboardSkeleton({
  cardCount = 4,
  chartCount = 2
}: {
  cardCount?: number;
  chartCount?: number;
}) {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-4'>
        {[...Array(cardCount)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className={`grid gap-4 md:grid-cols-${chartCount}`}>
        {[...Array(chartCount)].map((_, i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Error display component
export function ErrorDisplay({
  message = 'Terjadi kesalahan saat memuat data'
}: {
  message?: string;
}) {
  return (
    <div className='flex items-center justify-center p-8 text-center'>
      <div className='space-y-2'>
        <p className='text-destructive font-medium'>Error</p>
        <p className='text-muted-foreground text-sm'>{message}</p>
      </div>
    </div>
  );
}

// Empty state component
export function EmptyState({
  message = 'Tidak ada data tersedia'
}: {
  message?: string;
}) {
  return (
    <div className='flex items-center justify-center p-8 text-center'>
      <p className='text-muted-foreground'>{message}</p>
    </div>
  );
}
