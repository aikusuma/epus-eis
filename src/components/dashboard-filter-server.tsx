// Server component wrapper for DashboardFilter
// Reads user context from cookie server-side to avoid client-side fetch delay

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  DashboardFilter,
  type FilterValues
} from '@/components/dashboard-filter';

interface DashboardFilterServerProps {
  onFilterChange?: (filters: FilterValues) => void;
  showJenisLayanan?: boolean;
}

export default async function DashboardFilterServer({
  onFilterChange,
  showJenisLayanan
}: DashboardFilterServerProps) {
  let userContext: {
    puskesmasId?: string | null;
    puskesmasName?: string | null;
    isLocked: boolean;
  } | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload?.puskesmasId) {
        // User is locked to a puskesmas - fetch name
        const puskesmas = await db.puskesmas.findUnique({
          where: { id: payload.puskesmasId },
          select: { namaPuskesmas: true }
        });

        userContext = {
          puskesmasId: payload.puskesmasId,
          puskesmasName: puskesmas?.namaPuskesmas || null,
          isLocked: true
        };
      }
    }
  } catch {
    // Ignore errors - will fall back to client-side fetch
  }

  return (
    <DashboardFilter
      onFilterChange={onFilterChange}
      showJenisLayanan={showJenisLayanan}
      serverUserContext={userContext}
    />
  );
}
