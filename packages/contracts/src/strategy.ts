import * as z from 'zod'
import { identifierSchema, nonEmptyTextSchema } from './common.js'
import { instituteTypeSchema } from './profile.js'

export const tierSchema = z.enum(['DREAM', 'TARGET', 'SAFE', 'UNKNOWN'])
export const confidenceSchema = z.enum(['high', 'medium', 'low'])
export const reasonPolaritySchema = z.enum(['positive', 'negative', 'neutral'])
export const missingFactSchema = z.enum([
  'annualFee',
  'distanceKm',
  'hostelAvailable',
  'placementScore',
  'campusScore',
  'closingRank',
])

export const collegeOptionSchema = z
  .strictObject({
    id: identifierSchema,
    college: nonEmptyTextSchema,
    collegeShort: z.string().trim().min(1).max(120),
    branch: z.string().trim().min(1).max(40),
    instituteType: instituteTypeSchema,
    city: z.string().trim().min(1).max(120),
    annualFee: z.number().int().min(0).max(2_000_000).nullable(),
    distanceKm: z.number().min(0).max(10_000).nullable(),
    hostelAvailable: z.boolean().nullable(),
    placementScore: z.number().min(0).max(100).nullable(),
    campusScore: z.number().min(0).max(100).nullable(),
    closingRank: z.number().int().min(1).max(10_000_000).nullable(),
    sourceLabel: z.string().trim().min(1).max(240),
    sourceYear: z.number().int().min(2000).max(2100),
    sourceUrl: z.string().url().optional(),
    missingFacts: z
      .array(missingFactSchema)
      .max(6)
      .refine((facts) => new Set(facts).size === facts.length, 'Missing facts must be unique.'),
  })
  .superRefine((option, ctx) => {
    const declaredMissing = new Set(option.missingFacts)
    missingFactSchema.options.forEach((field) => {
      const valueIsMissing = option[field] == null
      const factIsDeclaredMissing = declaredMissing.has(field)
      if (valueIsMissing !== factIsDeclaredMissing) {
        ctx.addIssue({
          code: 'custom',
          path: ['missingFacts'],
          message: `${field} must be listed exactly when its value is null.`,
        })
      }
    })
  })

export const reasonFactSchema = z.strictObject({
  code: identifierSchema,
  label: z.string().trim().min(1).max(160),
  detail: nonEmptyTextSchema,
  polarity: reasonPolaritySchema,
})

export const strategyItemSchema = z.strictObject({
  itemId: identifierSchema,
  option: collegeOptionSchema,
  tier: tierSchema,
  position: z.number().int().min(1).max(100),
  reasons: z.array(reasonFactSchema).min(1).max(20),
  confidence: confidenceSchema,
  manuallyPlaced: z.boolean(),
})

export const strategyItemsSchema = z
  .array(strategyItemSchema)
  .min(1)
  .max(100)
  .superRefine((items, ctx) => {
    const ids = new Set<string>()
    items.forEach((item, index) => {
      if (ids.has(item.itemId)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'itemId'],
          message: `Duplicate strategy item id ${item.itemId}.`,
        })
      }
      ids.add(item.itemId)

      if (item.position !== index + 1) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'position'],
          message: `Position must be ${index + 1} for this array index.`,
        })
      }
    })
  })

export type Tier = z.infer<typeof tierSchema>
export type Confidence = z.infer<typeof confidenceSchema>
export type MissingFact = z.infer<typeof missingFactSchema>
export type CollegeOption = z.infer<typeof collegeOptionSchema>
export type ReasonFact = z.infer<typeof reasonFactSchema>
export type StrategyItem = z.infer<typeof strategyItemSchema>
