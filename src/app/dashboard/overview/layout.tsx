'use client';

import PageContainer from '@/components/layout/page-container';
import React from 'react';
import OverviewFilter from './overview-filter';
import { SummaryCards } from '@/features/overview/components/summary-cards';
import { OverviewFilterProvider } from '@/features/overview/context/overview-filter-context';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <OverviewFilterProvider>
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <OverviewFilter />

          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Dashboard EIS Dinkes Brebes
            </h2>
          </div>

          <SummaryCards />

          <div className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <div className='col-span-4 flex'>{bar_stats}</div>
            <div className='col-span-4 flex md:col-span-3'>
              {/* Top 10 Penyakit */}
              {sales}
            </div>
            <div className='col-span-4 flex'>{area_stats}</div>
            <div className='col-span-4 flex md:col-span-3'>{pie_stats}</div>
          </div>
        </div>
      </PageContainer>
    </OverviewFilterProvider>
  );
}
