import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type {
  ApiErrorEnvelope,
  AuditResult,
  CandidateProfile,
  Conflict,
  ConflictAction,
  LockState,
  Resolution,
  ResolutionKind,
  StrategyGenerateResponse,
  StrategyItem,
  Step,
} from '../types'
import { renumber } from '../mock/strategy'
import * as api from '../mock/api'
import { AUTHORITIES, DEFAULT_AUTHORITY, type AuthorityId } from '../data/authorities'
import { improvementsOver, labelFor, type RoundRecord } from '../lib/rounds'
import { CUTOFF_YEAR } from '../data/cutoffs'
import { latestSetFor } from '../data/generated'
import { toApiError } from '../features/contracts'

export interface ActivityEntry {
  id: string
  tone: 'fixed' | 'overridden' | 'audited' | 'locked' | 'proposed'
  label: string
  detail: string
  reason?: string
}

export interface AppState {
  step: Step
  authorityId: AuthorityId
  currentRound: number
  history: RoundRecord[]
  allottedOptionId: string | null
  profile: CandidateProfile
  items: StrategyItem[]
  audit: AuditResult | null
  resolutions: Resolution[]
  activity: ActivityEntry[]
  lock: LockState | null
  busy: null | 'generate' | 'audit' | 'lock'
  activeOperationToken: number | null
  auditStale: boolean
  error: ApiErrorEnvelope | null
  announcement: string
}

export const DEFAULT_PROFILE: CandidateProfile = {
  rank: null,
  rankType: 'CRL',
  category: null,
  domicile: null,
  subQuotas: [],
  homeCity: null,
  branchPriority: ['CSE', 'IT', 'ECE'],
  budget: { value: 150000, mode: 'hard' },
  distance: { value: 300, mode: 'hard' },
  hardExclusions: [],
  factorWeights: {
    placements: 4,
    fees: 3,
    location: 3,
    campus: 2,
    hostel: 2,
  },
}

export const DEMO_PROFILE: CandidateProfile = {
  ...DEFAULT_PROFILE,
  rank: 12500,
  rankType: 'CRL',
  category: 'GEN',
  domicile: 'UP',
  subQuotas: [],
  homeCity: 'Lucknow',
}

export const INITIAL_STATE: AppState = {
  step: 'landing',
  authorityId: DEFAULT_AUTHORITY,
  currentRound: 1,
  history: [],
  allottedOptionId: null,
  profile: DEFAULT_PROFILE,
  items: [],
  audit: null,
  resolutions: [],
  activity: [],
  lock: null,
  busy: null,
  activeOperationToken: null,
  auditStale: false,
  error: null,
  announcement: '',
}

export type Action =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'PATCH_PROFILE'; patch: Partial<CandidateProfile> }
  | { type: 'LOAD_DEMO_PROFILE' }
  | { type: 'BUSY'; busy: Exclude<AppState['busy'], null>; token: number }
  | { type: 'GENERATED'; response: StrategyGenerateResponse; token: number }
  | { type: 'AUDITED'; audit: AuditResult; token: number }
  | { type: 'APPLY_ACTION'; conflict: Conflict; action: ConflictAction; reason?: string }
  | { type: 'MOVE_ITEM'; itemId: string; direction: -1 | 1 }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'LOCKED'; lock: LockState; token: number }
  | { type: 'FAILED'; error: ApiErrorEnvelope; token: number }
  | { type: 'SET_AUTHORITY'; authorityId: AuthorityId }
  | { type: 'RECORD_ALLOTMENT'; optionId: string | null }
  | { type: 'START_NEXT_ROUND' }
  | { type: 'RESET' }

let activitySeq = 0
let operationSeq = 0

function nextOperationToken(): number {
  operationSeq += 1
  return operationSeq
}

function activityId(): string {
  activitySeq += 1
  return `act-${activitySeq}`
}

function resolutionKindFor(conflict: Conflict, action: ConflictAction): ResolutionKind {
  switch (action.kind) {
    case 'KEEP':
      return 'OVERRIDDEN'
    case 'ACKNOWLEDGE':
      return conflict.severity === 'WARNING' ? 'OVERRIDDEN' : 'ACKNOWLEDGED'
    default:
      return 'FIXED'
  }
}

function applyConflictAction(state: AppState, conflict: Conflict, action: ConflictAction, reason?: string): AppState {
  if (!state.audit) return state
  if (action.id === 'coverage:review-constraints') {
    return {
      ...state,
      step: 'profile',
      announcement: 'Review your limits, then re-audit after making a change.',
    }
  }
  let items = state.items
  let profile = state.profile
  let step = state.step
  let detail = action.effect

  switch (action.kind) {
    case 'REMOVE_OPTION':
    case 'DEDUPE': {
      const id = action.target?.itemId
      if (id) {
        const removed = items.find((it) => it.itemId === id)
        items = renumber(items.filter((it) => it.itemId !== id))
        detail = removed
          ? `Removed ${removed.option.collegeShort} · ${removed.option.branch} from the list.`
          : detail
      }
      break
    }

    case 'SWAP': {
      const a = action.target?.itemId
      const b = action.target?.withItemId
      if (a && b) {
        const ia = items.findIndex((it) => it.itemId === a)
        const ib = items.findIndex((it) => it.itemId === b)
        if (ia >= 0 && ib >= 0) {
          const next = [...items]
          next[ia] = { ...items[ib], manuallyPlaced: true }
          next[ib] = { ...items[ia], manuallyPlaced: true }
          items = renumber(next)
          detail = `Swapped ${state.items[ia].option.collegeShort} · ${state.items[ia].option.branch} and ${state.items[ib].option.collegeShort} · ${state.items[ib].option.branch}.`
        }
      }
      break
    }

    case 'CHANGE_CONSTRAINT': {
      const { constraint, newValue, exclusionId } = action.target ?? {}
      if (constraint && newValue != null) {
        profile = { ...profile, [constraint]: { ...profile[constraint], value: newValue } }
        detail = `${constraint === 'budget' ? 'Budget' : 'Distance'} limit changed to ${newValue}.`
      } else if (exclusionId) {
        const dropped = profile.hardExclusions.find((ex) => ex.id === exclusionId)
        profile = {
          ...profile,
          hardExclusions: profile.hardExclusions.filter((ex) => ex.id !== exclusionId),
        }
        detail = dropped ? `Removed the exclusion "${dropped.label}".` : detail
      } else {
        step = 'profile'
      }
      break
    }

    case 'CONVERT_TO_SOFT': {
      const constraint = action.target?.constraint
      if (constraint) {
        profile = { ...profile, [constraint]: { ...profile[constraint], mode: 'soft' } }
        detail = `${constraint === 'budget' ? 'Budget' : 'Distance'} is now a soft preference: it ranks options instead of blocking them.`
      }
      break
    }

    case 'MOVE':
    case 'KEEP':
    case 'ACKNOWLEDGE':
    default:
      break
  }

  const kind = resolutionKindFor(conflict, action)
  const resolution: Resolution = {
    conflictId: conflict.id,
    code: conflict.code,
    severity: conflict.severity,
    kind,
    actionLabel: action.label,
    reason,
    atAuditRun: state.audit.runId,
  }

  const entry: ActivityEntry = {
    id: activityId(),
    tone: kind === 'FIXED' ? 'fixed' : 'overridden',
    label: `${conflict.code} · ${action.label}`,
    detail,
    reason,
  }

  return {
    ...state,
    step,
    items,
    profile,

    resolutions: [...state.resolutions.filter((r) => r.conflictId !== conflict.id), resolution],
    activity: [entry, ...state.activity],
    auditStale: true,
    busy: null,
    activeOperationToken: null,
    error: null,
    announcement: `${action.label} applied. Re-audit to confirm the list is clean.`,
  }
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STEP':
      if (state.lock && !['strategy', 'conflicts', 'locked'].includes(action.step)) {
        return state
      }
      return { ...state, step: action.step }

    case 'PATCH_PROFILE': {
      if (state.lock) return state
      const profile = { ...state.profile, ...action.patch }

      return {
        ...state,
        profile,
        busy: null,
        activeOperationToken: null,
        error: null,
        auditStale: state.audit ? true : state.auditStale,
      }
    }

    case 'LOAD_DEMO_PROFILE':
      if (state.lock) return state
      return {
        ...state,
        authorityId: DEFAULT_AUTHORITY,
        currentRound: 1,
        history: [],
        allottedOptionId: null,
        profile: DEMO_PROFILE,
        items: [],
        audit: null,
        resolutions: [],
        activity: [],
        lock: null,
        busy: null,
        activeOperationToken: null,
        auditStale: false,
        error: null,
        announcement: 'UPTAC sample candidate loaded.',
      }

    case 'BUSY':
      if (state.lock) return state
      return {
        ...state,
        busy: action.busy,
        activeOperationToken: action.token,
        error: null,
      }

    case 'GENERATED': {
      if (state.lock || state.activeOperationToken !== action.token) return state
      const { items, audit } = action.response
      return {
        ...state,
        items,
        audit,
        resolutions: [],
        activity: [
          {
            id: activityId(),
            tone: 'proposed',
            label: 'Strategy generated',
            detail: `${items.length} options ordered by your declared preferences. ${audit.counts.CRITICAL} critical, ${audit.counts.WARNING} warning, ${audit.counts.INFO} info.`,
          },
        ],
        busy: null,
        activeOperationToken: null,
        auditStale: false,
        step: 'strategy',
        announcement: `Strategy ready with ${audit.conflicts.length} conflicts found.`,
      }
    }

    case 'AUDITED':
      if (state.lock || state.activeOperationToken !== action.token) return state
      return {
        ...state,
        audit: action.audit,
        busy: null,
        activeOperationToken: null,
        auditStale: false,
        activity: [
          {
            id: activityId(),
            tone: 'audited',
            label: `Re-audit #${action.audit.runId}`,
            detail: `${action.audit.counts.CRITICAL} critical, ${action.audit.counts.WARNING} warning, ${action.audit.counts.INFO} info.`,
          },
          ...state.activity,
        ],
        announcement: action.audit.canLock
          ? 'Re-audit complete. No unresolved blocking conflicts: you can lock the list.'
          : `Re-audit complete. ${action.audit.counts.CRITICAL} critical and ${action.audit.counts.WARNING} warning conflicts still need a decision.`,
      }

    case 'APPLY_ACTION':
      if (state.lock) return state
      return applyConflictAction(state, action.conflict, action.action, action.reason)

    case 'MOVE_ITEM': {
      if (state.lock) return state
      const index = state.items.findIndex((it) => it.itemId === action.itemId)
      const target = index + action.direction
      if (index < 0 || target < 0 || target >= state.items.length) return state
      const next = [...state.items]
      next[index] = { ...state.items[target], manuallyPlaced: true }
      next[target] = { ...state.items[index], manuallyPlaced: true }
      const moved = state.items[index]
      return {
        ...state,
        items: renumber(next),
        auditStale: true,
        busy: null,
        activeOperationToken: null,
        error: null,
        activity: [
          {
            id: activityId(),
            tone: 'fixed',
            label: 'Manual reorder',
            detail: `Moved ${moved.option.collegeShort} · ${moved.option.branch} to position ${target + 1}.`,
          },
          ...state.activity,
        ],
        announcement: `${moved.option.collegeShort} moved to position ${target + 1}. Re-audit to re-check.`,
      }
    }

    case 'REMOVE_ITEM': {
      if (state.lock) return state
      const removed = state.items.find((it) => it.itemId === action.itemId)
      if (!removed) return state
      return {
        ...state,
        items: renumber(state.items.filter((it) => it.itemId !== action.itemId)),
        auditStale: true,
        busy: null,
        activeOperationToken: null,
        error: null,
        activity: [
          {
            id: activityId(),
            tone: 'fixed',
            label: 'Option removed',
            detail: `Removed ${removed.option.collegeShort} · ${removed.option.branch}.`,
          },
          ...state.activity,
        ],
        announcement: `${removed.option.collegeShort} removed. Re-audit to re-check.`,
      }
    }

    case 'LOCKED':
      if (state.lock || state.activeOperationToken !== action.token) return state
      return {
        ...state,
        lock: action.lock,
        busy: null,
        activeOperationToken: null,
        step: 'locked',
        activity: [
          {
            id: activityId(),
            tone: 'locked',
            label: 'Strategy locked',
            detail: `Snapshot ${action.lock.snapshotId}: ${action.lock.itemOrder.length} options.`,
          },
          ...state.activity,
        ],
        announcement: 'Strategy locked.',
      }

    case 'FAILED':
      if (state.activeOperationToken !== action.token) return state
      return {
        ...state,
        busy: null,
        activeOperationToken: null,
        error: action.error,
        announcement: action.error.error.message,
      }

    case 'SET_AUTHORITY': {
      if (state.lock) return state
      if (state.authorityId === action.authorityId) return state
      const authority = AUTHORITIES[action.authorityId]
      const category =
        state.profile.category && authority.categories.includes(state.profile.category)
          ? state.profile.category
          : null
      const subQuotas = state.profile.subQuotas.filter((quota) =>
        authority.subQuotas.includes(quota),
      )

      return {
        ...state,
        authorityId: action.authorityId,
        profile: {
          ...state.profile,
          rank: null,
          rankType: 'CRL',
          category,
          domicile: null,
          subQuotas,
        },
        currentRound: 1,
        history: [],
        allottedOptionId: null,
        items: [],
        audit: null,
        resolutions: [],
        lock: null,
        activity: [],
        busy: null,
        activeOperationToken: null,
        error: null,
        auditStale: false,
        announcement: `Switched to ${AUTHORITIES[action.authorityId].label}. Enter its rank and confirm your ${authority.region.label.toLowerCase()}.`,
      }
    }

    case 'RECORD_ALLOTMENT': {
      if (!state.lock) return state
      const held = state.items.find((it) => it.option.id === action.optionId)
      if (action.optionId && !held) {
        return {
          ...state,
          announcement: 'That seat is not part of this locked preference list.',
        }
      }
      return {
        ...state,
        allottedOptionId: action.optionId,
        announcement: held
          ? `Recorded ${labelFor(held)} as your round ${state.currentRound} seat.`
          : 'Recorded that you were not allotted a seat.',
      }
    }

    case 'START_NEXT_ROUND': {
      if (!state.lock || state.currentRound >= AUTHORITIES[state.authorityId].rounds) {
        return state
      }
      const next = improvementsOver(state.items, state.allottedOptionId)
      if (next.exhausted) {
        return {
          ...state,
          announcement: 'No option ranks above the seat you already hold, so there is nothing to float for.',
        }
      }
      const record: RoundRecord = {
        round: state.currentRound,
        items: state.items,
        snapshotId: state.lock?.snapshotId ?? null,
        allottedOptionId: state.allottedOptionId,
        allottedLabel: (() => {
          const held = state.items.find((it) => it.option.id === state.allottedOptionId)
          return held ? labelFor(held) : null
        })(),
      }
      return {
        ...state,
        history: [...state.history, record],
        currentRound: state.currentRound + 1,
        items: next.items,
        audit: null,
        resolutions: [],
        lock: null,
        allottedOptionId: null,
        busy: null,
        activeOperationToken: null,
        error: null,
        auditStale: true,
        step: 'strategy',
        activity: [
          {
            id: activityId(),
            tone: 'proposed',
            label: `Round ${state.currentRound + 1} list drafted`,
            detail: next.exhausted
              ? 'Nothing on your list beats the seat you already hold. Freezing is the rational move.'
              : `${next.items.length} option${next.items.length > 1 ? 's' : ''} you prefer over ${record.allottedLabel ?? 'your current position'}. ${next.droppedCount} dropped as no better than what you hold.`,
          },
          ...state.activity,
        ],
        announcement: next.exhausted
          ? 'No option beats your current seat. Consider freezing.'
          : `Round ${state.currentRound + 1} list ready with ${next.items.length} improvements.`,
      }
    }

    case 'RESET':
      return {
        ...INITIAL_STATE,
        profile: {
          ...DEFAULT_PROFILE,
          budget: { ...DEFAULT_PROFILE.budget },
          distance: { ...DEFAULT_PROFILE.distance },
          branchPriority: [...DEFAULT_PROFILE.branchPriority],
          hardExclusions: [],
          subQuotas: [],
          factorWeights: { ...DEFAULT_PROFILE.factorWeights },
        },
      }

    default:
      return state
  }
}

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used inside <AppProvider>')
  return ctx
}

function useDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useAppDispatch must be used inside <AppProvider>')
  return ctx
}

export function useAppActions() {
  const state = useAppState()
  const dispatch = useDispatch()

  const goTo = useCallback((step: Step) => dispatch({ type: 'SET_STEP', step }), [dispatch])

  const patchProfile = useCallback(
    (patch: Partial<CandidateProfile>) => dispatch({ type: 'PATCH_PROFILE', patch }),
    [dispatch],
  )

  const loadDemoProfile = useCallback(() => dispatch({ type: 'LOAD_DEMO_PROFILE' }), [dispatch])

  const performGenerate = useCallback(
    async (profile: CandidateProfile) => {
      if (state.lock) return
      const token = nextOperationToken()
      dispatch({ type: 'BUSY', busy: 'generate', token })
      try {
        const set = latestSetFor(state.authorityId)
        const response = await api.generateStrategy(profile, {
          authority: state.authorityId,
          year: set?.year ?? CUTOFF_YEAR,
          round: set ? set.round : state.currentRound,
        })
        dispatch({ type: 'GENERATED', response, token })
      } catch (cause) {
        dispatch({ type: 'FAILED', error: toApiError(cause), token })
      }
    },
    [dispatch, state.authorityId, state.currentRound, state.lock],
  )

  const generate = useCallback(() => performGenerate(state.profile), [performGenerate, state.profile])

  const generateForProfile = useCallback(
    (profile: CandidateProfile) => performGenerate(profile),
    [performGenerate],
  )

  const reaudit = useCallback(async () => {
    if (state.lock || state.items.length === 0 || !state.auditStale) return
    const token = nextOperationToken()
    dispatch({ type: 'BUSY', busy: 'audit', token })
    try {
      const audit = await api.auditStrategy(
        state.profile,
        state.items,
        state.resolutions,
        state.audit?.runId ?? 0,
      )
      dispatch({ type: 'AUDITED', audit, token })
    } catch (cause) {
      dispatch({ type: 'FAILED', error: toApiError(cause), token })
    }
  }, [dispatch, state.profile, state.items, state.resolutions, state.audit, state.auditStale, state.lock])

  const lock = useCallback(async () => {
    if (
      state.items.length === 0 ||
      !state.audit ||
      state.auditStale ||
      !state.audit.canLock ||
      state.lock
    ) return
    const token = nextOperationToken()
    dispatch({ type: 'BUSY', busy: 'lock', token })
    try {
      const set = latestSetFor(state.authorityId)
      const response = await api.lockStrategy(
        state.profile,
        state.items,
        state.resolutions,
        state.audit,
        {
          authority: state.authorityId,
          year: set?.year ?? CUTOFF_YEAR,
          round: set ? set.round : state.currentRound,
        },
      )
      dispatch({ type: 'LOCKED', lock: response.snapshot, token })
    } catch (cause) {
      dispatch({ type: 'FAILED', error: toApiError(cause), token })
    }
  }, [
    dispatch,
    state.profile,
    state.items,
    state.resolutions,
    state.audit,
    state.auditStale,
    state.lock,
    state.authorityId,
    state.currentRound,
  ])

  const applyAction = useCallback(
    (conflict: Conflict, action: ConflictAction, reason?: string) =>
      dispatch({ type: 'APPLY_ACTION', conflict, action, reason }),
    [dispatch],
  )

  const moveItem = useCallback(
    (itemId: string, direction: -1 | 1) => dispatch({ type: 'MOVE_ITEM', itemId, direction }),
    [dispatch],
  )

  const removeItem = useCallback(
    (itemId: string) => dispatch({ type: 'REMOVE_ITEM', itemId }),
    [dispatch],
  )

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch])

  const setAuthority = useCallback(
    (authorityId: AuthorityId) => dispatch({ type: 'SET_AUTHORITY', authorityId }),
    [dispatch],
  )

  const recordAllotment = useCallback(
    (optionId: string | null) => dispatch({ type: 'RECORD_ALLOTMENT', optionId }),
    [dispatch],
  )

  const startNextRound = useCallback(() => dispatch({ type: 'START_NEXT_ROUND' }), [dispatch])

  return useMemo(
    () => ({
      goTo,
      patchProfile,
      loadDemoProfile,
      setAuthority,
      recordAllotment,
      startNextRound,
      generate,
      generateForProfile,
      reaudit,
      lock,
      applyAction,
      moveItem,
      removeItem,
      reset,
    }),
    [
      goTo,
      patchProfile,
      loadDemoProfile,
      setAuthority,
      recordAllotment,
      startNextRound,
      generate,
      generateForProfile,
      reaudit,
      lock,
      applyAction,
      moveItem,
      removeItem,
      reset,
    ],
  )
}

export function useResolutionMap(): Record<string, Resolution> {
  const { resolutions } = useAppState()
  return useMemo(
    () => Object.fromEntries(resolutions.map((r) => [r.conflictId, r])),
    [resolutions],
  )
}
