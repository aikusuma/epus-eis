'use client';

import { useCallback } from 'react';
import { DashboardFilter, FilterValues } from '@/components/dashboard-filter';
import { useOverviewFilters } from '@/features/overview/context/overview-filter-context';

interface OverviewFilterProps {
  serverUserContext?: {
    puskesmasId?: string | null;
    puskesmasName?: string | null;
    isLocked: boolean;
  } | null;
}

export default function OverviewFilter({
  serverUserContext
}: OverviewFilterProps) {
  const { setFilters } = useOverviewFilters();

  const handleFilterChange = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  return (
    <DashboardFilter
      onFilterChange={handleFilterChange}
      serverUserContext={serverUserContext}
    />
  );
}
