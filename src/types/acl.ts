// ACL (Access Control List) types and constants
// Enforcement is done at API layer, NOT at UI

// Role codes
export const ROLE_CODES = {
  KEPALA_DINKES: 'kepala_dinkes',
  KABID: 'kabid',
  SUBKOR: 'subkor',
  KEPALA_PUSKESMAS: 'kepala_puskesmas',
  STAF: 'staf'
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

// Permission codes
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ALL_PUSKESMAS: 'view_all_puskesmas',
  VIEW_OWN_PUSKESMAS: 'view_own_puskesmas',
  VIEW_AGGREGATED_DATA: 'view_aggregated_data',
  EXPORT_REPORTS: 'export_reports',
  VIEW_REPORTS: 'view_reports',
  SYNC_DATA: 'sync_data',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings'
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// User context for ACL checks
export interface UserContext {
  userId: string;
  email: string;
  roleCode: RoleCode;
  puskesmasId?: string;
  wilayahId?: string;
  permissions: PermissionCode[];
}

// ACL check result
export interface AclCheckResult {
  allowed: boolean;
  reason?: string;
}

// Role hierarchy (lower number = higher access)
export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  [ROLE_CODES.KEPALA_DINKES]: 1,
  [ROLE_CODES.KABID]: 2,
  [ROLE_CODES.SUBKOR]: 3,
  [ROLE_CODES.KEPALA_PUSKESMAS]: 4,
  [ROLE_CODES.STAF]: 5
};

// Roles that can see all puskesmas
export const DINKES_LEVEL_ROLES: RoleCode[] = [
  ROLE_CODES.KEPALA_DINKES,
  ROLE_CODES.KABID,
  ROLE_CODES.SUBKOR
];

// Age group mapping
export const AGE_GROUPS = {
  BAYI: 'bayi', // 0-1 tahun
  ANAK: 'anak', // 1-11 tahun
  REMAJA: 'remaja', // 12-17 tahun
  DEWASA: 'dewasa', // 18-59 tahun
  LANSIA: 'lansia' // 60+ tahun
} as const;

export type AgeGroup = (typeof AGE_GROUPS)[keyof typeof AGE_GROUPS];

// Layanan type
export const LAYANAN_TYPES = {
  RAWAT_JALAN: 'RJ',
  UGD: 'UGD',
  RAWAT_INAP: 'RI'
} as const;

export type LayananType = (typeof LAYANAN_TYPES)[keyof typeof LAYANAN_TYPES];

// Unit type
export const UNIT_TYPES = {
  PUSKESMAS: 'Puskesmas',
  PUSTU: 'Pustu',
  POSYANDU: 'Posyandu',
  POLINDES: 'Polindes'
} as const;

export type UnitType = (typeof UNIT_TYPES)[keyof typeof UNIT_TYPES];

// Gender
export const GENDERS = {
  LAKI_LAKI: 'L',
  PEREMPUAN: 'P'
} as const;

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

// Kategori Program
export const KATEGORI_PROGRAM = {
  PTM: 'PTM',
  MENULAR: 'menular',
  KIA: 'KIA',
  UMUM: 'umum'
} as const;

export type KategoriProgram =
  (typeof KATEGORI_PROGRAM)[keyof typeof KATEGORI_PROGRAM];

// ICD-10 Group codes
export const ICD10_GROUPS = {
  ISPA: 'ISPA',
  PNEUMONIA: 'PNEUMONIA',
  HIPERTENSI: 'HIPERTENSI',
  DIABETES: 'DIABETES',
  JANTUNG: 'JANTUNG',
  CERNA: 'CERNA',
  TB: 'TB',
  DBD: 'DBD',
  KIA: 'KIA',
  KULIT: 'KULIT',
  MUSKULOSKELETAL: 'MUSKULOSKELETAL'
} as const;

export type Icd10Group = (typeof ICD10_GROUPS)[keyof typeof ICD10_GROUPS];
