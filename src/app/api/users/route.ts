import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';

import { withAuth, logAudit } from '@/lib/acl';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/types/acl';

const createUserSchema = z
  .object({
    email: z.string().email('Email tidak valid'),
    username: z.string().min(3, 'Username minimal 3 karakter'),
    nama: z.string().min(3, 'Nama minimal 3 karakter'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
    roleId: z.string(),
    puskesmasId: z.string().nullable().optional(),
    wilayahId: z.string().nullable().optional(),
    jabatan: z.string().optional(),
    telepon: z.string().optional(),
    nip: z.string().optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword']
  });

const updateUserSchema = z
  .object({
    id: z.string(),
    nama: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    username: z.string().min(3, 'Username minimal 3 karakter'),
    roleId: z.string(),
    puskesmasId: z.string().nullable().optional(),
    wilayahId: z.string().nullable().optional(),
    jabatan: z.string().optional(),
    telepon: z.string().optional(),
    nip: z.string().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8, 'Password minimal 8 karakter').optional(),
    confirmPassword: z.string().optional()
  })
  .refine(
    (data) =>
      !data.password ||
      !data.confirmPassword ||
      data.password === data.confirmPassword,
    {
      message: 'Konfirmasi password tidak sama',
      path: ['confirmPassword']
    }
  );

export const GET = withAuth(
  async (req: NextRequest) => {
    const includeUsers = req.nextUrl.searchParams
      .get('include')
      ?.includes('users');

    const [roles, puskesmas, wilayah, users] = await Promise.all([
      db.role.findMany({ orderBy: { level: 'asc' } }),
      db.puskesmas.findMany({ orderBy: { namaPuskesmas: 'asc' } }),
      db.wilayah.findMany({ orderBy: { namaKecamatan: 'asc' } }),
      includeUsers
        ? db.user.findMany({
            include: {
              role: true,
              puskesmas: true,
              wilayah: true
            },
            orderBy: { createdAt: 'desc' }
          })
        : Promise.resolve([])
    ]);

    return NextResponse.json({
      roles: roles.map((r) => ({ id: r.id, name: r.name, code: r.code })),
      puskesmas: puskesmas.map((p) => ({
        id: p.id,
        kode: p.kodePuskesmas,
        nama: p.namaPuskesmas
      })),
      wilayah: wilayah.map((w) => ({
        id: w.id,
        kode: w.kodeKecamatan,
        nama: w.namaKecamatan
      })),
      users: includeUsers
        ? users.map((u) => ({
            id: u.id,
            nama: u.nama,
            email: u.email,
            username: u.username,
            role: u.role.name,
            roleCode: u.role.code,
            roleId: u.roleId,
            isActive: u.isActive,
            puskesmas: u.puskesmas
              ? {
                  id: u.puskesmas.id,
                  kode: u.puskesmas.kodePuskesmas,
                  nama: u.puskesmas.namaPuskesmas
                }
              : null,
            puskesmasId: u.puskesmasId,
            wilayah: u.wilayah
              ? {
                  id: u.wilayah.id,
                  kode: u.wilayah.kodeKecamatan,
                  nama: u.wilayah.namaKecamatan
                }
              : null,
            wilayahId: u.wilayahId
          }))
        : undefined
    });
  },
  { permissions: [PERMISSIONS.MANAGE_USERS] }
);

export const POST = withAuth(
  async (req: NextRequest, user) => {
    const body = await req.json();
    const payload = createUserSchema.parse(body);

    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { username: payload.username }]
      },
      select: { id: true, email: true, username: true }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email atau username sudah terpakai' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(payload.password, 10);

    const created = await db.user.create({
      data: {
        email: payload.email,
        username: payload.username,
        nama: payload.nama,
        jabatan: payload.jabatan ?? null,
        telepon: payload.telepon ?? null,
        nip: payload.nip ?? null,
        passwordHash,
        roleId: payload.roleId,
        puskesmasId: payload.puskesmasId ?? null,
        wilayahId: payload.wilayahId ?? null,
        isActive: payload.isActive ?? true
      },
      include: {
        role: true,
        puskesmas: true,
        wilayah: true
      }
    });

    await logAudit(
      user,
      'create_user',
      'user',
      created.id,
      {
        role: created.role.code,
        puskesmasId: created.puskesmasId,
        wilayahId: created.wilayahId
      },
      req
    );

    return NextResponse.json({
      user: {
        id: created.id,
        email: created.email,
        username: created.username,
        nama: created.nama,
        role: created.role.name,
        puskesmas: created.puskesmas
          ? {
              id: created.puskesmas.id,
              kode: created.puskesmas.kodePuskesmas,
              nama: created.puskesmas.namaPuskesmas
            }
          : null,
        wilayah: created.wilayah
          ? {
              id: created.wilayah.id,
              kode: created.wilayah.kodeKecamatan,
              nama: created.wilayah.namaKecamatan
            }
          : null
      }
    });
  },
  { permissions: [PERMISSIONS.MANAGE_USERS] }
);

export const PATCH = withAuth(
  async (req: NextRequest, userCtx) => {
    const body = await req.json();
    const payload = updateUserSchema.parse(body);

    const { id, password, confirmPassword, ...rest } = payload;

    const data: Record<string, unknown> = {
      nama: rest.nama,
      email: rest.email,
      username: rest.username,
      roleId: rest.roleId,
      puskesmasId: rest.puskesmasId ?? null,
      wilayahId: rest.wilayahId ?? null,
      jabatan: rest.jabatan ?? null,
      telepon: rest.telepon ?? null,
      nip: rest.nip ?? null,
      isActive: rest.isActive ?? true
    };

    if (password) {
      data.passwordHash = await hash(password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      include: {
        role: true,
        puskesmas: true,
        wilayah: true
      }
    });

    await logAudit(
      userCtx,
      'update_user',
      'user',
      id,
      { role: updated.role.code, isActive: updated.isActive },
      req
    );

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        nama: updated.nama,
        role: updated.role.name,
        roleCode: updated.role.code,
        roleId: updated.roleId,
        isActive: updated.isActive,
        puskesmas: updated.puskesmas
          ? {
              id: updated.puskesmas.id,
              kode: updated.puskesmas.kodePuskesmas,
              nama: updated.puskesmas.namaPuskesmas
            }
          : null,
        puskesmasId: updated.puskesmasId,
        wilayah: updated.wilayah
          ? {
              id: updated.wilayah.id,
              kode: updated.wilayah.kodeKecamatan,
              nama: updated.wilayah.namaKecamatan
            }
          : null
      }
    });
  },
  { permissions: [PERMISSIONS.MANAGE_USERS] }
);
