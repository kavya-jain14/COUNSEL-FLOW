import type { Category, Domicile, FactorKey, InstituteType, SubQuota } from '../types'

export const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'GEN', label: 'General' },
  { value: 'EWS', label: 'EWS' },
  { value: 'OBC', label: 'OBC' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
]

export const BRANCHES = [
  'CSE',
  'IT',
  'ECE',
  'EE',
  'ME',
  'CE',
  'AIML',
  'CHEM',
] as const

export const BRANCH_LABELS: Record<string, string> = {
  CSE: 'Computer Science & Engineering',
  IT: 'Information Technology',
  ECE: 'Electronics & Communication',
  EE: 'Electrical Engineering',
  ME: 'Mechanical Engineering',
  CE: 'Civil Engineering',
  AIML: 'AI & Machine Learning',
  CHEM: 'Chemical Engineering',
}

export const INSTITUTE_TYPE_LABELS: Record<InstituteType, string> = {
  GOVERNMENT: 'Government',
  AIDED: 'Government-aided',
  PRIVATE: 'Private',
}

export const FACTORS: Array<{
  key: FactorKey
  label: string
  hint: string
}> = [
  {
    key: 'placements',
    label: 'Placement record',
    hint: 'Pushes colleges with stronger recorded placements higher.',
  },
  {
    key: 'fees',
    label: 'Lower fees',
    hint: 'Prefers cheaper options — separate from your hard budget ceiling.',
  },
  {
    key: 'location',
    label: 'Closer to home',
    hint: 'Prefers nearer colleges — separate from your hard distance limit.',
  },
  {
    key: 'campus',
    label: 'Campus & facilities',
    hint: 'Prefers better infrastructure and campus life.',
  },
  {
    key: 'hostel',
    label: 'Hostel availability',
    hint: 'Prefers colleges with hostel rooms available.',
  },
]

export const DOMICILES: Array<{ value: Domicile; label: string; hint: string }> = [
  {
    value: 'UP',
    label: 'Uttar Pradesh',
    hint: 'Home-state seats. The large majority of UPTAC seats are filled from this pool.',
  },
  {
    value: 'OTHER',
    label: 'Other state',
    hint: 'Other-state seats. A much smaller pool, so closing ranks are usually tighter.',
  },
]

export const SUB_QUOTAS: Array<{ value: SubQuota; label: string; hint: string }> = [
  {
    value: 'GIRLS',
    label: 'Girls quota',
    hint: 'Seats reserved for female candidates in participating institutes.',
  },
  {
    value: 'ARMED_FORCES',
    label: 'Armed forces (AF)',
    hint: 'For wards of serving or ex-service defence personnel.',
  },
  {
    value: 'PWD',
    label: 'Person with disability (PwD)',
    hint: 'Horizontal reservation for candidates with a recognised disability.',
  },
  {
    value: 'FREEDOM_FIGHTER',
    label: 'Freedom fighter (FF)',
    hint: 'For dependants of recognised freedom fighters.',
  },
]

export const CITIES = [
  'Lucknow',
  'Kanpur',
  'Noida',
  'Ghaziabad',
  'Gorakhpur',
  'Varanasi',
  'Agra',
  'Bareilly',
]

export const DATASET_LABEL = 'UPTAC sample cycle 2024 (verified subset)'
export const ENGINE_VERSION = 'engine-0.2.0'
export const PROFILE_VERSION = 'profile-v1'

export const WEIGHT_WORDS = ['Ignore', 'Slight', 'Some', 'Matters', 'Important', 'Decisive']
