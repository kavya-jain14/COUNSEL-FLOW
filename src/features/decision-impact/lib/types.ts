import type { FactorKey, Tier } from '../../../types'

export type ImpactLabel =
  | 'HARD_CONSTRAINT_VIOLATION'
  | 'CONTRADICTION'
  | 'SOFT_COMPROMISE'
  | 'POTENTIAL_RISK'
  | 'STRONG_MATCH'
  | 'EVIDENCE_GAP'

export type ImpactSection =
  | 'blocking'
  | 'works'
  | 'compromises'
  | 'risks'
  | 'consequences'
  | 'unknowns'

export type ImpactDimension =
  | 'branch'
  | 'budget'
  | 'distance'
  | 'placements'
  | 'campus'
  | 'hostel'
  | 'instituteType'
  | 'city'
  | 'reach'
  | 'quota'
  | 'order'
  | 'evidence'

export type SatisfactionState = 'SATISFIED' | 'PARTIAL' | 'VIOLATED' | 'UNKNOWN'

export type ImpactCode =
  | 'BRANCH_FIRST_CHOICE'
  | 'BRANCH_DOWNGRADE'
  | 'BRANCH_UNRANKED'
  | 'BRANCH_EXCLUDED'
  | 'BRANCH_AVAILABLE_ELSEWHERE'
  | 'FEE_WITHIN'
  | 'FEE_TIGHT'
  | 'FEE_HARD_BREACH'
  | 'FEE_SOFT_BREACH'
  | 'FEE_ABOVE_LIST'
  | 'FEE_UNKNOWN'
  | 'DISTANCE_WITHIN'
  | 'DISTANCE_TIGHT'
  | 'DISTANCE_HARD_BREACH'
  | 'DISTANCE_SOFT_BREACH'
  | 'DISTANCE_UNKNOWN'
  | 'PLACEMENT_STRONG'
  | 'PLACEMENT_MID'
  | 'PLACEMENT_WEAK'
  | 'PLACEMENT_UNKNOWN'
  | 'CAMPUS_STRONG'
  | 'CAMPUS_WEAK'
  | 'HOSTEL_AVAILABLE'
  | 'HOSTEL_MISSING'
  | 'HOSTEL_EXCLUDED'
  | 'HOSTEL_NO_COMMUTE'
  | 'TYPE_EXCLUDED'
  | 'CITY_EXCLUDED'
  | 'REACH_DREAM'
  | 'REACH_TARGET'
  | 'REACH_SAFE'
  | 'REACH_UNKNOWN'
  | 'QUOTA_NOT_MODELLED'
  | 'ORDER_FORFEIT'
  | 'ORDER_AHEAD'
  | 'CONTRADICTS_WEIGHT'
  | 'CONTRADICTS_BRANCH_ORDER'
  | 'DOMINATED_BY_NEIGHBOUR'
  | 'NO_SAFE_FALLBACK'
  | 'DUPLICATE_SLOT'
  | 'EVIDENCE_MISSING'

export type ImpactFacts = Record<string, string | number | boolean | null>

export interface ImpactFinding {
  id: string
  code: ImpactCode
  label: ImpactLabel
  dimension: ImpactDimension
  section: ImpactSection
  state: SatisfactionState
  weight: number
  facts: ImpactFacts
}

export type FitBand = 'BLOCKED' | 'STRONG' | 'WORKABLE' | 'STRAINED' | 'POOR'

export interface FitContribution {
  key: FactorKey | 'branch'
  label: string
  weight: number
  weightWord: string
  satisfaction: number | null
  evidence: string
}

export interface FitScore {
  score: number
  band: FitBand
  coverage: number
  unmeasured: string[]
  satisfied: number
  partial: number
  violated: number
  unknown: number
  contributions: FitContribution[]
}

export interface DeclaredPreference {
  key: string
  label: string
  value: string
  mode: 'hard' | 'soft' | 'fact'
  relevant: boolean
}

export interface DecisionImpact {
  itemId: string
  optionId: string
  name: string
  college: string
  branch: string
  branchLabel: string
  city: string
  instituteType: string
  position: number
  total: number
  tier: Tier
  fit: FitScore
  declared: DeclaredPreference[]
  blocking: ImpactFinding[]
  works: ImpactFinding[]
  compromises: ImpactFinding[]
  risks: ImpactFinding[]
  consequences: ImpactFinding[]
  unknowns: ImpactFinding[]
}
