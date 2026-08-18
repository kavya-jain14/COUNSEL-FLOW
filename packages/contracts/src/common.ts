import * as z from 'zod'

export const CONTRACT_VERSION = '1.0.0' as const

export const contractVersionSchema = z.literal(CONTRACT_VERSION)
export const requestIdSchema = z.string().trim().min(1).max(120)
export const revisionSchema = z.string().trim().min(1).max(120)
export const versionLabelSchema = z.string().trim().min(1).max(120)
export const identifierSchema = z.string().trim().min(1).max(160)
export const nonEmptyTextSchema = z.string().trim().min(1).max(2_000)
export const isoTimestampSchema = z.string().datetime({ offset: true })

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT_STATE_STALE',
  'CRITICAL_CONFLICTS_REMAIN',
  'DATASET_VERSION_UNAVAILABLE',
  'ENGINE_UNAVAILABLE',
  'INTERNAL_ERROR',
])

export const apiErrorEnvelopeSchema = z.strictObject({
  contractVersion: contractVersionSchema,
  requestId: requestIdSchema.optional(),
  error: z.strictObject({
    code: apiErrorCodeSchema,
    message: nonEmptyTextSchema,
    retryable: z.boolean(),
    fieldErrors: z
      .record(z.string().trim().min(1), z.array(nonEmptyTextSchema).min(1))
      .optional(),
  }),
})

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>
