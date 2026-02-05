import { NavItem } from '@/types';

/**
 * Navigation configuration for EIS Dashboard
 * Executive Information System - Dinas Kesehatan Kabupaten Brebes
 */
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Penyakit',
    url: '#',
    icon: 'stethoscope',
    isActive: true,
    items: [
      {
        title: 'Top Penyakit',
        url: '/dashboard/penyakit/top',
        icon: 'chartBar',
        shortcut: ['p', 't']
      },
      {
        title: 'Distribusi',
        url: '/dashboard/penyakit/distribusi',
        icon: 'chartPie',
        shortcut: ['p', 'd']
      },
      {
        title: 'Tren',
        url: '/dashboard/penyakit/tren',
        icon: 'chartLine',
        shortcut: ['p', 'r']
      }
    ]
  },
  {
    title: 'Puskesmas',
    url: '#',
    icon: 'building',
    isActive: true,
    items: [
      {
        title: 'Daftar Puskesmas',
        url: '/dashboard/puskesmas',
        icon: 'list',
        shortcut: ['k', 'l']
      },
      {
        title: 'Perbandingan',
        url: '/dashboard/puskesmas/compare',
        icon: 'compare',
        shortcut: ['k', 'c']
      }
    ]
  },
  {
    title: 'Laporan',
    url: '#',
    icon: 'fileText',
    isActive: true,
    items: [
      {
        title: 'Bulanan',
        url: '/dashboard/laporan/bulanan',
        icon: 'calendar',
        shortcut: ['l', 'b']
      },
      {
        title: 'Export',
        url: '/dashboard/laporan/export',
        icon: 'download',
        shortcut: ['l', 'e']
      }
    ]
  },
  {
    title: 'Akun',
    url: '#',
    icon: 'account',
    isActive: true,
    items: [
      {
        title: 'Profil',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['a', 'p']
      }
    ]
  }
];
