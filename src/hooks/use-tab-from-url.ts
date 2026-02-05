'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, Suspense } from 'react';

export function useTabFromUrl(defaultTab: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams?.get('tab') || defaultTab;

  const setTab = useCallback(
    (newTab: string) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('tab', newTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return { currentTab, setTab };
}
