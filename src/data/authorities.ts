import type { Category, Domicile, SubQuota } from '../types'

export type AuthorityId = 'UPTAC' | 'JOSAA' | 'IPU'

export interface RegionVocabulary {
  label: string
  home: string
  other: string
  hint: string
}

export interface CounsellingAuthority {
  id: AuthorityId
  label: string
  fullName: string
  rankTypes: string[]
  region: RegionVocabulary
  categories: Category[]
  subQuotas: SubQuota[]
  rounds: number
  datasetLabel: string
  datasetLoaded: boolean
  datasetNote: string
}

export const AUTHORITIES: Record<AuthorityId, CounsellingAuthority> = {
  UPTAC: {
    id: 'UPTAC',
    label: 'UPTAC',
    fullName: 'UP Technical Admission Counselling (AKTU)',
    rankTypes: ['JEE Main', 'State entrance'],
    region: {
      label: 'Domicile',
      home: 'Uttar Pradesh',
      other: 'Other state',
      hint: 'Home-state seats are the larger pool in UPTAC.',
    },
    categories: ['GEN', 'EWS', 'OBC', 'SC', 'ST'],
    subQuotas: ['GIRLS', 'ARMED_FORCES', 'PWD', 'FREEDOM_FIGHTER'],
    rounds: 3,
    datasetLabel: 'UPTAC sample cycle 2024 (verified subset)',
    datasetLoaded: true,
    datasetNote: 'Curated sample subset. Every row carries its source label and year.',
  },
  JOSAA: {
    id: 'JOSAA',
    label: 'JoSAA',
    fullName: 'Joint Seat Allocation Authority (IITs, NITs, IIITs, GFTIs)',
    rankTypes: ['JEE Main CRL', 'JEE Advanced'],
    region: {
      label: 'State quota',
      home: 'Home state',
      other: 'Other state',
      hint: 'NITs and GFTIs split seats between home-state and other-state quotas.',
    },
    categories: ['GEN', 'EWS', 'OBC', 'SC', 'ST'],
    subQuotas: ['GIRLS', 'PWD'],
    rounds: 6,
    datasetLabel: 'JoSAA 2025 Round 6 · official closing ranks',
    datasetLoaded: true,
    datasetNote:
      'Parsed from the official JoSAA round PDFs (2025 Round 6 and 2024 Round 5). Fees, hostel and placement facts are not in those sources, so they show as unverified.',
  },
  IPU: {
    id: 'IPU',
    label: 'IPU',
    fullName: 'Guru Gobind Singh Indraprastha University, Delhi',
    rankTypes: ['IPU CET', 'JEE Main'],
    region: {
      label: 'Region',
      home: 'Delhi region',
      other: 'Outside Delhi region',
      hint: 'IPU splits most programmes 85:15 between Delhi and outside-Delhi candidates.',
    },
    categories: ['GEN', 'EWS', 'OBC', 'SC', 'ST'],
    subQuotas: ['ARMED_FORCES', 'PWD'],
    rounds: 4,
    datasetLabel: 'GGSIPU 2026-27 Round 3 · official cutoff',
    datasetLoaded: true,
    datasetNote:
      'Parsed from the official GGSIPU B.Tech Round 3 cutoff PDF. Fees, hostel and placement facts are not in that source, so they show as unverified.',
  },
}

export const AUTHORITY_LIST = Object.values(AUTHORITIES)

export const DEFAULT_AUTHORITY: AuthorityId = 'UPTAC'

export function seatPoolFor(
  authority: AuthorityId,
  category: Category,
  domicile: Domicile,
): string {
  return candidatePools(authority, category, domicile)[0]
}

export function candidatePools(
  authority: AuthorityId,
  category: Category,
  domicile: Domicile,
): string[] {
  const region = domicile === 'UP' ? 'HS' : 'OS'
  if (authority === 'JOSAA') {
    return [
      `JOSAA:${category}:AI`,
      `JOSAA:${category}:${region}`,
      `JOSAA:${category}:OS`,
    ]
  }
  return [`${authority}:${category}:${region}`]
}
