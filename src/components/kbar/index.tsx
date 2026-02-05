'use client';
import { navItems } from '@/config/nav-config';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch
} from 'kbar';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';
import { useFilteredNavItems } from '@/hooks/use-nav';

// Enhanced search items - sections within pages
const enhancedSearchItems = [
  // Klaster 1 sections
  {
    name: 'Data SDM',
    section: 'Klaster 1',
    url: '/dashboard/klaster1?tab=sdm',
    keywords: 'sdm pegawai tenaga kesehatan nakes dokter perawat bidan'
  },
  {
    name: 'Stok & Pemakaian Obat',
    section: 'Klaster 1',
    url: '/dashboard/klaster1?tab=obat',
    keywords: 'obat farmasi stok pemakaian persediaan'
  },
  {
    name: 'Data Keuangan',
    section: 'Klaster 1',
    url: '/dashboard/klaster1?tab=keuangan',
    keywords: 'keuangan anggaran belanja pendapatan jkn kapitasi'
  },

  // Klaster 2 sections
  {
    name: 'Antenatal Care (ANC)',
    section: 'Klaster 2',
    url: '/dashboard/klaster2?tab=anc',
    keywords: 'anc ibu hamil persalinan nifas ante natal k1 k4'
  },
  {
    name: 'Imunisasi Bayi',
    section: 'Klaster 2',
    url: '/dashboard/klaster2?tab=imunisasi-bayi',
    keywords: 'imunisasi bayi vaksin bcg polio dpt hepatitis'
  },
  {
    name: 'Imunisasi Baduta',
    section: 'Klaster 2',
    url: '/dashboard/klaster2?tab=imunisasi-baduta',
    keywords: 'imunisasi baduta lanjutan campak rubella dpt'
  },
  {
    name: 'BIAS (Bulan Imunisasi Anak Sekolah)',
    section: 'Klaster 2',
    url: '/dashboard/klaster2?tab=bias',
    keywords: 'bias sekolah sd smp imunisasi anak'
  },

  // Klaster 3 sections
  {
    name: 'Deteksi Dini PTM',
    section: 'Klaster 3',
    url: '/dashboard/klaster3?tab=deteksi',
    keywords: 'deteksi dini screening skrining posbindu ptm'
  },
  {
    name: 'Faktor Risiko PTM',
    section: 'Klaster 3',
    url: '/dashboard/klaster3?tab=risiko',
    keywords: 'risiko hipertensi diabetes merokok obesitas'
  },
  {
    name: 'Diagnosis PTM',
    section: 'Klaster 3',
    url: '/dashboard/klaster3?tab=diagnosis',
    keywords: 'ptm penyakit tidak menular dm hipertensi stroke jantung'
  },
  {
    name: 'Pemeriksaan Gigi',
    section: 'Klaster 3',
    url: '/dashboard/klaster3?tab=gigi',
    keywords: 'gigi mulut karies gingivitis dental ukgs'
  },

  // Klaster 4 sections
  {
    name: '12 Diagnosa Terbanyak',
    section: 'Klaster 4',
    url: '/dashboard/klaster4?tab=top12',
    keywords: 'diagnosa terbanyak top 12 penyakit icd ranking'
  },
  {
    name: 'Penyakit Bahaya Tinggi',
    section: 'Klaster 4',
    url: '/dashboard/klaster4?tab=tinggi',
    keywords: 'bahaya tinggi kritis darurat emergency tb tbc hepatitis hiv'
  },
  {
    name: 'Penyakit Bahaya Sedang',
    section: 'Klaster 4',
    url: '/dashboard/klaster4?tab=sedang',
    keywords: 'bahaya sedang waspada warning dbd malaria'
  },
  {
    name: 'Penyakit Bahaya Rendah',
    section: 'Klaster 4',
    url: '/dashboard/klaster4?tab=rendah',
    keywords: 'bahaya rendah ringan minor ispa diare'
  },

  // Lintas Klaster sections
  {
    name: 'Pelayanan Gawat Darurat (UGD)',
    section: 'Lintas Klaster',
    url: '/dashboard/lintas-klaster?tab=gawat-darurat',
    keywords: 'ugd igd gawat darurat emergency ambulance triase'
  },
  {
    name: 'Pelayanan Farmasi',
    section: 'Lintas Klaster',
    url: '/dashboard/lintas-klaster?tab=farmasi',
    keywords: 'farmasi apotek obat resep e-resep'
  },
  {
    name: 'Pelayanan Laboratorium',
    section: 'Lintas Klaster',
    url: '/dashboard/lintas-klaster?tab=laboratorium',
    keywords: 'lab laboratorium cek darah urine feses hematologi'
  },
  {
    name: 'Pelayanan Rawat Inap',
    section: 'Lintas Klaster',
    url: '/dashboard/lintas-klaster?tab=rawat-inap',
    keywords: 'rawat inap bed kamar pasien opname bor los'
  },

  // Monitoring sections
  {
    name: 'Top 10 Diagnosa',
    section: 'Monitoring',
    url: '/dashboard/monitoring?tab=diagnosa',
    keywords: 'diagnosa penyakit top 10 ranking icd statistik'
  },
  {
    name: 'Top 10 Keluhan',
    section: 'Monitoring',
    url: '/dashboard/monitoring?tab=keluhan',
    keywords: 'keluhan gejala symptom batuk demam pusing sakit'
  },
  {
    name: 'Top 10 Obat',
    section: 'Monitoring',
    url: '/dashboard/monitoring?tab=obat',
    keywords: 'obat terbanyak resep farmasi paracetamol amoxicillin'
  },

  // Quick actions - common diseases
  {
    name: 'Cari: Hipertensi (I10)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=I10',
    keywords: 'hipertensi darah tinggi i10 tekanan darah'
  },
  {
    name: 'Cari: ISPA (J06.9)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=J06.9',
    keywords: 'ispa batuk pilek flu j06 infeksi saluran napas'
  },
  {
    name: 'Cari: Diabetes Melitus (E11)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=E11',
    keywords: 'diabetes dm gula darah e11 kencing manis'
  },
  {
    name: 'Cari: Gastritis (K29)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=K29',
    keywords: 'gastritis maag lambung k29 asam lambung gerd'
  },
  {
    name: 'Cari: Diare (A09)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=A09',
    keywords: 'diare mencret a09 gastroenteritis'
  },
  {
    name: 'Cari: Demam (R50)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=R50',
    keywords: 'demam panas r50 febris suhu tinggi'
  },
  {
    name: 'Cari: Sakit Kepala (R51)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=R51',
    keywords: 'sakit kepala pusing r51 cephalgia migrain'
  },
  {
    name: 'Cari: Tuberkulosis (A15)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=A15',
    keywords: 'tb tbc tuberkulosis a15 batuk darah paru'
  },
  {
    name: 'Cari: Demam Berdarah (A90)',
    section: 'Cari Penyakit',
    url: '/dashboard/cari?q=A90',
    keywords: 'dbd demam berdarah dengue a90 nyamuk'
  },

  // Puskesmas quick search
  {
    name: 'Puskesmas Brebes',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=brebes',
    keywords: 'puskesmas brebes pkm'
  },
  {
    name: 'Puskesmas Wanasari',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=wanasari',
    keywords: 'puskesmas wanasari pkm'
  },
  {
    name: 'Puskesmas Bulakamba',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=bulakamba',
    keywords: 'puskesmas bulakamba pkm'
  },
  {
    name: 'Puskesmas Tanjung',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=tanjung',
    keywords: 'puskesmas tanjung pkm'
  },
  {
    name: 'Puskesmas Losari',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=losari',
    keywords: 'puskesmas losari pkm'
  },
  {
    name: 'Puskesmas Jatibarang',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=jatibarang',
    keywords: 'puskesmas jatibarang pkm'
  },
  {
    name: 'Puskesmas Kersana',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=kersana',
    keywords: 'puskesmas kersana pkm'
  },
  {
    name: 'Puskesmas Ketanggungan',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=ketanggungan',
    keywords: 'puskesmas ketanggungan pkm'
  },
  {
    name: 'Puskesmas Banjarharjo',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=banjarharjo',
    keywords: 'puskesmas banjarharjo pkm'
  },
  {
    name: 'Puskesmas Salem',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=salem',
    keywords: 'puskesmas salem pkm'
  },
  {
    name: 'Puskesmas Bantarkawung',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=bantarkawung',
    keywords: 'puskesmas bantarkawung pkm'
  },
  {
    name: 'Puskesmas Bumiayu',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=bumiayu',
    keywords: 'puskesmas bumiayu pkm'
  },
  {
    name: 'Puskesmas Paguyangan',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=paguyangan',
    keywords: 'puskesmas paguyangan pkm'
  },
  {
    name: 'Puskesmas Sirampog',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=sirampog',
    keywords: 'puskesmas sirampog pkm'
  },
  {
    name: 'Puskesmas Tonjong',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=tonjong',
    keywords: 'puskesmas tonjong pkm'
  },
  {
    name: 'Puskesmas Larangan',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=larangan',
    keywords: 'puskesmas larangan pkm'
  },
  {
    name: 'Puskesmas Songgom',
    section: 'Puskesmas',
    url: '/dashboard/overview?puskesmas=songgom',
    keywords: 'puskesmas songgom pkm'
  }
];

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const filteredItems = useFilteredNavItems(navItems);

  // These action are for the navigation
  const actions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    // Navigation actions from nav items
    const navActions = filteredItems.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      const baseAction =
        navItem.url !== '#'
          ? {
              id: `${navItem.title.toLowerCase()}Action`,
              name: navItem.title,
              shortcut: navItem.shortcut,
              keywords: navItem.title.toLowerCase(),
              section: 'Navigasi',
              subtitle: `Buka ${navItem.title}`,
              perform: () => navigateTo(navItem.url)
            }
          : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `${childItem.title.toLowerCase()}Action`,
          name: childItem.title,
          shortcut: childItem.shortcut,
          keywords: childItem.title.toLowerCase(),
          section: navItem.title,
          subtitle: `Buka ${childItem.title}`,
          perform: () => navigateTo(childItem.url)
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });

    // Enhanced search actions for sections within pages
    const enhancedActions = enhancedSearchItems.map((item) => ({
      id: `enhanced-${item.name.toLowerCase().replace(/\s/g, '-')}`,
      name: item.name,
      keywords: item.keywords,
      section: item.section,
      subtitle: `Lihat ${item.name}`,
      perform: () => navigateTo(item.url)
    }));

    return [...navActions, ...enhancedActions];
  }, [router, filteredItems]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm'>
          <KBarAnimator className='bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-card border-border sticky top-0 z-10 border-b'>
              <KBarSearch className='bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden' />
            </div>
            <div className='max-h-[400px]'>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
