import * as z from 'zod'
import {
  contractVersionSchema,
  requestIdSchema,
  revisionSchema,
  versionLabelSchema,
} from './common.js'
import { auditResultSchema } from './audit.js'
import { candidateProfileSchema } from './profile.js'
import { strategyItemsSchema } from './strategy.js'

export const strategyGenerateRequestSchema = z.strictObject({
  contractVersion: contractVersionSchema,
  requestId: requestIdSchema,
  profileRevision: revisionSchema,
  profile: candidateProfileSchema,
})

export const strategyGenerateResponseSchema = z
  .strictObject({
    contractVersion: contractVersionSchema,
    requestId: requestIdSchema,
    profileRevision: revisionSchema,
    listRevision: revisionSchema,
    datasetVersion: versionLabelSchema,
    engineVersion: versionLabelSchema,
    items: strategyItemsSchema,
    audit: auditResultSchema,
  })
  .superRefine((response, ctx) => {
    if (response.audit.profileRevision !== response.profileRevision) {
      ctx.addIssue({
        code: 'custom',
        path: ['audit', 'profileRevision'],
        message: 'Generated audit must match the response profile revision.',
      })
    }
    if (response.audit.listRevision !== response.listRevision) {
      ctx.addIssue({
        code: 'custom',
        path: ['audit', 'listRevision'],
        message: 'Generated audit must match the response list revision.',
      })
    }

    const itemIds = new Set(response.items.map((item) => item.itemId))
    response.audit.conflicts.forEach((conflict, conflictIndex) => {
      conflict.itemIds.forEach((itemId, itemIndex) => {
        if (!itemIds.has(itemId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['audit', 'conflicts', conflictIndex, 'itemIds', itemIndex],
            message: `Generated audit references missing strategy item ${itemId}.`,
          })
        }
      })
    })
  })

export type StrategyGenerateRequest = z.infer<typeof strategyGenerateRequestSchema>
export type StrategyGenerateResponse = z.infer<typeof strategyGenerateResponseSchema>
