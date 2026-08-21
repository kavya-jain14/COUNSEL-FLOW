import { z } from "zod";

export const CategorySchema = z.enum(["GEN", "EWS", "OBC", "SC", "ST"]);
export const BranchSchema = z.enum(["CSE", "IT", "ECE", "EEE", "ME", "CE"]);
export const FactorNameSchema = z.enum(["placements", "fees", "location", "campus", "hostel"]);
export const ConstraintModeSchema = z.enum(["hard", "soft"]);
export const ReachabilityBandSchema = z.enum(["DREAM", "TARGET", "SAFE", "INSUFFICIENT_EVIDENCE"]);
export const ConflictCodeSchema = z.enum([
  "CF-01",
  "CF-02",
  "CF-03",
  "CF-04",
  "CF-05",
  "CF-06",
  "CF-07",
  "CF-08"
]);
export const ConflictSeveritySchema = z.enum(["CRITICAL", "WARNING", "INFO"]);

const limitedWeight = z.number().min(0).max(100);

export const CandidateProfileSchema = z
  .object({
    rank: z.object({
      value: z.number().int().positive().max(2_000_000),
      type: z.literal("CRL").default("CRL")
    }),
    category: CategorySchema,
    branchPriorities: z.array(BranchSchema).min(1).max(6).superRefine((branches, ctx) => {
      if (new Set(branches).size !== branches.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Branch priorities cannot contain duplicates." });
      }
    }),
    annualBudget: z
      .object({ amountInr: z.number().int().positive().max(2_000_000), mode: ConstraintModeSchema })
      .optional(),
    maxDistance: z.object({ km: z.number().positive().max(5_000), mode: ConstraintModeSchema }).optional(),
    factorWeights: z
      .object({
        placements: limitedWeight,
        fees: limitedWeight,
        location: limitedWeight,
        campus: limitedWeight,
        hostel: limitedWeight
      })
      .refine((weights) => Object.values(weights).some((weight) => weight > 0), {
        message: "At least one factor weight must be greater than zero."
      }),
    hardConstraints: z.object({
      neverAcceptBranches: z.array(BranchSchema).default([]),
      excludedCities: z.array(z.string().trim().min(1)).default([]),
      excludedInstituteTypes: z.array(z.enum(["GOVERNMENT", "PRIVATE"])) .default([]),
      hostelRequired: z.boolean().default(false)
    })
  })
  .superRefine((profile, ctx) => {
    const banned = new Set(profile.hardConstraints.neverAcceptBranches);
    const selectedBanned = profile.branchPriorities.find((branch) => banned.has(branch));
    if (selectedBanned) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hardConstraints", "neverAcceptBranches"],
        message: `${selectedBanned} cannot be both a priority and a never-accept branch.`
      });
    }
  });

export const FactSourceSchema = z.object({
  sourceLabel: z.string().min(1),
  effectiveYear: z.number().int().min(2000).max(2100),
  url: z.string().url().optional(),
  status: z.enum(["VERIFIED", "MISSING", "STALE", "NOT_COMPARABLE"])
});

export const HistoricalRankSchema = z.object({
  category: CategorySchema,
  closingRank: z.number().int().positive(),
  source: FactSourceSchema
});

export const OptionSchema = z.object({
  canonicalOptionId: z.string().regex(/^[A-Z0-9-]+$/),
  college: z.string().min(1),
  branch: BranchSchema,
  city: z.string().min(1),
  instituteType: z.enum(["GOVERNMENT", "PRIVATE"]),
  annualFeeInr: z.number().int().positive().nullable(),
  distanceKm: z.number().positive().nullable(),
  placementsScore: z.number().min(0).max(100).nullable(),
  campusScore: z.number().min(0).max(100).nullable(),
  hostelAvailable: z.boolean().nullable(),
  eligibleCategories: z.array(CategorySchema).min(1),
  historicalClosingRanks: z.array(HistoricalRankSchema),
  factSources: z.object({
    fees: FactSourceSchema,
    distance: FactSourceSchema,
    placements: FactSourceSchema,
    campus: FactSourceSchema,
    hostel: FactSourceSchema
  })
});

export const ReasonSchema = z.object({
  code: z.string().min(1),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
});

export const StrategyItemSchema = z.object({
  position: z.number().int().positive(),
  option: OptionSchema,
  reachability: ReachabilityBandSchema,
  utility: z.number(),
  normalizedFactors: z.record(z.string(), z.number()),
  reasons: z.array(ReasonSchema),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"])
});

export const ConflictSchema = z.object({
  fingerprint: z.string().min(1),
  code: ConflictCodeSchema,
  severity: ConflictSeveritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  optionIds: z.array(z.string()),
  evidence: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  recommendedAction: z.enum(["MOVE", "REMOVE", "CHANGE_CONSTRAINT", "DEDUPLICATE", "REVIEW_EVIDENCE", "ACKNOWLEDGE"]),
  proposedOrder: z.array(z.string()).optional(),
  lockBlocking: z.boolean(),
  isAcknowledged: z.boolean(),
  overrideNote: z.string().optional()
});

export const AcknowledgementSchema = z.object({
  fingerprint: z.string().min(1),
  note: z.string().trim().min(3).max(500)
});

export const GenerateStrategyRequestSchema = z.object({ profile: CandidateProfileSchema });
export const AuditStrategyRequestSchema = z.object({
  profile: CandidateProfileSchema,
  orderedOptionIds: z.array(z.string().min(1)).min(1).max(100),
  acknowledgements: z.array(AcknowledgementSchema).default([])
});
export const ExplainStrategyRequestSchema = z.object({
  profile: CandidateProfileSchema,
  orderedOptionIds: z.array(z.string().min(1)).min(1).max(100),
  optionId: z.string().min(1)
});
export const LockStrategyRequestSchema = AuditStrategyRequestSchema.extend({
  candidateNote: z.string().trim().max(1_000).optional()
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
export type Option = z.infer<typeof OptionSchema>;
export type StrategyItem = z.infer<typeof StrategyItemSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type Acknowledgement = z.infer<typeof AcknowledgementSchema>;
