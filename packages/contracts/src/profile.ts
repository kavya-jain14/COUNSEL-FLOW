import * as z from 'zod'

export const CATEGORY_VALUES = ['GEN', 'EWS', 'OBC', 'SC', 'ST'] as const
export const RANK_TYPE_VALUES = ['CRL', 'CATEGORY'] as const
export const BRANCH_VALUES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AIML', 'CHEM'] as const
export const INSTITUTE_TYPE_VALUES = ['GOVERNMENT', 'AIDED', 'PRIVATE'] as const
export const FACTOR_VALUES = ['placements', 'fees', 'location', 'campus', 'hostel'] as const

export const categorySchema = z.enum(CATEGORY_VALUES)
export const rankTypeSchema = z.enum(RANK_TYPE_VALUES)
export const branchCodeSchema = z.enum(BRANCH_VALUES)
export const instituteTypeSchema = z.enum(INSTITUTE_TYPE_VALUES)
export const factorKeySchema = z.enum(FACTOR_VALUES)
export const constraintModeSchema = z.enum(['hard', 'soft'])

export const budgetConstraintSchema = z.strictObject({
  value: z.number().int().min(20_000).max(600_000),
  mode: constraintModeSchema,
})

export const distanceConstraintSchema = z.strictObject({
  value: z.number().int().min(10).max(2_000),
  mode: constraintModeSchema,
})

export const hardExclusionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('branch'), value: branchCodeSchema }),
  z.strictObject({ kind: z.literal('instituteType'), value: instituteTypeSchema }),
  z.strictObject({ kind: z.literal('location'), value: z.string().trim().min(1).max(120) }),
  z.strictObject({ kind: z.literal('noHostel'), value: z.literal('true') }),
])

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

export type Category = z.infer<typeof categorySchema>
export type RankType = z.infer<typeof rankTypeSchema>
export type BranchCode = z.infer<typeof branchCodeSchema>
export type InstituteType = z.infer<typeof instituteTypeSchema>
export type FactorKey = z.infer<typeof factorKeySchema>
export type ConstraintMode = z.infer<typeof constraintModeSchema>
export type HardExclusion = z.infer<typeof hardExclusionSchema>
export type FactorWeights = z.infer<typeof factorWeightsSchema>
export type CandidateProfile = z.infer<typeof candidateProfileSchema>
