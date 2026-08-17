import type {
  AuditResult,
  CandidateProfile,
  LockState,
  Resolution,
  StrategyItem,
} from '../types'
import { DATASET_LABEL, ENGINE_VERSION, PROFILE_VERSION } from '../data/reference'
import { generateMockStrategy } from './strategy'
import { runAudit } from './audit'
import { toPayload } from '../lib/validation'

const LATENCY = 450

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function generateStrategy(
  profile: CandidateProfile,
): Promise<{ items: StrategyItem[]; audit: AuditResult }> {

  void toPayload(profile)

  const items = generateMockStrategy(profile)
  const result = runAudit(profile, items, [])
  return delay({ items, audit: { runId: 1, ...result } })
}

export async function auditStrategy(
  profile: CandidateProfile,
  items: StrategyItem[],
  resolutions: Resolution[],
  previousRunId: number,
): Promise<AuditResult> {
  const result = runAudit(profile, items, resolutions)
  return delay({ runId: previousRunId + 1, ...result }, 550)
}

export async function lockStrategy(
  items: StrategyItem[],
  resolutions: Resolution[],
  runId: number,
): Promise<LockState> {
  return delay({
    locked: true,
    snapshotId: `snap-${PROFILE_VERSION}-${ENGINE_VERSION}-r${runId}`,
    profileVersion: PROFILE_VERSION,
    datasetLabel: DATASET_LABEL,
    engineVersion: ENGINE_VERSION,
    acknowledgedWarnings: resolutions.filter(
      (r) => r.kind === 'OVERRIDDEN' || r.kind === 'ACKNOWLEDGED',
    ),
    itemOrder: items.map((it) => it.itemId),
  })
}
