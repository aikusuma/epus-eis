'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IconLoader2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'EIS Dinkes';
const DINKES_NAME = process.env.NEXT_PUBLIC_DINKES_NAME || 'Dinas Kesehatan';
const EMAIL_DOMAIN = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'dinkes.go.id';
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'admin@dinkes.go.id';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'admin123';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='relative grid min-h-screen lg:grid-cols-2'>
      {/* Left panel */}
      <div className='relative hidden overflow-hidden border-r bg-zinc-950 text-zinc-50 lg:flex lg:flex-col lg:p-10'>
        <div
          className='absolute inset-0 opacity-50'
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 25%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 25%), radial-gradient(circle at 60% 70%, rgba(255,255,255,0.06), transparent 30%)'
          }}
        />
        <div
          className='absolute inset-0 opacity-15'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        <DottedGlowBackground
          className='pointer-events-none absolute inset-0 opacity-55 mix-blend-screen'
          gap={12}
          radius={2}
          speedMin={0.35}
          speedMax={1.2}
          speedScale={1}
          backgroundOpacity={0}
          colorLightVar='--color-neutral-500'
          glowColorLightVar='--color-neutral-600'
          colorDarkVar='--color-neutral-500'
          glowColorDarkVar='--color-sky-800'
        />

        <div className='relative z-10 flex flex-1 items-center justify-center'>
          <div className='flex flex-col items-center space-y-2 text-center'>
            <h3 className='text-4xl font-semibold text-white'>
              Executive Information System
            </h3>
            <p className='max-w-sm text-sm leading-relaxed text-white/80'>
              Data e-Puskesmas teringegrasi dalam satu dashboard. Memudahkan
              Dinas Kesehatan bisa melihat tren real-time dalam satu layar.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className='flex h-full items-center justify-center p-6 lg:p-10'>
        <div className='w-full max-w-md space-y-6 text-center'>
          <div className='space-y-2'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm'>
              <Image
                src='/logo.png'
                alt={`${APP_NAME} logo`}
                width={40}
                height={40}
              />
            </div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Masuk ke {APP_NAME}
            </h1>
            <p className='text-muted-foreground text-sm'>
              Gunakan akun dinas untuk mengakses dashboard.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Autentikasi</CardTitle>
              <CardDescription>
                Masuk dengan kredensial internal Dinkes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className='text-destructive border-destructive/40 bg-destructive/10 mb-4 rounded-md border p-3 text-sm'>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4 text-left'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder={`nama@${EMAIL_DOMAIN}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='password'>Password</Label>
                  <Input
                    id='password'
                    type='password'
                    placeholder='••••••••'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading && (
                    <IconLoader2 className='mr-2 size-4 animate-spin' />
                  )}
                  Masuk
                </Button>
              </form>

              <div className='text-muted-foreground mt-4 space-y-2 text-xs'>
                <div>
                  Demo: <span className='font-medium'>{DEMO_EMAIL}</span> /{' '}
                  <span className='font-medium'>{DEMO_PASSWORD}</span>
                </div>
                <div className='text-[11px]'>
                  Hubungi admin {DINKES_NAME} jika lupa kredensial.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
