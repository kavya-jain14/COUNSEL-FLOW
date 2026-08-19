import * as z from 'zod'
import {
  contractVersionSchema,
  identifierSchema,
  nonEmptyTextSchema,
  requestIdSchema,
  revisionSchema,
} from './common.js'
import { candidateProfileSchema } from './profile.js'
import { strategyItemsSchema } from './strategy.js'

export const conflictCodeSchema = z.enum([
  'CF-01',
  'CF-02',
  'CF-03',
  'CF-04',
  'CF-05',
  'CF-06',
  'CF-07',
  'CF-08',
])
export const severitySchema = z.enum(['CRITICAL', 'WARNING', 'INFO'])
export const conflictActionKindSchema = z.enum([
  'REMOVE_OPTION',
  'CHANGE_CONSTRAINT',
  'CONVERT_TO_SOFT',
  'SWAP',
  'MOVE',
  'DEDUPE',
  'KEEP',
  'ACKNOWLEDGE',
])

export const conflictActionTargetSchema = z.strictObject({
  itemId: identifierSchema.optional(),
  withItemId: identifierSchema.optional(),
  constraint: z.enum(['budget', 'distance']).optional(),
  newValue: z.number().int().positive().optional(),
  exclusionId: identifierSchema.optional(),
})

export const conflictActionSchema = z
  .strictObject({
    id: identifierSchema,
    kind: conflictActionKindSchema,
    label: z.string().trim().min(1).max(180),
    effect: nonEmptyTextSchema,
    intent: z.enum(['primary', 'secondary']),
    requiresReason: z.boolean().optional(),
    target: conflictActionTargetSchema.optional(),
  })
  .superRefine((action, ctx) => {
    const target = action.target
    const requireTarget = (field: keyof NonNullable<typeof target>) => {
      if (!target?.[field]) {
        ctx.addIssue({
          code: 'custom',
          path: ['target', field],
          message: `${action.kind} requires target.${field}.`,
        })
      }
    }

    if (['REMOVE_OPTION', 'MOVE', 'DEDUPE'].includes(action.kind)) requireTarget('itemId')
    if (action.kind === 'SWAP') {
      requireTarget('itemId')
      requireTarget('withItemId')
      if (target?.itemId && target.itemId === target.withItemId) {
        ctx.addIssue({
          code: 'custom',
          path: ['target', 'withItemId'],
          message: 'A swap requires two different items.',
        })
      }
    }
    if (action.kind === 'CONVERT_TO_SOFT') requireTarget('constraint')
    if (action.kind === 'KEEP' && action.requiresReason !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['requiresReason'],
        message: 'Keeping a flagged option requires a written reason.',
      })
    }
    if (
      action.kind === 'CHANGE_CONSTRAINT' &&
      !(target?.exclusionId || (target?.constraint && target.newValue != null))
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: 'CHANGE_CONSTRAINT requires an exclusion id or a constraint and new value.',
      })
    }
  })

export const conflictSchema = z
  .strictObject({
    id: identifierSchema,
    code: conflictCodeSchema,
    severity: severitySchema,
    title: z.string().trim().min(1).max(180),
    summary: nonEmptyTextSchema,
    evidence: z.array(nonEmptyTextSchema).min(1).max(20),
    causedBy: nonEmptyTextSchema,
    itemIds: z.array(identifierSchema).max(100),
    actions: z.array(conflictActionSchema).min(1).max(20),
  })
  .superRefine((conflict, ctx) => {
    const itemIds = new Set<string>()
    conflict.itemIds.forEach((itemId, index) => {
      if (itemIds.has(itemId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['itemIds', index],
          message: `Duplicate conflict item id ${itemId}.`,
        })
      }
      itemIds.add(itemId)
    })

    const actionIds = new Set<string>()
    conflict.actions.forEach((action, index) => {
      if (actionIds.has(action.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['actions', index, 'id'],
          message: `Duplicate conflict action id ${action.id}.`,
        })
      }
      actionIds.add(action.id)

      if (
        conflict.severity === 'WARNING' &&
        ['KEEP', 'ACKNOWLEDGE'].includes(action.kind) &&
        action.requiresReason !== true
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['actions', index, 'requiresReason'],
          message: 'Accepting a warning requires a written reason.',
        })
      }
    })
  })

export const conflictsSchema = z
  .array(conflictSchema)
  .max(500)
  .superRefine((conflicts, ctx) => {
    const ids = new Set<string>()
    conflicts.forEach((conflict, index) => {
      if (ids.has(conflict.id)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `Duplicate conflict id ${conflict.id}.`,
        })
      }
      ids.add(conflict.id)
    })
  })

export const resolutionKindSchema = z.enum(['FIXED', 'OVERRIDDEN', 'ACKNOWLEDGED'])
export const resolutionSchema = z
  .strictObject({
    conflictId: identifierSchema,
    code: conflictCodeSchema,
    severity: severitySchema,
    kind: resolutionKindSchema,
    actionLabel: z.string().trim().min(1).max(180),
    reason: z.string().trim().min(3).max(1_000).optional(),
    atAuditRun: z.number().int().positive(),
  })
  .superRefine((resolution, ctx) => {
    if (resolution.kind === 'OVERRIDDEN' && !resolution.reason) {
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Overrides require a written reason.',
      })
    }
    if (resolution.kind === 'ACKNOWLEDGED' && resolution.severity !== 'INFO') {
      ctx.addIssue({
        code: 'custom',
        path: ['kind'],
        message: 'Only informational conflicts may be acknowledged without a fix or override.',
      })
    }
  })

export const resolutionsSchema = z
  .array(resolutionSchema)
  .max(500)
  .superRefine((resolutions, ctx) => {
    const ids = new Set<string>()
    resolutions.forEach((resolution, index) => {
      if (ids.has(resolution.conflictId)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'conflictId'],
          message: `Conflict ${resolution.conflictId} has more than one active resolution.`,
        })
      }
      ids.add(resolution.conflictId)
    })
  })

export const warningOverrideSchema = resolutionSchema.refine(
  (resolution) => resolution.severity === 'WARNING' && resolution.kind === 'OVERRIDDEN',
  { message: 'Snapshot warning decisions must be overridden WARNING resolutions.' },
)

export const warningOverridesSchema = z
  .array(warningOverrideSchema)
  .max(500)
  .superRefine((resolutions, ctx) => {
    const ids = new Set<string>()
    resolutions.forEach((resolution, index) => {
      if (ids.has(resolution.conflictId)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'conflictId'],
          message: `Warning ${resolution.conflictId} appears more than once in the snapshot.`,
        })
      }
      ids.add(resolution.conflictId)
    })
  })

export const conflictCountsSchema = z.strictObject({
  CRITICAL: z.number().int().nonnegative(),
  WARNING: z.number().int().nonnegative(),
  INFO: z.number().int().nonnegative(),
})

export const auditResultSchema = z
  .strictObject({
    runId: z.number().int().positive(),
    profileRevision: revisionSchema,
    listRevision: revisionSchema,
    conflicts: conflictsSchema,
    counts: conflictCountsSchema,
    canLock: z.boolean(),
  })
  .superRefine((audit, ctx) => {
    const actual = { CRITICAL: 0, WARNING: 0, INFO: 0 }
    audit.conflicts.forEach((conflict) => {
      actual[conflict.severity] += 1
    })

    for (const severity of severitySchema.options) {
      if (audit.counts[severity] !== actual[severity]) {
        ctx.addIssue({
          code: 'custom',
          path: ['counts', severity],
          message: `Count must match ${actual[severity]} visible ${severity} conflicts.`,
        })
      }
    }

    const expectedCanLock = actual.CRITICAL === 0 && actual.WARNING === 0
    if (audit.canLock !== expectedCanLock) {
      ctx.addIssue({
        code: 'custom',
        path: ['canLock'],
        message: `canLock must be ${expectedCanLock} while critical or warning conflicts remain unresolved.`,
      })
    }
  })

export const auditStrategyRequestSchema = z
  .strictObject({
    contractVersion: contractVersionSchema,
    requestId: requestIdSchema,
    profileRevision: revisionSchema,
    listRevision: revisionSchema,
    previousRunId: z.number().int().nonnegative(),
    profile: candidateProfileSchema,
    items: strategyItemsSchema,
    resolutions: resolutionsSchema,
  })
  .superRefine((request, ctx) => {
    request.resolutions.forEach((resolution, index) => {
      if (resolution.atAuditRun > request.previousRunId) {
        ctx.addIssue({
          code: 'custom',
          path: ['resolutions', index, 'atAuditRun'],
          message: 'A resolution cannot reference a future audit run.',
        })
      }
    })
  })

export const auditStrategyResponseSchema = z.strictObject({
  contractVersion: contractVersionSchema,
  requestId: requestIdSchema,
  audit: auditResultSchema,
})

export type ConflictCode = z.infer<typeof conflictCodeSchema>
export type Severity = z.infer<typeof severitySchema>
export type ConflictActionKind = z.infer<typeof conflictActionKindSchema>
export type ConflictAction = z.infer<typeof conflictActionSchema>
export type Conflict = z.infer<typeof conflictSchema>
export type Conflicts = z.infer<typeof conflictsSchema>
export type ResolutionKind = z.infer<typeof resolutionKindSchema>
export type Resolution = z.infer<typeof resolutionSchema>
export type Resolutions = z.infer<typeof resolutionsSchema>
export type WarningOverride = z.infer<typeof warningOverrideSchema>
export type WarningOverrides = z.infer<typeof warningOverridesSchema>
export type ConflictCounts = z.infer<typeof conflictCountsSchema>
export type AuditResult = z.infer<typeof auditResultSchema>
export type AuditStrategyRequest = z.infer<typeof auditStrategyRequestSchema>
export type AuditStrategyResponse = z.infer<typeof auditStrategyResponseSchema>
