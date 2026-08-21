import * as z from 'zod'
import { identifierSchema } from './common.js'

export const CATEGORY_VALUES = ['GEN', 'EWS', 'OBC', 'SC', 'ST'] as const
export const RANK_TYPE_VALUES = ['CRL', 'CATEGORY'] as const
export const BRANCH_VALUES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AIML', 'CHEM'] as const
export const INSTITUTE_TYPE_VALUES = ['GOVERNMENT', 'AIDED', 'PRIVATE'] as const
export const FACTOR_VALUES = ['placements', 'fees', 'location', 'campus', 'hostel'] as const
export const DOMICILE_VALUES = ['UP', 'OTHER'] as const
export const SUB_QUOTA_VALUES = ['GIRLS', 'ARMED_FORCES', 'PWD', 'FREEDOM_FIGHTER'] as const

export const categorySchema = z.enum(CATEGORY_VALUES)
export const rankTypeSchema = z.enum(RANK_TYPE_VALUES)
export const branchCodeSchema = z.enum(BRANCH_VALUES)
export const instituteTypeSchema = z.enum(INSTITUTE_TYPE_VALUES)
export const factorKeySchema = z.enum(FACTOR_VALUES)
export const constraintModeSchema = z.enum(['hard', 'soft'])
export const domicileSchema = z.enum(DOMICILE_VALUES)
export const subQuotaSchema = z.enum(SUB_QUOTA_VALUES)

export const homeCitySchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .describe(
    'Candidate home city. Every distance is measured from here. The server resolves it against the dataset; an unresolved city yields insufficient distance evidence rather than a guessed number.',
  )

export const subQuotasSchema = z
  .array(subQuotaSchema)
  .max(SUB_QUOTA_VALUES.length)
  .describe(
    'Reservation sub-quotas the candidate claims, beyond the main category. A candidate may hold more than one.',
  )
  .superRefine((quotas, ctx) => {
    const seen = new Set<string>()
    quotas.forEach((quota, index) => {
      if (seen.has(quota)) {
        ctx.addIssue({
          code: 'custom',
          path: [index],
          message: `Sub-quota ${quota} is claimed more than once.`,
        })
      }
      seen.add(quota)
    })
  })

export const budgetConstraintSchema = z.strictObject({
  value: z.number().int().min(20_000).max(600_000),
  mode: constraintModeSchema,
})

export const distanceConstraintSchema = z.strictObject({
  value: z.number().int().min(10).max(2_000),
  mode: constraintModeSchema,
})

export const exclusionIdSchema = identifierSchema.describe(
  'Canonical exclusion key, always `${kind}:${value}`. Referenced by ConflictAction.target.exclusionId.',
)

export function exclusionId(kind: string, value: string): string {
  return `${kind}:${value}`
}

export const hardExclusionSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({
      id: exclusionIdSchema,
      kind: z.literal('branch'),
      value: branchCodeSchema,
    }),
    z.strictObject({
      id: exclusionIdSchema,
      kind: z.literal('instituteType'),
      value: instituteTypeSchema,
    }),
    z.strictObject({
      id: exclusionIdSchema,
      kind: z.literal('location'),
      value: z.string().trim().min(1).max(120),
    }),
    z.strictObject({
      id: exclusionIdSchema,
      kind: z.literal('noHostel'),
      value: z.literal('true'),
    }),
  ])
  .superRefine((exclusion, ctx) => {
    const expected = exclusionId(exclusion.kind, exclusion.value)
    if (exclusion.id !== expected) {
      ctx.addIssue({
        code: 'custom',
        path: ['id'],
        message: `Exclusion id must be "${expected}"; received "${exclusion.id}".`,
      })
    }
  })

export const factorWeightsSchema = z
  .strictObject({
    placements: z.number().min(0).max(1),
    fees: z.number().min(0).max(1),
    location: z.number().min(0).max(1),
    campus: z.number().min(0).max(1),
    hostel: z.number().min(0).max(1),
  })
  .superRefine((weights, ctx) => {
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0)
    if (Math.abs(total - 1) > 0.001) {
      ctx.addIssue({
        code: 'custom',
        message: `Normalized factor weights must sum to 1; received ${total.toFixed(4)}.`,
      })
    }
  })

export const candidateProfileSchema = z
  .strictObject({
    rank: z.number().int().min(1).max(2_000_000),
    rankType: rankTypeSchema,
    category: categorySchema,
    domicile: domicileSchema,
    subQuotas: subQuotasSchema,
    homeCity: homeCitySchema,
    branchPriority: z.array(branchCodeSchema).min(1).max(BRANCH_VALUES.length),
    budget: budgetConstraintSchema,
    distance: distanceConstraintSchema,
    hardExclusions: z.array(hardExclusionSchema).max(30),
    factorWeights: factorWeightsSchema,
  })
  .superRefine((profile, ctx) => {
    const branches = new Set<string>()
    profile.branchPriority.forEach((branch, index) => {
      if (branches.has(branch)) {
        ctx.addIssue({
          code: 'custom',
          path: ['branchPriority', index],
          message: `Branch ${branch} appears more than once.`,
        })
      }
      branches.add(branch)
    })

    const exclusions = new Set<string>()
    profile.hardExclusions.forEach((exclusion, index) => {
      const key = `${exclusion.kind}:${exclusion.value}`
      if (exclusions.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['hardExclusions', index],
          message: 'Duplicate hard exclusion.',
        })
      }
      exclusions.add(key)

      if (exclusion.kind === 'branch' && branches.has(exclusion.value)) {
        ctx.addIssue({
          code: 'custom',
          path: ['hardExclusions', index],
          message: `${exclusion.value} cannot be prioritized and excluded at the same time.`,
        })
      }
    })
  })

export type Domicile = z.infer<typeof domicileSchema>
export type SubQuota = z.infer<typeof subQuotaSchema>
export type Category = z.infer<typeof categorySchema>
export type RankType = z.infer<typeof rankTypeSchema>
export type BranchCode = z.infer<typeof branchCodeSchema>
export type InstituteType = z.infer<typeof instituteTypeSchema>
export type FactorKey = z.infer<typeof factorKeySchema>
export type ConstraintMode = z.infer<typeof constraintModeSchema>
export type HardExclusion = z.infer<typeof hardExclusionSchema>
export type FactorWeights = z.infer<typeof factorWeightsSchema>
export type CandidateProfile = z.infer<typeof candidateProfileSchema>
