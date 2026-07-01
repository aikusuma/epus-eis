'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { PERMISSIONS } from '@/types/acl';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil data');
  return res.json();
};

// Profile form schema
const profileSchema = z
  .object({
    nama: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email(),
    jabatan: z.string().optional(),
    telepon: z.string().optional(),
    nip: z.string().optional(),
    password: z.string().min(8, 'Password minimal 8 karakter').optional(),
    confirmPassword: z.string().optional()
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword']
  });

// Base user schema
const baseUserSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email(),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  roleId: z.string().min(1, 'Pilih role'),
  puskesmasId: z.string().nullable().optional(),
  wilayahId: z.string().nullable().optional(),
  jabatan: z.string().optional(),
  telepon: z.string().optional(),
  nip: z.string().optional(),
  isActive: z.boolean()
});

// Create user schema (password wajib)
const createUserSchema = baseUserSchema
  .extend({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword']
  });

// Update user schema (password opsional)
const updateUserSchema = baseUserSchema
  .extend({
    id: z.string(),
    password: z.string().min(8, 'Password minimal 8 karakter').optional(),
    confirmPassword: z.string().optional()
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword']
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type CreateUserFormValues = z.infer<typeof createUserSchema>;

type UserRow = {
  id: string;
  nama: string;
  email: string;
  username: string;
  role: string;
  roleCode: string;
  roleId: string;
  isActive: boolean;
  puskesmas?: { id: string; nama: string } | null;
  puskesmasId?: string | null;
  wilayah?: { id: string; nama: string } | null;
  wilayahId?: string | null;
};

function PermissionBadges({ permissions }: { permissions: string[] }) {
  if (!permissions?.length) return null;
  return (
    <div className='flex flex-wrap gap-2'>
      {permissions.map((p) => (
        <Badge key={p} variant='secondary' className='capitalize'>
          {p.replaceAll('_', ' ')}
        </Badge>
      ))}
    </div>
  );
}

export default function ProfileViewPage() {
  const {
    data: meData,
    isLoading: loadingMe,
    mutate: mutateMe
  } = useSWR('/api/auth/me', fetcher);
  const me = meData?.user;
  const hasManageUsers = useMemo(
    () => me?.permissions?.includes(PERMISSIONS.MANAGE_USERS),
    [me?.permissions]
  );

  const {
    data: optionsData,
    mutate: mutateUsers,
    isLoading: loadingUsers
  } = useSWR(hasManageUsers ? '/api/users?include=users' : null, fetcher);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama: '',
      email: '',
      jabatan: '',
      telepon: '',
      nip: '',
      password: '',
      confirmPassword: ''
    }
  });

  const userForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nama: '',
      email: '',
      username: '',
      roleId: '',
      puskesmasId: 'none',
      wilayahId: 'none',
      jabatan: '',
      telepon: '',
      nip: '',
      isActive: true,
      password: '',
      confirmPassword: ''
    }
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const users: UserRow[] = optionsData?.users ?? [];
  const roles = optionsData?.roles ?? [];
  const puskesmasOptions = optionsData?.puskesmas ?? [];
  const wilayahOptions = optionsData?.wilayah ?? [];

  // Populate profile form when data loaded
  useEffect(() => {
    if (me) {
      profileForm.reset({
        nama: me.nama ?? '',
        email: me.email ?? '',
        jabatan: me.jabatan ?? '',
        telepon: me.telepon ?? '',
        nip: me.nip ?? '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [me, profileForm]);

  const handleProfileSubmit = profileForm.handleSubmit(async (values) => {
    const payload = { ...values };
    if (!payload.password) {
      delete (payload as any).password;
      delete (payload as any).confirmPassword;
    }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error || 'Gagal memperbarui profil');
      return;
    }
    await mutateMe();
    profileForm.setValue('password', '');
    profileForm.setValue('confirmPassword', '');
    toast.success('Profil diperbarui');
  });

  const openCreateModal = () => {
    setEditingUser(null);
    userForm.reset({
      nama: '',
      email: '',
      username: '',
      roleId: '',
      puskesmasId: 'none',
      wilayahId: 'none',
      jabatan: '',
      telepon: '',
      nip: '',
      isActive: true,
      password: '',
      confirmPassword: ''
    });
    setUserModalOpen(true);
  };

  const openEditModal = (user: UserRow) => {
    setEditingUser(user);
    userForm.reset({
      nama: user.nama,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      puskesmasId: user.puskesmasId ?? 'none',
      wilayahId: user.wilayahId ?? 'none',
      jabatan: '',
      telepon: '',
      nip: '',
      isActive: user.isActive,
      password: '',
      confirmPassword: ''
    });
    setUserModalOpen(true);
  };

  const handleSubmitUser = userForm.handleSubmit(async (values) => {
    const basePayload = {
      ...values,
      puskesmasId: values.puskesmasId === 'none' ? null : values.puskesmasId,
      wilayahId: values.wilayahId === 'none' ? null : values.wilayahId
    } as any;

    // If editing, allow empty password
    if (editingUser) {
      const parsed = updateUserSchema.safeParse({
        ...basePayload,
        id: editingUser.id,
        password: values.password || undefined,
        confirmPassword: values.confirmPassword || undefined
      });
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        const firstFieldError = Object.values(flat.fieldErrors)[0]?.[0];
        toast.error(firstFieldError || 'Validasi gagal');
        return;
      }
      const payload = parsed.data;
      if (!payload.password) {
        delete (payload as any).password;
        delete (payload as any).confirmPassword;
      }
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Gagal memperbarui user');
        return;
      }
      toast.success('User diperbarui');
    } else {
      const parsed = createUserSchema.safeParse(basePayload);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        const firstFieldError = Object.values(flat.fieldErrors)[0]?.[0];
        toast.error(firstFieldError || 'Validasi gagal');
        return;
      }
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Gagal membuat user');
        return;
      }
      toast.success('User baru dibuat');
    }

    await mutateUsers();
    setUserModalOpen(false);
  });

  const handleToggleActive = async (user: UserRow) => {
    const payload = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      puskesmasId: user.puskesmasId ?? null,
      wilayahId: user.wilayahId ?? null,
      isActive: !user.isActive
    } as any;
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error || 'Gagal mengubah status user');
      return;
    }
    toast.success(user.isActive ? 'User dinonaktifkan' : 'User diaktifkan');
    await mutateUsers();
  };

  return (
    <PageContainer
      pageTitle='Akun & Profile'
      pageDescription='Kelola profil pribadi, akses, dan pengguna EIS.'
      isloading={loadingMe}
      scrollable
    >
      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='h-full lg:col-span-2'>
          <CardHeader>
            <CardTitle>Profil Saya</CardTitle>
            <CardDescription>
              Perbarui identitas dan password akun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              form={profileForm}
              onSubmit={handleProfileSubmit}
              className='space-y-4'
            >
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={profileForm.control}
                  name='nama'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder='Nama' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={profileForm.control}
                  name='jabatan'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jabatan</FormLabel>
                      <FormControl>
                        <Input placeholder='Contoh: Kabid Yankes' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name='telepon'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder='08xx' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={profileForm.control}
                  name='nip'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIP (opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder='NIP' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={profileForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password baru (opsional)</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Minimal 8 karakter'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi password</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Ulangi password'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  disabled={profileForm.formState.isSubmitting}
                >
                  {profileForm.formState.isSubmitting
                    ? 'Menyimpan...'
                    : 'Simpan Perubahan'}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        <div className='space-y-6 lg:h-full'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Akses & Role</CardTitle>
              <CardDescription>Ringkasan hak akses akun.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Role</span>
                <Badge>{me?.role}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Kode Role</span>
                <span className='font-medium'>{me?.roleCode}</span>
              </div>
              <div className='space-y-2'>
                <span className='text-muted-foreground text-sm'>
                  Permissions
                </span>
                <PermissionBadges permissions={me?.permissions ?? []} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {hasManageUsers && (
        <Card className='mt-6'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <div>
              <CardTitle>Manajemen Pengguna</CardTitle>
              <CardDescription>
                Tambah, ubah, atau nonaktifkan user.
              </CardDescription>
            </div>
            <Button size='sm' onClick={openCreateModal}>
              Tambah User
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='text-muted-foreground text-xs'>
              Role baru: keuangan (akses keuangan) dan staf_view (hanya lihat
              dashboard/agregat).
            </div>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Puskesmas</TableHead>
                    <TableHead className='text-right'>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.length ? (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className='font-medium'>{u.nama}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? 'default' : 'secondary'}>
                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.puskesmas?.nama ?? 'Semua'}</TableCell>
                        <TableCell className='flex justify-end gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => openEditModal(u)}
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            variant={u.isActive ? 'destructive' : 'secondary'}
                            onClick={() => handleToggleActive(u)}
                          >
                            {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground text-center text-sm'
                      >
                        {loadingUsers
                          ? 'Memuat pengguna...'
                          : 'Belum ada pengguna'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Tambah User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Ubah data pengguna. Kosongkan password jika tidak ingin diganti.'
                : 'Isi data lengkap untuk membuat pengguna baru.'}
            </DialogDescription>
          </DialogHeader>

          <Form
            form={userForm}
            onSubmit={handleSubmitUser}
            className='space-y-3'
          >
            <div className='grid gap-3 md:grid-cols-2'>
              <FormField
                control={userForm.control}
                name='nama'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder='Nama lengkap' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`email@${process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'dinkes.go.id'}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              <FormField
                control={userForm.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder='username' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Pilih role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <FormField
                control={userForm.control}
                name='puskesmasId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puskesmas (opsional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Pilih puskesmas' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>
                          Semua /{' '}
                          {process.env.NEXT_PUBLIC_DINKES_NAME ||
                            'Dinas Kesehatan'}
                        </SelectItem>
                        {puskesmasOptions.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name='wilayahId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wilayah (opsional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Pilih wilayah' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>Tidak spesifik</SelectItem>
                        {wilayahOptions.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <FormField
                control={userForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password{' '}
                      {editingUser ? '(kosongkan bila tidak diubah)' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Minimal 8 karakter'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Ulangi password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={userForm.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                  <div className='space-y-0.5'>
                    <FormLabel>Aktifkan user</FormLabel>
                    <p className='text-muted-foreground text-xs'>
                      Jika dimatikan, user tidak bisa login.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setUserModalOpen(false)}
              >
                Batal
              </Button>
              <Button type='submit' disabled={userForm.formState.isSubmitting}>
                {editingUser
                  ? userForm.formState.isSubmitting
                    ? 'Menyimpan...'
                    : 'Simpan Perubahan'
                  : userForm.formState.isSubmitting
                    ? 'Membuat user...'
                    : 'Buat User'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
