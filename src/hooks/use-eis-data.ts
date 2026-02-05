'use client';

import useSWR from 'swr';

// Fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

// Build URL with query params
function buildUrl(
  base: string,
  params: Record<string, string | number | undefined>
) {
  // Use relative URL for client-side
  const url = new URL(
    base,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'
  );
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

// SWR options with revalidation
const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3
};

// Types
export interface FilterParams {
  puskesmasId?: string;
  bulan?: number;
  tahun?: number;
  tanggal?: string;
  limit?: number;
  [key: string]: string | number | undefined;
}

// Klaster 1 Hook
export function useKlaster1Data(filters: FilterParams = {}) {
  // Default to 'all' puskesmas if not specified
  const defaultFilters = {
    puskesmasId: 'all',
    ...filters
  };
  const url = buildUrl('/api/eis/klaster1', defaultFilters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Klaster 2 Hook
export function useKlaster2Data(filters: FilterParams = {}) {
  const url = buildUrl('/api/eis/klaster2', filters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Klaster 3 Hook
export function useKlaster3Data(filters: FilterParams = {}) {
  const url = buildUrl('/api/eis/klaster3', filters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Klaster 4 Hook
export function useKlaster4Data(filters: FilterParams = {}) {
  const url = buildUrl('/api/eis/klaster4', filters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Lintas Klaster Hook
export function useLintasKlasterData(filters: FilterParams = {}) {
  // Default to 'all' puskesmas if not specified
  const defaultFilters = {
    puskesmasId: 'all',
    ...filters
  };
  const url = buildUrl('/api/eis/lintas-klaster', defaultFilters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Monitoring Hook
export function useMonitoringData(filters: FilterParams = {}) {
  const url = buildUrl('/api/eis/monitoring', filters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Puskesmas Hook
export function usePuskesmasData() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/eis/puskesmas',
    fetcher,
    {
      ...swrOptions,
      dedupingInterval: 3600000 // 1 hour - puskesmas data rarely changes
    }
  );

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}

// Overview Hook
export function useOverviewData(filters: FilterParams = {}) {
  // Default to 'all' puskesmas if not specified
  const defaultFilters = {
    puskesmasId: 'all',
    ...filters
  };
  const url = buildUrl('/api/eis/overview', defaultFilters);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate
  };
}
