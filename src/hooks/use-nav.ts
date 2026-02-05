'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/types';

/**
 * Hook to filter navigation items
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items (currently returns all items as no filtering is needed)
 */
export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => items, [items]);
}
