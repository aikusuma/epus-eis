// Seed ICD-10 data from CSV file
// Run with: bun run prisma/seed-icd10.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse CSV manually (simple parser for this format)
function parseCSV(
  content: string
): Array<{ code: string; display: string; version: string }> {
  const lines = content.split('\n');
  const result: Array<{ code: string; display: string; version: string }> = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields (display might contain commas)
    const matches = line.match(/^([^,]+),(".*?"|[^,]*),(.*)$/);
    if (matches) {
      const code = matches[1].trim();
      let display = matches[2].trim();
      const version = matches[3].trim();

      // Remove quotes if present
      if (display.startsWith('"') && display.endsWith('"')) {
        display = display.slice(1, -1);
      }

      result.push({ code, display, version });
    }
  }

  return result;
}

async function main() {
  console.log('🌱 Seeding ICD-10 data from CSV...');

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'public', 'icd10.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const icd10Data = parseCSV(csvContent);
  console.log(`📋 Found ${icd10Data.length} ICD-10 codes in CSV`);

  // Batch insert in chunks of 500
  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < icd10Data.length; i += chunkSize) {
    const chunk = icd10Data.slice(i, i + chunkSize);

    await prisma.$transaction(
      chunk.map((item) =>
        prisma.icd10.upsert({
          where: { code: item.code },
          update: { display: item.display, version: item.version },
          create: {
            code: item.code,
            display: item.display,
            version: item.version
          }
        })
      )
    );

    inserted += chunk.length;
    console.log(`  ✓ Inserted ${inserted}/${icd10Data.length} codes...`);
  }

  console.log('✅ ICD-10 data seeded successfully!');

  // Now seed dummy diagnosis data for the 10 common diseases
  console.log('\n🌱 Seeding dummy diagnosis data...');

  const commonDiseases = [
    { code: 'I10', name: 'Essential (primary) hypertension' },
    { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified' },
    { code: 'K30', name: 'Dyspepsia' },
    {
      code: 'E11.9',
      name: 'Non-insulin-dependent diabetes mellitus without complications'
    },
    { code: 'M79.1', name: 'Myalgia' },
    { code: 'R50.9', name: 'Fever, unspecified' },
    { code: 'R51', name: 'Headache' },
    {
      code: 'A09',
      name: 'Diarrhoea and gastroenteritis of presumed infectious origin'
    },
    { code: 'M54.5', name: 'Low back pain' },
    { code: 'K29.7', name: 'Gastritis, unspecified' }
  ];

  const puskesmasList = [
    'Puskesmas Brebes',
    'Puskesmas Wanasari',
    'Puskesmas Bulakamba',
    'Puskesmas Tanjung',
    'Puskesmas Losari',
    'Puskesmas Kersana',
    'Puskesmas Banjarharjo',
    'Puskesmas Ketanggungan',
    'Puskesmas Larangan',
    'Puskesmas Songgom'
  ];

  const namaLaki = [
    'Ahmad',
    'Budi',
    'Cahyo',
    'Dedi',
    'Eko',
    'Fajar',
    'Gunawan',
    'Hadi',
    'Irfan',
    'Joko'
  ];
  const namaPerempuan = [
    'Ani',
    'Beti',
    'Citra',
    'Dewi',
    'Eka',
    'Fitri',
    'Gita',
    'Hani',
    'Indah',
    'Jihan'
  ];

  // Get ICD10 records for common diseases
  const icd10Records = await prisma.icd10.findMany({
    where: { code: { in: commonDiseases.map((d) => d.code) } }
  });

  // Generate dummy diagnosis data
  const diagnosisData: Array<{
    icd10Id: string;
    pasienNama: string;
    pasienUmur: number;
    pasienGender: string;
    puskesmas: string;
    tanggalPeriksa: Date;
  }> = [];

  for (const icd10 of icd10Records) {
    // Generate 20-100 random diagnoses per disease
    const count = Math.floor(Math.random() * 80) + 20;

    for (let i = 0; i < count; i++) {
      const isLaki = Math.random() > 0.5;
      const namaList = isLaki ? namaLaki : namaPerempuan;
      const nama = namaList[Math.floor(Math.random() * namaList.length)];

      // Random age based on disease type
      let umur: number;
      if (icd10.code === 'I10' || icd10.code === 'E11.9') {
        // Hypertension & Diabetes - older patients
        umur = Math.floor(Math.random() * 40) + 40; // 40-80
      } else if (icd10.code === 'J06.9' || icd10.code === 'A09') {
        // ISPA & Diare - all ages
        umur = Math.floor(Math.random() * 70) + 5; // 5-75
      } else {
        umur = Math.floor(Math.random() * 60) + 15; // 15-75
      }

      // Random date in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const tanggal = new Date();
      tanggal.setDate(tanggal.getDate() - daysAgo);

      diagnosisData.push({
        icd10Id: icd10.id,
        pasienNama: nama,
        pasienUmur: umur,
        pasienGender: isLaki ? 'L' : 'P',
        puskesmas:
          puskesmasList[Math.floor(Math.random() * puskesmasList.length)],
        tanggalPeriksa: tanggal
      });
    }
  }

  // Clear existing dummy data
  await prisma.diagnosisDummy.deleteMany();

  // Insert diagnosis data in batches
  const diagChunkSize = 100;
  let diagInserted = 0;

  for (let i = 0; i < diagnosisData.length; i += diagChunkSize) {
    const chunk = diagnosisData.slice(i, i + diagChunkSize);
    await prisma.diagnosisDummy.createMany({ data: chunk });
    diagInserted += chunk.length;
    console.log(
      `  ✓ Inserted ${diagInserted}/${diagnosisData.length} diagnoses...`
    );
  }

  console.log(`✅ Created ${diagnosisData.length} dummy diagnosis records`);
  console.log('\n🎉 ICD-10 seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
