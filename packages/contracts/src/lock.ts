import * as z from 'zod'
import {
  contractVersionSchema,
  identifierSchema,
  isoTimestampSchema,
  requestIdSchema,
  revisionSchema,
  versionLabelSchema,
} from './common.js'
import { auditResultSchema, resolutionsSchema, warningOverridesSchema } from './audit.js'
import { candidateProfileSchema } from './profile.js'
import { strategyItemsSchema } from './strategy.js'

export const lockStrategyRequestSchema = z
  .strictObject({
    contractVersion: contractVersionSchema,
    requestId: requestIdSchema,
    profileRevision: revisionSchema,
    listRevision: revisionSchema,
    profile: candidateProfileSchema,
    items: strategyItemsSchema,
    resolutions: resolutionsSchema,
    audit: auditResultSchema,
  })
  .superRefine((request, ctx) => {
    if (request.audit.profileRevision !== request.profileRevision) {
      ctx.addIssue({
        code: 'custom',
        path: ['audit', 'profileRevision'],
        message: 'Audit is stale for the current profile revision.',
      })
    }
    if (request.audit.listRevision !== request.listRevision) {
      ctx.addIssue({
        code: 'custom',
        path: ['audit', 'listRevision'],
        message: 'Audit is stale for the current list revision.',
      })
    }
    if (
      !request.audit.canLock ||
      request.audit.counts.CRITICAL > 0 ||
      request.audit.counts.WARNING > 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['audit', 'canLock'],
        message: 'Critical and warning conflicts must be resolved before locking.',
      })
    }

    const itemIds = new Set(request.items.map((item) => item.itemId))
    request.audit.conflicts.forEach((conflict, conflictIndex) => {
      conflict.itemIds.forEach((itemId, itemIndex) => {
        if (!itemIds.has(itemId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['audit', 'conflicts', conflictIndex, 'itemIds', itemIndex],
            message: `Audit references missing strategy item ${itemId}.`,
          })
        }
      })
    })

    request.resolutions.forEach((resolution, index) => {
      if (resolution.atAuditRun > request.audit.runId) {
        ctx.addIssue({
          code: 'custom',
          path: ['resolutions', index, 'atAuditRun'],
          message: 'A resolution cannot reference a future audit run.',
        })
      }
    })
  })

export const lockedStrategySnapshotSchema = z.strictObject({
  locked: z.literal(true),
  snapshotId: identifierSchema,
  lockedAt: isoTimestampSchema,
  profileRevision: revisionSchema,
  listRevision: revisionSchema,
  datasetVersion: versionLabelSchema,
  engineVersion: versionLabelSchema,
  auditRunId: z.number().int().positive(),
  acknowledgedWarnings: warningOverridesSchema,
  itemOrder: z
    .array(identifierSchema)
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, 'Snapshot item order must be unique.'),
})

export const lockStrategyResponseSchema = z.strictObject({
  contractVersion: contractVersionSchema,
  requestId: requestIdSchema,
  snapshot: lockedStrategySnapshotSchema,
})

export type LockStrategyRequest = z.infer<typeof lockStrategyRequestSchema>
export type LockedStrategySnapshot = z.infer<typeof lockedStrategySnapshotSchema>
export type LockStrategyResponse = z.infer<typeof lockStrategyResponseSchema>
