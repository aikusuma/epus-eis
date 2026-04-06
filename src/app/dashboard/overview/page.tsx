// Server component: Fetch user context and pass to client layout
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import OverViewLayout from './layout';

export default async function OverviewPage({
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
    // Ignore errors
  }

  return (
    <OverViewLayout
      serverUserContext={userContext}
      {...{ sales, pie_stats, bar_stats, area_stats }}
    />
  );
}
