import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  apiErrorEnvelopeSchema,
  auditStrategyRequestSchema,
  auditStrategyResponseSchema,
  auditResultSchema,
  candidateProfileSchema,
  collegeOptionSchema,
  conflictActionSchema,
  lockStrategyRequestSchema,
  lockStrategyResponseSchema,
  resolutionSchema,
  strategyGenerateRequestSchema,
  strategyGenerateResponseSchema,
} from '../dist/index.js'

const fixtureUrl = (name) => new URL(`../fixtures/${name}`, import.meta.url)
const loadFixture = async (name) => JSON.parse(await readFile(fixtureUrl(name), 'utf8'))

test('accepts a normalized candidate profile fixture', async () => {
  const profile = await loadFixture('profile.valid.json')
  assert.equal(candidateProfileSchema.safeParse(profile).success, true)
})

test('rejects invalid ranges, duplicate priorities, contradictions, and bad weights', async () => {
  const profile = await loadFixture('profile.invalid.json')
  const result = candidateProfileSchema.safeParse(profile)
  assert.equal(result.success, false)
  if (result.success) return

  const paths = result.error.issues.map((issue) => issue.path.join('.'))
  assert(paths.includes('rank'))
  assert(paths.includes('budget.value'))
  assert(paths.includes('distance.value'))
  assert(paths.some((path) => path.startsWith('branchPriority')))
  assert(paths.some((path) => path.startsWith('hardExclusions')))
  assert(paths.includes('factorWeights'))
})

test('rejects unknown profile fields instead of silently stripping them', async () => {
  const profile = await loadFixture('profile.valid.json')
  assert.equal(candidateProfileSchema.safeParse({ ...profile, admissionProbability: 0.92 }).success, false)
})

test('accepts a versioned generated strategy with matching audit revisions', async () => {
  const response = await loadFixture('generate-response.valid.json')
  assert.equal(strategyGenerateResponseSchema.safeParse(response).success, true)
})

test('accepts the generate and re-audit endpoint request shapes', async () => {
  const profile = await loadFixture('profile.valid.json')
  const response = await loadFixture('generate-response.valid.json')
  const metadata = {
    contractVersion: '1.0.0',
    requestId: 'req-demo-002',
    profileRevision: response.profileRevision,
  }

  assert.equal(
    strategyGenerateRequestSchema.safeParse({ ...metadata, profile }).success,
    true,
  )
  assert.equal(
    auditStrategyRequestSchema.safeParse({
      ...metadata,
      listRevision: response.listRevision,
      previousRunId: response.audit.runId,
      profile,
      items: response.items,
      resolutions: [],
    }).success,
    true,
  )
  assert.equal(
    auditStrategyResponseSchema.safeParse({
      contractVersion: '1.0.0',
      requestId: 'req-demo-002',
      audit: response.audit,
    }).success,
    true,
  )
})

test('requires null evidence fields and missingFacts to agree', async () => {
  const response = await loadFixture('generate-response.valid.json')
  const option = response.items[0].option
  assert.equal(collegeOptionSchema.safeParse(option).success, true)
  assert.equal(
    collegeOptionSchema.safeParse({
      ...option,
      annualFee: null,
      missingFacts: [],
    }).success,
    false,
  )
})

test('rejects audit counts that do not match visible conflicts', async () => {
  const response = await loadFixture('generate-response.valid.json')
  const audit = { ...response.audit, counts: { ...response.audit.counts, WARNING: 1 } }
  assert.equal(auditResultSchema.safeParse(audit).success, false)
})

test('blocks locking while a warning still needs a decision', async () => {
  const response = await loadFixture('generate-response.valid.json')
  const warning = {
    id: 'CF-08:item-1',
    code: 'CF-08',
    severity: 'WARNING',
    title: 'Evidence gap',
    summary: 'The option is missing a fee source.',
    evidence: ['Annual fee is not verified.'],
    causedBy: 'Dataset evidence coverage',
    itemIds: ['item-1'],
    actions: [
      {
        id: 'keep-item-1',
        kind: 'KEEP',
        label: 'Keep with reason',
        effect: 'Keeps the option and records the candidate decision.',
        intent: 'primary',
        requiresReason: true,
      },
    ],
  }
  const unresolvedAudit = {
    ...response.audit,
    conflicts: [warning],
    counts: { CRITICAL: 0, WARNING: 1, INFO: 0 },
    canLock: true,
  }

  assert.equal(auditResultSchema.safeParse(unresolvedAudit).success, false)
  assert.equal(
    auditResultSchema.safeParse({ ...unresolvedAudit, canLock: false }).success,
    true,
  )
})

test('rejects swap actions without two distinct target items', () => {
  const result = conflictActionSchema.safeParse({
    id: 'action-swap-1',
    kind: 'SWAP',
    label: 'Swap options',
    effect: 'Switches the two positions.',
    intent: 'primary',
    target: { itemId: 'item-1', withItemId: 'item-1' },
  })
  assert.equal(result.success, false)
})

test('requires a reason flag on keep actions', () => {
  const result = conflictActionSchema.safeParse({
    id: 'keep-item-1',
    kind: 'KEEP',
    label: 'Keep option',
    effect: 'Keeps the flagged option.',
    intent: 'primary',
  })
  assert.equal(result.success, false)
})

test('requires warning acceptance to be an explained override', () => {
  const base = {
    conflictId: 'CF-08:item-1',
    code: 'CF-08',
    severity: 'WARNING',
    actionLabel: 'Keep with low confidence',
    atAuditRun: 1,
  }

  assert.equal(
    resolutionSchema.safeParse({ ...base, kind: 'ACKNOWLEDGED', reason: 'I accept this gap.' })
      .success,
    false,
  )
  assert.equal(
    resolutionSchema.safeParse({ ...base, kind: 'OVERRIDDEN', reason: 'I accept this gap.' })
      .success,
    true,
  )
  assert.equal(resolutionSchema.safeParse({ ...base, kind: 'OVERRIDDEN' }).success, false)
})

test('accepts a lock request only when the audit matches current revisions', async () => {
  const request = await loadFixture('lock-request.valid.json')
  assert.equal(lockStrategyRequestSchema.safeParse(request).success, true)

  const stale = {
    ...request,
    listRevision: 'list-rev-002',
  }
  assert.equal(lockStrategyRequestSchema.safeParse(stale).success, false)
})

test('accepts an immutable lock snapshot response', async () => {
  const response = await loadFixture('lock-response.valid.json')
  assert.equal(lockStrategyResponseSchema.safeParse(response).success, true)
})

test('accepts the stable API error envelope', async () => {
  const error = await loadFixture('error.valid.json')
  assert.equal(apiErrorEnvelopeSchema.safeParse(error).success, true)
})
