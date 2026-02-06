'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      // fire-and-forget, don't block navigation
      fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(
        (e) => console.error('Logout failed', e)
      );
      router.replace('/login');
      router.refresh();
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
