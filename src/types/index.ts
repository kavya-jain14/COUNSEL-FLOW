export type Category = 'GEN' | 'EWS' | 'OBC' | 'SC' | 'ST'

export type RankType = 'CRL' | 'CATEGORY'

export type FactorKey = 'placements' | 'fees' | 'location' | 'campus' | 'hostel'

export type FactorWeights = Record<FactorKey, number>

export type HardExclusionKind = 'branch' | 'instituteType' | 'location' | 'noHostel'

export interface HardExclusion {
  id: string
  kind: HardExclusionKind

  value: string

  label: string
}

export interface ConstraintSetting {
  value: number
  mode: 'hard' | 'soft'
}

export interface CandidateProfile {
  rank: number | null
  rankType: RankType
  category: Category | null
  homeCity: string | null

  branchPriority: string[]

  budget: ConstraintSetting

  distance: ConstraintSetting
  hardExclusions: HardExclusion[]
  factorWeights: FactorWeights
}

export interface CandidateProfilePayload {
  rank: number
  rankType: RankType
  category: Category
  homeCity: string
  branchPriority: string[]
  budget: ConstraintSetting
  distance: ConstraintSetting
  hardExclusions: Array<Pick<HardExclusion, 'kind' | 'value'>>

  factorWeights: FactorWeights
}

export type ProfileErrors = Partial<Record<ProfileField, string>>

export type ProfileField =
  | 'rank'
  | 'category'
  | 'homeCity'
  | 'branchPriority'
  | 'budget'
  | 'distance'
  | 'hardExclusions'
  | 'factorWeights'

export type InstituteType = 'GOVERNMENT' | 'AIDED' | 'PRIVATE'

export type Tier = 'DREAM' | 'TARGET' | 'SAFE' | 'UNKNOWN'

export interface CollegeOption {

  id: string
  college: string
  collegeShort: string
  branch: string
  instituteType: InstituteType
  city: string

  annualFee: number | null
  distanceKm: number | null
  hostelAvailable: boolean
  placementScore: number | null
  campusScore: number | null
  closingRank: number | null

  sourceLabel: string
  sourceYear: number

  missingFacts: string[]
}

export interface ReasonFact {
  code: string
  label: string
  detail: string
  polarity: 'positive' | 'negative' | 'neutral'
}

export interface StrategyItem {

  itemId: string
  option: CollegeOption
  tier: Tier

  position: number
  reasons: ReasonFact[]
  confidence: 'high' | 'medium' | 'low'

  manuallyPlaced: boolean
}

export type ConflictCode =
  | 'CF-01'
  | 'CF-02'
  | 'CF-03'
  | 'CF-04'
  | 'CF-05'
  | 'CF-06'
  | 'CF-07'
  | 'CF-08'

export type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

export type ConflictActionKind =
  | 'REMOVE_OPTION'
  | 'CHANGE_CONSTRAINT'
  | 'CONVERT_TO_SOFT'
  | 'SWAP'
  | 'MOVE'
  | 'DEDUPE'
  | 'KEEP'
  | 'ACKNOWLEDGE'

export interface ConflictAction {
  id: string
  kind: ConflictActionKind
  label: string

  effect: string

  intent: 'primary' | 'secondary'

  requiresReason?: boolean

  target?: {
    itemId?: string
    withItemId?: string
    constraint?: 'budget' | 'distance'
    newValue?: number
    exclusionId?: string
  }
}

export interface Conflict {
  id: string
  code: ConflictCode
  severity: Severity
  title: string

  summary: string

  evidence: string[]

  causedBy: string

  itemIds: string[]
  actions: ConflictAction[]
}

export type ResolutionKind = 'FIXED' | 'OVERRIDDEN' | 'ACKNOWLEDGED'

export interface Resolution {
  conflictId: string
  code: ConflictCode
  kind: ResolutionKind
  actionLabel: string
  reason?: string

  atAuditRun: number
}

export interface AuditResult {

  runId: number
  conflicts: Conflict[]
  counts: Record<Severity, number>

  canLock: boolean
}

export interface LockState {
  locked: boolean
  snapshotId: string | null
  profileVersion: string
  datasetLabel: string
  engineVersion: string
  acknowledgedWarnings: Resolution[]
  itemOrder: string[]
}

export type Step =
  | 'landing'
  | 'profile'
  | 'summary'
  | 'strategy'
  | 'conflicts'
  | 'locked'
