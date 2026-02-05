'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconLoader2, IconBuildingHospital } from '@tabler/icons-react';

// Branding from environment variables
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

      // Redirect to dashboard
      router.push('/dashboard');
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      {/* Left Side - Form */}
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
              <div className='flex flex-col items-center gap-2 text-center'>
                <div className='bg-primary text-primary-foreground mb-2 flex size-12 items-center justify-center rounded-xl'>
                  <IconBuildingHospital className='size-6' />
                </div>
                <h1 className='text-2xl font-bold'>{APP_NAME}</h1>
                <p className='text-muted-foreground text-sm text-balance'>
                  Masukkan email untuk mengakses Executive Information System
                </p>
              </div>

              {error && (
                <div className='text-destructive bg-destructive/10 rounded-md p-3 text-center text-sm'>
                  {error}
                </div>
              )}

              <div className='grid gap-6'>
                <div className='grid gap-3'>
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
                <div className='grid gap-3'>
                  <div className='flex items-center'>
                    <Label htmlFor='password'>Password</Label>
                  </div>
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
              </div>
              <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
                {DINKES_NAME}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Animated Background */}
      <div className='bg-primary relative hidden overflow-hidden lg:block'>
        {/* Animated gradient background */}
        <div className='from-primary via-primary to-primary/80 absolute inset-0 bg-gradient-to-br' />

        {/* Animated circles */}
        <div className='absolute inset-0'>
          <div className='animate-blob absolute -top-20 -left-20 size-72 rounded-full bg-white/10 mix-blend-overlay blur-xl' />
          <div className='animate-blob animation-delay-2000 absolute top-1/3 -right-20 size-72 rounded-full bg-white/10 mix-blend-overlay blur-xl' />
          <div className='animate-blob animation-delay-4000 absolute -bottom-20 left-1/3 size-72 rounded-full bg-white/10 mix-blend-overlay blur-xl' />
        </div>

        {/* Grid pattern overlay */}
        <div
          className='absolute inset-0 opacity-20'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        {/* Content */}
        <div className='absolute inset-0 flex flex-col items-center justify-center p-10'>
          <div className='mb-8 flex size-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
            <IconBuildingHospital className='size-12 text-white' />
          </div>
          <h2 className='mb-4 text-center text-3xl font-bold text-white'>
            Executive Information System
          </h2>
          <p className='max-w-md text-center text-lg text-white/80'>
            Sistem Informasi Eksekutif untuk {DINKES_NAME}. Mengintegrasikan
            data dari e-Puskesmas untuk pengambilan keputusan strategis.
          </p>

          {/* Demo credentials card */}
          <Card className='mt-8 border-white/20 bg-white/10 backdrop-blur-md'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm text-white'>Demo Login</CardTitle>
              <CardDescription className='text-xs text-white/70'>
                Gunakan kredensial berikut untuk demo
              </CardDescription>
            </CardHeader>
            <CardContent className='text-sm text-white/90'>
              <p>
                <strong>Email:</strong> {DEMO_EMAIL}
              </p>
              <p>
                <strong>Password:</strong> {DEMO_PASSWORD}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
