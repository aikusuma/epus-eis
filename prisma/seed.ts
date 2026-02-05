// Prisma seed script for initial data
// Run with: bun run db:seed

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // ROLES
  // ============================================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { code: 'kepala_dinkes' },
      update: {},
      create: {
        code: 'kepala_dinkes',
        name: 'Kepala Dinkes',
        description: 'Akses penuh ke semua data dan menu',
        level: 1
      }
    }),
    prisma.role.upsert({
      where: { code: 'kabid' },
      update: {},
      create: {
        code: 'kabid',
        name: 'Kepala Bidang',
        description: 'Akses penuh data tanpa manajemen user',
        level: 2
      }
    }),
    prisma.role.upsert({
      where: { code: 'subkor' },
      update: {},
      create: {
        code: 'subkor',
        name: 'Sub Koordinator',
        description: 'Akses data program tertentu',
        level: 3
      }
    }),
    prisma.role.upsert({
      where: { code: 'kepala_puskesmas' },
      update: {},
      create: {
        code: 'kepala_puskesmas',
        name: 'Kepala Puskesmas',
        description: 'Akses data puskesmas sendiri dan agregat kabupaten',
        level: 4
      }
    }),
    prisma.role.upsert({
      where: { code: 'staf' },
      update: {},
      create: {
        code: 'staf',
        name: 'Staf/Operator',
        description: 'Akses data agregat dan export laporan',
        level: 5
      }
    })
  ]);

  console.log('✅ Roles created:', roles.length);

  // ============================================
  // PERMISSIONS
  // ============================================
  const permissions = await Promise.all([
    // Dashboard
    prisma.permission.upsert({
      where: { code: 'view_dashboard' },
      update: {},
      create: {
        code: 'view_dashboard',
        name: 'Lihat Dashboard',
        module: 'dashboard'
      }
    }),
    prisma.permission.upsert({
      where: { code: 'view_all_puskesmas' },
      update: {},
      create: {
        code: 'view_all_puskesmas',
        name: 'Lihat Semua Puskesmas',
        module: 'puskesmas'
      }
    }),
    prisma.permission.upsert({
      where: { code: 'view_own_puskesmas' },
      update: {},
      create: {
        code: 'view_own_puskesmas',
        name: 'Lihat Puskesmas Sendiri',
        module: 'puskesmas'
      }
    }),
    prisma.permission.upsert({
      where: { code: 'view_aggregated_data' },
      update: {},
      create: {
        code: 'view_aggregated_data',
        name: 'Lihat Data Agregat',
        module: 'dashboard'
      }
    }),
    // Reports
    prisma.permission.upsert({
      where: { code: 'export_reports' },
      update: {},
      create: {
        code: 'export_reports',
        name: 'Export Laporan',
        module: 'reports'
      }
    }),
    // Users
    prisma.permission.upsert({
      where: { code: 'manage_users' },
      update: {},
      create: { code: 'manage_users', name: 'Kelola Pengguna', module: 'users' }
    }),
    // Settings
    prisma.permission.upsert({
      where: { code: 'manage_settings' },
      update: {},
      create: {
        code: 'manage_settings',
        name: 'Kelola Pengaturan',
        module: 'settings'
      }
    })
  ]);

  console.log('✅ Permissions created:', permissions.length);

  // ============================================
  // ROLE PERMISSIONS MAPPING
  // ============================================
  const kepalaDinkesRole = roles.find((r) => r.code === 'kepala_dinkes')!;
  const kabidRole = roles.find((r) => r.code === 'kabid')!;
  const kepalaPuskesmasRole = roles.find((r) => r.code === 'kepala_puskesmas')!;
  const stafRole = roles.find((r) => r.code === 'staf')!;

  // Kepala Dinkes - All permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: kepalaDinkesRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: { roleId: kepalaDinkesRole.id, permissionId: perm.id }
    });
  }

  // Kabid - All except manage_users
  for (const perm of permissions.filter(
    (p) => p.code !== 'manage_users' && p.code !== 'manage_settings'
  )) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: kabidRole.id, permissionId: perm.id }
      },
      update: {},
      create: { roleId: kabidRole.id, permissionId: perm.id }
    });
  }

  // Kepala Puskesmas
  const kepalaPuskesmasPerms = permissions.filter((p) =>
    [
      'view_dashboard',
      'view_own_puskesmas',
      'view_aggregated_data',
      'export_reports'
    ].includes(p.code)
  );
  for (const perm of kepalaPuskesmasPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: kepalaPuskesmasRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: { roleId: kepalaPuskesmasRole.id, permissionId: perm.id }
    });
  }

  // Staf
  const stafPerms = permissions.filter((p) =>
    ['view_dashboard', 'view_aggregated_data', 'export_reports'].includes(
      p.code
    )
  );
  for (const perm of stafPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: stafRole.id, permissionId: perm.id }
      },
      update: {},
      create: { roleId: stafRole.id, permissionId: perm.id }
    });
  }

  console.log('✅ Role permissions mapped');

  // ============================================
  // WILAYAH (Kecamatan di Brebes)
  // ============================================
  const wilayahData = [
    { kodeKecamatan: '332901', namaKecamatan: 'Salem' },
    { kodeKecamatan: '332902', namaKecamatan: 'Bantarkawung' },
    { kodeKecamatan: '332903', namaKecamatan: 'Bumiayu' },
    { kodeKecamatan: '332904', namaKecamatan: 'Paguyangan' },
    { kodeKecamatan: '332905', namaKecamatan: 'Sirampog' },
    { kodeKecamatan: '332906', namaKecamatan: 'Tonjong' },
    { kodeKecamatan: '332907', namaKecamatan: 'Larangan' },
    { kodeKecamatan: '332908', namaKecamatan: 'Ketanggungan' },
    { kodeKecamatan: '332909', namaKecamatan: 'Banjarharjo' },
    { kodeKecamatan: '332910', namaKecamatan: 'Losari' },
    { kodeKecamatan: '332911', namaKecamatan: 'Tanjung' },
    { kodeKecamatan: '332912', namaKecamatan: 'Kersana' },
    { kodeKecamatan: '332913', namaKecamatan: 'Bulakamba' },
    { kodeKecamatan: '332914', namaKecamatan: 'Wanasari' },
    { kodeKecamatan: '332915', namaKecamatan: 'Songgom' },
    { kodeKecamatan: '332916', namaKecamatan: 'Jatibarang' },
    { kodeKecamatan: '332917', namaKecamatan: 'Brebes' }
  ];

  const wilayahRecords = await Promise.all(
    wilayahData.map((w) =>
      prisma.wilayah.upsert({
        where: { kodeKecamatan: w.kodeKecamatan },
        update: {},
        create: w
      })
    )
  );

  console.log('✅ Wilayah created:', wilayahRecords.length);

  // ============================================
  // PUSKESMAS (Sample data)
  // ============================================
  const puskesmasData = [
    {
      kodePuskesmas: 'PKM001',
      namaPuskesmas: 'Puskesmas Brebes',
      wilayahKode: '332917',
      jenis: 'rawat_inap'
    },
    {
      kodePuskesmas: 'PKM002',
      namaPuskesmas: 'Puskesmas Bumiayu I',
      wilayahKode: '332903',
      jenis: 'rawat_inap'
    },
    {
      kodePuskesmas: 'PKM003',
      namaPuskesmas: 'Puskesmas Bumiayu II',
      wilayahKode: '332903',
      jenis: 'non_rawat_inap'
    },
    {
      kodePuskesmas: 'PKM004',
      namaPuskesmas: 'Puskesmas Losari',
      wilayahKode: '332910',
      jenis: 'rawat_inap'
    },
    {
      kodePuskesmas: 'PKM005',
      namaPuskesmas: 'Puskesmas Ketanggungan',
      wilayahKode: '332908',
      jenis: 'rawat_inap'
    },
    {
      kodePuskesmas: 'PKM006',
      namaPuskesmas: 'Puskesmas Bulakamba',
      wilayahKode: '332913',
      jenis: 'non_rawat_inap'
    },
    {
      kodePuskesmas: 'PKM007',
      namaPuskesmas: 'Puskesmas Wanasari',
      wilayahKode: '332914',
      jenis: 'non_rawat_inap'
    },
    {
      kodePuskesmas: 'PKM008',
      namaPuskesmas: 'Puskesmas Jatibarang',
      wilayahKode: '332916',
      jenis: 'rawat_inap'
    },
    {
      kodePuskesmas: 'PKM009',
      namaPuskesmas: 'Puskesmas Salem',
      wilayahKode: '332901',
      jenis: 'rawat_inap'
    },
    {
      kodePuskesmas: 'PKM010',
      namaPuskesmas: 'Puskesmas Bantarkawung',
      wilayahKode: '332902',
      jenis: 'non_rawat_inap'
    }
  ];

  for (const pkm of puskesmasData) {
    const wilayah = wilayahRecords.find(
      (w) => w.kodeKecamatan === pkm.wilayahKode
    );
    if (wilayah) {
      await prisma.puskesmas.upsert({
        where: { kodePuskesmas: pkm.kodePuskesmas },
        update: {},
        create: {
          kodePuskesmas: pkm.kodePuskesmas,
          namaPuskesmas: pkm.namaPuskesmas,
          wilayahId: wilayah.id,
          jenis: pkm.jenis
        }
      });
    }
  }

  console.log('✅ Puskesmas created:', puskesmasData.length);

  // ============================================
  // ICD-10 (Priority diseases)
  // ============================================
  const icd10Data = [
    // ISPA
    {
      code: 'J00',
      name: 'Nasofaringitis akut (common cold)',
      groupCode: 'ISPA',
      groupName: 'ISPA',
      kategoriProgram: 'menular'
    },
    {
      code: 'J01',
      name: 'Sinusitis akut',
      groupCode: 'ISPA',
      groupName: 'ISPA',
      kategoriProgram: 'menular'
    },
    {
      code: 'J02',
      name: 'Faringitis akut',
      groupCode: 'ISPA',
      groupName: 'ISPA',
      kategoriProgram: 'menular'
    },
    {
      code: 'J03',
      name: 'Tonsilitis akut',
      groupCode: 'ISPA',
      groupName: 'ISPA',
      kategoriProgram: 'menular'
    },
    {
      code: 'J06',
      name: 'Infeksi saluran napas atas akut',
      groupCode: 'ISPA',
      groupName: 'ISPA',
      kategoriProgram: 'menular'
    },
    // Pneumonia
    {
      code: 'J12',
      name: 'Pneumonia viral',
      groupCode: 'PNEUMONIA',
      groupName: 'Pneumonia',
      kategoriProgram: 'menular'
    },
    {
      code: 'J13',
      name: 'Pneumonia pneumokokus',
      groupCode: 'PNEUMONIA',
      groupName: 'Pneumonia',
      kategoriProgram: 'menular'
    },
    {
      code: 'J18',
      name: 'Pneumonia tidak spesifik',
      groupCode: 'PNEUMONIA',
      groupName: 'Pneumonia',
      kategoriProgram: 'menular'
    },
    // Hipertensi
    {
      code: 'I10',
      name: 'Hipertensi esensial (primer)',
      groupCode: 'HIPERTENSI',
      groupName: 'Hipertensi',
      kategoriProgram: 'PTM'
    },
    {
      code: 'I11',
      name: 'Penyakit jantung hipertensi',
      groupCode: 'HIPERTENSI',
      groupName: 'Hipertensi',
      kategoriProgram: 'PTM'
    },
    {
      code: 'I15',
      name: 'Hipertensi sekunder',
      groupCode: 'HIPERTENSI',
      groupName: 'Hipertensi',
      kategoriProgram: 'PTM'
    },
    // Diabetes
    {
      code: 'E10',
      name: 'Diabetes melitus tipe 1',
      groupCode: 'DIABETES',
      groupName: 'Diabetes Mellitus',
      kategoriProgram: 'PTM'
    },
    {
      code: 'E11',
      name: 'Diabetes melitus tipe 2',
      groupCode: 'DIABETES',
      groupName: 'Diabetes Mellitus',
      kategoriProgram: 'PTM'
    },
    {
      code: 'E14',
      name: 'Diabetes melitus tidak spesifik',
      groupCode: 'DIABETES',
      groupName: 'Diabetes Mellitus',
      kategoriProgram: 'PTM'
    },
    // Penyakit Jantung
    {
      code: 'I20',
      name: 'Angina pektoris',
      groupCode: 'JANTUNG',
      groupName: 'Penyakit Jantung',
      kategoriProgram: 'PTM'
    },
    {
      code: 'I21',
      name: 'Infark miokard akut',
      groupCode: 'JANTUNG',
      groupName: 'Penyakit Jantung',
      kategoriProgram: 'PTM'
    },
    {
      code: 'I25',
      name: 'Penyakit jantung iskemik kronis',
      groupCode: 'JANTUNG',
      groupName: 'Penyakit Jantung',
      kategoriProgram: 'PTM'
    },
    // Gangguan Cerna
    {
      code: 'A09',
      name: 'Diare dan gastroenteritis',
      groupCode: 'CERNA',
      groupName: 'Gangguan Pencernaan',
      kategoriProgram: 'menular'
    },
    {
      code: 'K29',
      name: 'Gastritis dan duodenitis',
      groupCode: 'CERNA',
      groupName: 'Gangguan Pencernaan',
      kategoriProgram: 'umum'
    },
    {
      code: 'K30',
      name: 'Dispepsia fungsional',
      groupCode: 'CERNA',
      groupName: 'Gangguan Pencernaan',
      kategoriProgram: 'umum'
    },
    // TB
    {
      code: 'A15',
      name: 'TB paru terkonfirmasi bakteriologis',
      groupCode: 'TB',
      groupName: 'Tuberkulosis',
      kategoriProgram: 'menular'
    },
    {
      code: 'A16',
      name: 'TB paru tanpa konfirmasi bakteriologis',
      groupCode: 'TB',
      groupName: 'Tuberkulosis',
      kategoriProgram: 'menular'
    },
    // DBD
    {
      code: 'A90',
      name: 'Demam dengue',
      groupCode: 'DBD',
      groupName: 'Demam Berdarah',
      kategoriProgram: 'menular'
    },
    {
      code: 'A91',
      name: 'Demam berdarah dengue',
      groupCode: 'DBD',
      groupName: 'Demam Berdarah',
      kategoriProgram: 'menular'
    },
    // KIA
    {
      code: 'O80',
      name: 'Persalinan tunggal spontan',
      groupCode: 'KIA',
      groupName: 'Kesehatan Ibu & Anak',
      kategoriProgram: 'KIA'
    },
    {
      code: 'O21',
      name: 'Hiperemesis gravidarum',
      groupCode: 'KIA',
      groupName: 'Kesehatan Ibu & Anak',
      kategoriProgram: 'KIA'
    },
    {
      code: 'O46',
      name: 'Perdarahan antepartum',
      groupCode: 'KIA',
      groupName: 'Kesehatan Ibu & Anak',
      kategoriProgram: 'KIA'
    }
  ];

  for (const icd of icd10Data) {
    await prisma.icd10.upsert({
      where: { code: icd.code },
      update: {},
      create: icd
    });
  }

  console.log('✅ ICD-10 created:', icd10Data.length);

  // ============================================
  // DEFAULT ADMIN USER
  // ============================================
  const adminPassword = await hash('admin123', 12);
  const adminRole = roles.find((r) => r.code === 'kepala_dinkes')!;

  await prisma.user.upsert({
    where: { email: 'admin@dinkes-brebes.go.id' },
    update: {},
    create: {
      email: 'admin@dinkes-brebes.go.id',
      username: 'admin',
      passwordHash: adminPassword,
      nama: 'Administrator',
      jabatan: 'System Administrator',
      roleId: adminRole.id
    }
  });

  console.log('✅ Admin user created');
  console.log('   Email: admin@dinkes-brebes.go.id');
  console.log('   Password: admin123');

  // ============================================
  // SYSTEM CONFIG
  // ============================================
  const configs = [
    {
      key: 'app_name',
      value: 'EIS Dinkes Brebes',
      type: 'string',
      module: 'general'
    },
    {
      key: 'cache_ttl_seconds',
      value: '300',
      type: 'number',
      module: 'performance'
    },
    {
      key: 'max_export_rows',
      value: '10000',
      type: 'number',
      module: 'reports'
    }
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg
    });
  }

  console.log('✅ System config created');
  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
