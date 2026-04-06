#!/usr/bin/env bun
/**
 * Create a Kepala Puskesmas user restricted to a single puskesmas
 *
 * Usage: bun run scripts/create-kepala-puskesmas.ts
 *
 * This script:
 * 1. Finds a puskesmas (or uses specified one)
 * 2. Creates a role-based user with view_own_puskesmas permission only
 * 3. Locks the user to that single puskesmas via puskesmasId relation
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { hash } from 'bcryptjs';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const targetPuskesmasName = process.argv[2] || 'Puskesmas Wanasari';
  const defaultPassword = 'puskesmas123';

  console.log('🏥 Creating Kepala Puskesmas user...\n');

  // 1. Find the puskesmas
  let puskesmas = await prisma.puskesmas.findFirst({
    where: {
      namaPuskesmas: {
        contains: targetPuskesmasName
      }
    },
    include: {
      wilayah: true
    }
  });

  if (!puskesmas) {
    // Fallback to first available puskesmas
    puskesmas = await prisma.puskesmas.findFirst({
      include: { wilayah: true }
    });

    if (!puskesmas) {
      console.error('❌ No puskesmas found in database. Run seed first.');
      process.exit(1);
    }

    console.log(
      `⚠️  "${targetPuskesmasName}" not found, using: ${puskesmas.namaPuskesmas}`
    );
  } else {
    console.log(`✅ Found puskesmas: ${puskesmas.namaPuskesmas}`);
  }

  const puskesmasKode = puskesmas.kodePuskesmas;
  const puskesmasNama = puskesmas.namaPuskesmas;
  const kecamatan = puskesmas.wilayah?.namaKecamatan || 'Unknown';

  console.log(`   Kode: ${puskesmasKode}`);
  console.log(`   Kecamatan: ${kecamatan}\n`);

  // 2. Ensure role exists
  let role = await prisma.role.findUnique({
    where: { code: 'kepala_puskesmas' }
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        code: 'kepala_puskesmas',
        name: 'Kepala Puskesmas',
        description: 'Akses data puskesmas sendiri saja',
        level: 4
      }
    });
    console.log(`✅ Created role: kepala_puskesmas`);
  } else {
    console.log(`✅ Role exists: kepala_puskesmas`);
  }

  // 3. Ensure permissions exist
  const permissions = [
    {
      code: 'view_own_puskesmas',
      name: 'Lihat Data Puskesmas Sendiri',
      module: 'dashboard'
    },
    { code: 'view_dashboard', name: 'Lihat Dashboard', module: 'dashboard' }
  ];

  for (const perm of permissions) {
    let p = await prisma.permission.findUnique({
      where: { code: perm.code }
    });

    if (!p) {
      p = await prisma.permission.create({ data: perm });
      console.log(`✅ Created permission: ${perm.code}`);
    }

    // Link to role
    const existingLink = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: p.id
        }
      }
    });

    if (!existingLink) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: p.id
        }
      });
      console.log(`✅ Linked permission to role: ${perm.code}`);
    }
  }

  // 4. Create user
  const email = `kepala.${puskesmasKode.toLowerCase().replace(/[^a-z0-9]/g, '')}@dinkes-brebes.go.id`;
  const username = `kepala_${puskesmasKode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const passwordHash = await hash(defaultPassword, 10);

  const existingUser = await prisma.user.findFirst({
    where: { puskesmasId: puskesmas.id }
  });

  if (existingUser) {
    console.log(
      `\n⚠️  User already exists for this puskesmas: ${existingUser.email}`
    );
    console.log(`    Resetting password to: ${defaultPassword}\n`);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        isActive: true,
        roleId: role.id
      }
    });

    console.log(`✅ Updated user: ${existingUser.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Puskesmas: ${puskesmasNama}`);
    console.log(`   Role: Kepala Puskesmas\n`);
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        nama: `Kepala ${puskesmasNama}`,
        jabatan: 'Kepala Puskesmas',
        roleId: role.id,
        puskesmasId: puskesmas.id,
        wilayahId: puskesmas.wilayahId,
        isActive: true
      }
    });

    console.log(`\n✅ Created user:\n`);
    console.log(`   Email:    ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Nama:     ${user.nama}`);
    console.log(`   Role:     Kepala Puskesmas`);
    console.log(`   Puskesmas: ${puskesmasNama}`);
    console.log(`   Kecamatan: ${kecamatan}\n`);
  }

  console.log('📋 Permissions for this user:');
  console.log(
    '   ✅ view_own_puskesmas - Can view their own puskesmas data only'
  );
  console.log('   ✅ view_dashboard - Can access dashboard');
  console.log('   ❌ view_all_puskesmas - CANNOT view other puskesmas');
  console.log('   ❌ manage_users - CANNOT manage users');
  console.log('   ❌ manage_settings - CANNOT manage settings');
  console.log('');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
