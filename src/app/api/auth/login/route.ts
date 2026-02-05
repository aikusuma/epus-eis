// Authentication API - Login
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user with role and permissions
    const user = await db.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        puskesmas: true,
        wilayah: true
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Extract permissions
    const permissions = user.role.permissions.map(
      (rp: { permission: { code: string } }) => rp.permission.code
    );

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      roleCode: user.role.code,
      puskesmasId: user.puskesmasId ?? undefined,
      wilayahId: user.wilayahId ?? undefined,
      permissions
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        ipAddress:
          req.headers.get('x-forwarded-for') ??
          req.headers.get('x-real-ip') ??
          undefined,
        userAgent: req.headers.get('user-agent') ?? undefined
      }
    });

    // Set cookie and return response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        jabatan: user.jabatan,
        role: user.role.name,
        roleCode: user.role.code,
        puskesmas: user.puskesmas?.namaPuskesmas,
        wilayah: user.wilayah?.namaKecamatan,
        permissions
      },
      token
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
