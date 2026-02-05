// Authentication API - Get current user
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, createUserContext, UNAUTHORIZED } from '@/lib/acl';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return UNAUTHORIZED();
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
        puskesmas: true,
        wilayah: true
      }
    });

    if (!user || !user.isActive) {
      return UNAUTHORIZED();
    }

    const context = createUserContext(payload);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        jabatan: user.jabatan,
        role: user.role.name,
        roleCode: user.role.code,
        puskesmas: user.puskesmas
          ? {
              id: user.puskesmas.id,
              kode: user.puskesmas.kodePuskesmas,
              nama: user.puskesmas.namaPuskesmas
            }
          : null,
        wilayah: user.wilayah
          ? {
              id: user.wilayah.id,
              kode: user.wilayah.kodeKecamatan,
              nama: user.wilayah.namaKecamatan
            }
          : null,
        permissions: context.permissions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
