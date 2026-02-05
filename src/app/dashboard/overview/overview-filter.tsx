'use client';

import { useCallback } from 'react';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import { useOverviewFilters } from '@/features/overview/context/overview-filter-context';

export default function OverviewFilter() {
  const { setFilters } = useOverviewFilters();

  const handleFilterChange = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters);
      console.log('Overview Filters changed:', newFilters);
    },
    [setFilters]
  );

  return <DashboardFilter onFilterChange={handleFilterChange} />;
}
