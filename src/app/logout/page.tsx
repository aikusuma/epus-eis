'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'logging_out' | 'done'>('logging_out');

  useEffect(() => {
    let cancelled = false;

    const doLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error('Logout failed', e);
      }

      if (!cancelled) {
        setStatus('done');
        // Clear any client-side state
        sessionStorage.clear();
        // Redirect to login
        router.replace('/login');
      }
    };

    doLogout();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className='text-muted-foreground flex min-h-screen items-center justify-center text-sm'>
      <div className='flex items-center gap-2'>
        <Loader2 className='size-4 animate-spin' />
        <span>
          {status === 'done' ? 'Mengalihkan...' : 'Keluar dari sesi...'}
        </span>
      </div>
    </div>
  );
}
