import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';

import { withAuth, logAudit } from '@/lib/acl';
import { db } from '@/lib/db';

const updateProfileSchema = z
  .object({
    nama: z.string().min(3, 'Nama minimal 3 karakter'),
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

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const payload = updateProfileSchema.parse(body);

  const data: Record<string, unknown> = {
    nama: payload.nama,
    jabatan: payload.jabatan ?? null,
    telepon: payload.telepon ?? null,
    nip: payload.nip ?? null
  };

  if (payload.password) {
    data.passwordHash = await hash(payload.password, 10);
  }

  const updated = await db.user.update({
    where: { id: user.userId },
    data,
    include: {
      role: true,
      puskesmas: true,
      wilayah: true
    }
  });

  await logAudit(
    user,
    'update_profile',
    'user',
    user.userId,
    {
      fields: Object.keys(data).filter((k) => k !== 'passwordHash')
    },
    req
  );

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      nama: updated.nama,
      jabatan: updated.jabatan,
      telepon: updated.telepon,
      nip: updated.nip,
      role: updated.role.name,
      roleCode: updated.role.code,
      puskesmas: updated.puskesmas
        ? {
            id: updated.puskesmas.id,
            kode: updated.puskesmas.kodePuskesmas,
            nama: updated.puskesmas.namaPuskesmas
          }
        : null,
      wilayah: updated.wilayah
        ? {
            id: updated.wilayah.id,
            kode: updated.wilayah.kodeKecamatan,
            nama: updated.wilayah.namaKecamatan
          }
        : null
    }
  });
});
