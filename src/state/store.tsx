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
  AuditResult,
  CandidateProfile,
  Conflict,
  ConflictAction,
  LockState,
  Resolution,
  ResolutionKind,
  StrategyItem,
  Step,
} from '../types'
import { DATASET_LABEL, ENGINE_VERSION, PROFILE_VERSION } from '../data/reference'
import { renumber } from '../mock/strategy'
import * as api from '../mock/api'

export interface ActivityEntry {
  id: string
  tone: 'fixed' | 'overridden' | 'audited' | 'locked' | 'proposed'
  label: string
  detail: string
  reason?: string
}

export interface AppState {
  step: Step
  profile: CandidateProfile
  items: StrategyItem[]
  audit: AuditResult | null
  resolutions: Resolution[]
  activity: ActivityEntry[]
  lock: LockState
  busy: null | 'generate' | 'audit' | 'lock'

  auditStale: boolean

  announcement: string
}

export const DEFAULT_PROFILE: CandidateProfile = {
  rank: null,
  rankType: 'CRL',
  category: null,
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
}

const INITIAL_LOCK: LockState = {
  locked: false,
  snapshotId: null,
  profileVersion: PROFILE_VERSION,
  datasetLabel: DATASET_LABEL,
  engineVersion: ENGINE_VERSION,
  acknowledgedWarnings: [],
  itemOrder: [],
}

const INITIAL_STATE: AppState = {
  step: 'landing',
  profile: DEFAULT_PROFILE,
  items: [],
  audit: null,
  resolutions: [],
  activity: [],
  lock: INITIAL_LOCK,
  busy: null,
  auditStale: false,
  announcement: '',
}

type Action =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'PATCH_PROFILE'; patch: Partial<CandidateProfile> }
  | { type: 'LOAD_DEMO_PROFILE' }
  | { type: 'BUSY'; busy: AppState['busy'] }
  | { type: 'GENERATED'; items: StrategyItem[]; audit: AuditResult }
  | { type: 'AUDITED'; audit: AuditResult }
  | { type: 'APPLY_ACTION'; conflict: Conflict; action: ConflictAction; reason?: string }
  | { type: 'MOVE_ITEM'; itemId: string; direction: -1 | 1 }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'LOCKED'; lock: LockState }
  | { type: 'RESET' }

let activitySeq = 0
function activityId(): string {
  activitySeq += 1
  return `act-${activitySeq}`
}

function resolutionKindFor(action: ConflictAction): ResolutionKind {
  switch (action.kind) {
    case 'KEEP':
    case 'CONVERT_TO_SOFT':
      return 'OVERRIDDEN'
    case 'ACKNOWLEDGE':
      return 'ACKNOWLEDGED'
    default:
      return 'FIXED'
  }
}

function applyConflictAction(state: AppState, conflict: Conflict, action: ConflictAction, reason?: string): AppState {
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
        detail = `${constraint === 'budget' ? 'Budget' : 'Distance'} is now a soft preference — it ranks options instead of blocking them.`
      }
      break
    }

    case 'MOVE':
    case 'KEEP':
    case 'ACKNOWLEDGE':
    default:
      break
  }

  const kind = resolutionKindFor(action)
  const resolution: Resolution = {
    conflictId: conflict.id,
    code: conflict.code,
    kind,
    actionLabel: action.label,
    reason,
    atAuditRun: state.audit?.runId ?? 0,
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
    announcement: `${action.label} applied. Re-audit to confirm the list is clean.`,
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'PATCH_PROFILE': {
      const profile = { ...state.profile, ...action.patch }

      return {
        ...state,
        profile,
        auditStale: state.items.length > 0 ? true : state.auditStale,
      }
    }

    case 'LOAD_DEMO_PROFILE':
      return { ...state, profile: DEMO_PROFILE, announcement: 'Sample candidate loaded.' }

    case 'BUSY':
      return { ...state, busy: action.busy }

    case 'GENERATED':
      return {
        ...state,
        items: action.items,
        audit: action.audit,
        resolutions: [],
        activity: [
          {
            id: activityId(),
            tone: 'proposed',
            label: 'Strategy generated',
            detail: `${action.items.length} options ordered by your declared preferences. ${action.audit.counts.CRITICAL} critical, ${action.audit.counts.WARNING} warning, ${action.audit.counts.INFO} info.`,
          },
        ],
        busy: null,
        auditStale: false,
        step: 'strategy',
        announcement: `Strategy ready with ${action.audit.conflicts.length} conflicts found.`,
      }

    case 'AUDITED':
      return {
        ...state,
        audit: action.audit,
        busy: null,
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
        announcement:
          action.audit.counts.CRITICAL === 0
            ? 'Re-audit complete. No critical conflicts left — you can lock the list.'
            : `Re-audit complete. ${action.audit.counts.CRITICAL} critical conflicts still block locking.`,
      }

    case 'APPLY_ACTION':
      return applyConflictAction(state, action.conflict, action.action, action.reason)

    case 'MOVE_ITEM': {
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
      const removed = state.items.find((it) => it.itemId === action.itemId)
      if (!removed) return state
      return {
        ...state,
        items: renumber(state.items.filter((it) => it.itemId !== action.itemId)),
        auditStale: true,
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
      return {
        ...state,
        lock: action.lock,
        busy: null,
        step: 'locked',
        activity: [
          {
            id: activityId(),
            tone: 'locked',
            label: 'Strategy locked',
            detail: `Snapshot ${action.lock.snapshotId} — ${action.lock.itemOrder.length} options.`,
          },
          ...state.activity,
        ],
        announcement: 'Strategy locked.',
      }

    case 'RESET':
      return { ...INITIAL_STATE, profile: DEFAULT_PROFILE }

    default:
      return state
  }
}

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
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

  const generate = useCallback(async () => {
    dispatch({ type: 'BUSY', busy: 'generate' })
    const { items, audit } = await api.generateStrategy(state.profile)
    dispatch({ type: 'GENERATED', items, audit })
  }, [dispatch, state.profile])

  const reaudit = useCallback(async () => {
    dispatch({ type: 'BUSY', busy: 'audit' })
    const audit = await api.auditStrategy(
      state.profile,
      state.items,
      state.resolutions,
      state.audit?.runId ?? 0,
    )
    dispatch({ type: 'AUDITED', audit })
  }, [dispatch, state.profile, state.items, state.resolutions, state.audit])

  const lock = useCallback(async () => {
    dispatch({ type: 'BUSY', busy: 'lock' })
    const lockState = await api.lockStrategy(
      state.items,
      state.resolutions,
      state.audit?.runId ?? 0,
    )
    dispatch({ type: 'LOCKED', lock: lockState })
  }, [dispatch, state.items, state.resolutions, state.audit])

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

  return useMemo(
    () => ({
      goTo,
      patchProfile,
      loadDemoProfile,
      generate,
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
      generate,
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
