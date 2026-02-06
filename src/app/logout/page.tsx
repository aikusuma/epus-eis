'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200); // hard cap
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          signal: controller.signal
        });
      } catch (e) {
        console.error('Logout failed', e);
      } finally {
        clearTimeout(timer);
        router.replace('/login');
        router.refresh();
      }
    };
    doLogout();
  }, [router]);

  return (
    <div className='text-muted-foreground flex min-h-screen items-center justify-center text-sm'>
      <div className='flex items-center gap-2'>
        <Loader2 className='size-4 animate-spin' />
        <span>Keluar dari sesi...</span>
      </div>
    </div>
  );
}
