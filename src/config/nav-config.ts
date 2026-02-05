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
    title: 'Cari',
    url: '/dashboard/cari',
    icon: 'search',
    isActive: false,
    shortcut: ['c', 'r'],
    items: []
  },
  {
    title: 'Klaster 1',
    url: '/dashboard/klaster1',
    icon: 'users',
    isActive: false,
    shortcut: ['k', '1'],
    items: []
  },
  {
    title: 'Klaster 2',
    url: '/dashboard/klaster2',
    icon: 'heart',
    isActive: false,
    shortcut: ['k', '2'],
    items: []
  },
  {
    title: 'Klaster 3',
    url: '/dashboard/klaster3',
    icon: 'stethoscope',
    isActive: false,
    shortcut: ['k', '3'],
    items: []
  },
  {
    title: 'Klaster 4',
    url: '/dashboard/klaster4',
    icon: 'alertTriangle',
    isActive: false,
    shortcut: ['k', '4'],
    items: []
  },
  {
    title: 'Lintas Klaster',
    url: '/dashboard/lintas-klaster',
    icon: 'layers',
    isActive: false,
    shortcut: ['l', 'k'],
    items: []
  },
  {
    title: 'Monitoring',
    url: '/dashboard/monitoring',
    icon: 'mapPin',
    isActive: false,
    shortcut: ['m', 'o'],
    items: []
  },
  {
    title: 'Laporan',
    url: '/dashboard/laporan',
    icon: 'fileText',
    isActive: false,
    shortcut: ['l', 'p'],
    items: []
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
