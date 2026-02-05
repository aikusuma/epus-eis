'use client';

import { useCallback, useState } from 'react';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';

export default function OverviewFilter() {
  const [filters, setFilters] = useState<FilterValues | null>(null);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    console.log('Overview Filters changed:', newFilters);
  }, []);

  return <DashboardFilter onFilterChange={handleFilterChange} />;
}
