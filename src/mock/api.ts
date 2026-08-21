import {
  auditStrategyRequestSchema,
  auditStrategyResponseSchema,
  CONTRACT_VERSION,
  lockStrategyRequestSchema,
  lockStrategyResponseSchema,
  strategyGenerateResponseSchema,
  type AuditResult,
  type LockStrategyResponse,
  type Resolution,
  type StrategyGenerateResponse,
  type StrategyItem,
  type WarningOverride,
} from '@counselflow/contracts'
import type { CandidateProfile } from '../types'
import { DATASET_LABEL, ENGINE_VERSION } from '../data/reference'
import {
  listRevisionFor,
  nextRequestId,
  profileRevisionFor,
  validateContract,
} from '../features/contracts'
import { runStrategyEngine } from './engine'
import { toPayload } from '../lib/validation'
import { runAudit } from './audit'

const LATENCY = 450

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function generateStrategy(
  profile: CandidateProfile,
): Promise<StrategyGenerateResponse> {
  const requestId = nextRequestId('generate')

  const response = validateContract(requestId, () => {
    const profilePayload = toPayload(profile)
    const items = runStrategyEngine(profile)
    const profileRevision = profileRevisionFor(profilePayload)
    const listRevision = listRevisionFor(items)
    const result = runAudit(profile, items, [])

    return strategyGenerateResponseSchema.parse({
      contractVersion: CONTRACT_VERSION,
      requestId,
      profileRevision,
      listRevision,
      datasetVersion: DATASET_LABEL,
      engineVersion: ENGINE_VERSION,
      items,
      audit: {
        runId: 1,
        profileRevision,
        listRevision,
        ...result,
      },
    })
  })

  return delay(response)
}

export async function auditStrategy(
  profile: CandidateProfile,
  items: StrategyItem[],
  resolutions: Resolution[],
  previousRunId: number,
): Promise<AuditResult> {
  const requestId = nextRequestId('audit')

  const response = validateContract(requestId, () => {
    const profilePayload = toPayload(profile)
    const profileRevision = profileRevisionFor(profilePayload)
    const listRevision = listRevisionFor(items)

    auditStrategyRequestSchema.parse({
      contractVersion: CONTRACT_VERSION,
      requestId,
      profileRevision,
      listRevision,
      previousRunId,
      profile: profilePayload,
      items,
      resolutions,
    })

    return auditStrategyResponseSchema.parse({
      contractVersion: CONTRACT_VERSION,
      requestId,
      audit: {
        runId: previousRunId + 1,
        profileRevision,
        listRevision,
        ...runAudit(profile, items, resolutions),
      },
    })
  })

  return delay(response.audit, 550)
}

export async function lockStrategy(
  profile: CandidateProfile,
  items: StrategyItem[],
  resolutions: Resolution[],
  audit: AuditResult,
): Promise<LockStrategyResponse> {
  const requestId = nextRequestId('lock')

  const response = validateContract(requestId, () => {
    const profilePayload = toPayload(profile)
    const profileRevision = profileRevisionFor(profilePayload)
    const listRevision = listRevisionFor(items)

    lockStrategyRequestSchema.parse({
      contractVersion: CONTRACT_VERSION,
      requestId,
      profileRevision,
      listRevision,
      profile: profilePayload,
      items,
      resolutions,
      audit,
    })

    const acknowledgedWarnings = resolutions.filter(
      (resolution): resolution is WarningOverride =>
        resolution.severity === 'WARNING' && resolution.kind === 'OVERRIDDEN',
    )

    return lockStrategyResponseSchema.parse({
      contractVersion: CONTRACT_VERSION,
      requestId,
      snapshot: {
        locked: true,
        snapshotId: `snap-${profileRevision}-${listRevision}-r${audit.runId}`,
        lockedAt: new Date().toISOString(),
        profileRevision,
        listRevision,
        datasetVersion: DATASET_LABEL,
        engineVersion: ENGINE_VERSION,
        auditRunId: audit.runId,
        acknowledgedWarnings,
        itemOrder: items.map((item) => item.itemId),
      },
    })
  })

  return delay(response)
}
