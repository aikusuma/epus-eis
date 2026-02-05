'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FilterValues } from '@/components/dashboard-filter';

interface OverviewFilterContextType {
  filters: FilterValues | null;
  setFilters: (filters: FilterValues) => void;
}

const OverviewFilterContext = createContext<OverviewFilterContextType | null>(
  null
);

export function OverviewFilterProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [filters, setFiltersState] = useState<FilterValues | null>(null);

  const setFilters = useCallback((newFilters: FilterValues) => {
    setFiltersState(newFilters);
  }, []);

  return (
    <OverviewFilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </OverviewFilterContext.Provider>
  );
}

export function useOverviewFilters() {
  const context = useContext(OverviewFilterContext);
  if (!context) {
    throw new Error(
      'useOverviewFilters must be used within OverviewFilterProvider'
    );
  }
  return context;
}

// Helper hook that returns filters in the format expected by useOverviewData
export function useOverviewFilterParams() {
  const { filters } = useOverviewFilters();

  if (!filters) {
    return undefined;
  }

  return {
    puskesmasId: filters.puskesmasId || 'all',
    bulan: filters.dateRange?.from?.getMonth()
      ? filters.dateRange.from.getMonth() + 1
      : undefined,
    tahun: filters.dateRange?.from?.getFullYear() || undefined
  };
}
