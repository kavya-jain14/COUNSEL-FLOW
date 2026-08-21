import type {
  ApiErrorEnvelope as WireApiErrorEnvelope,
  AuditResult as WireAuditResult,
  BranchCode as WireBranchCode,
  CandidateProfile as WireCandidateProfile,
  Category as WireCategory,
  CollegeOption as WireCollegeOption,
  Confidence as WireConfidence,
  Domicile as WireDomicile,
  Conflict as WireConflict,
  ConflictAction as WireConflictAction,
  ConflictActionKind as WireConflictActionKind,
  ConflictCode as WireConflictCode,
  ConstraintMode as WireConstraintMode,
  FactorKey as WireFactorKey,
  FactorWeights as WireFactorWeights,
  HardExclusion as WireHardExclusion,
  InstituteType as WireInstituteType,
  LockedStrategySnapshot as WireLockedStrategySnapshot,
  MissingFact as WireMissingFact,
  RankType as WireRankType,
  ReasonFact as WireReasonFact,
  Resolution as WireResolution,
  ResolutionKind as WireResolutionKind,
  Severity as WireSeverity,
  StrategyGenerateResponse as WireStrategyGenerateResponse,
  StrategyItem as WireStrategyItem,
  SubQuota as WireSubQuota,
  Tier as WireTier,
} from '@counselflow/contracts'

export type Category = WireCategory
export type RankType = WireRankType
export type Domicile = WireDomicile
export type SubQuota = WireSubQuota
export type BranchCode = WireBranchCode
export type FactorKey = WireFactorKey
export type FactorWeights = WireFactorWeights
export type ConstraintMode = WireConstraintMode

export type HardExclusionKind = WireHardExclusion['kind']

/** UI-only metadata. The API receives only `kind` and `value`. */
export interface HardExclusion {
  id: string
  kind: HardExclusionKind
  value: string
  label: string
}

export interface ConstraintSetting {
  value: number
  mode: ConstraintMode
}

/** Editable form state; incomplete rank/category values never cross the API boundary. */
export interface CandidateProfile {
  rank: number | null
  rankType: RankType
  category: Category | null
  domicile: Domicile | null
  subQuotas: SubQuota[]
  branchPriority: BranchCode[]
  homeCity: string | null

  budget: ConstraintSetting
  distance: ConstraintSetting
  hardExclusions: HardExclusion[]
  factorWeights: FactorWeights
}

export type CandidateProfilePayload = WireCandidateProfile


export type ProfileErrors = Partial<Record<ProfileField, string>>

export type ProfileField =
  | 'rank'
  | 'category'
  | 'domicile'
  | 'subQuotas'
  | 'homeCity'
  | 'branchPriority'
  | 'budget'
  | 'distance'
  | 'hardExclusions'
  | 'factorWeights'

export type InstituteType = WireInstituteType
export type Tier = WireTier
export type Confidence = WireConfidence
export type MissingFact = WireMissingFact
export type CollegeOption = WireCollegeOption
export type ReasonFact = WireReasonFact
export type StrategyItem = WireStrategyItem
export type ConflictCode = WireConflictCode
export type Severity = WireSeverity
export type ConflictActionKind = WireConflictActionKind
export type ConflictAction = WireConflictAction
export type Conflict = WireConflict
export type ResolutionKind = WireResolutionKind
export type Resolution = WireResolution
export type AuditResult = WireAuditResult
export type LockState = WireLockedStrategySnapshot
export type ApiErrorEnvelope = WireApiErrorEnvelope
export type StrategyGenerateResponse = WireStrategyGenerateResponse

export type Step =
  | 'landing'
  | 'profile'
  | 'summary'
  | 'strategy'
  | 'conflicts'
  | 'locked'
