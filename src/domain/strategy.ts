import type { CandidateProfile, Option, StrategyItem } from "@/contracts/schemas";
import { filterEligibleOptions, type Exclusion } from "@/domain/eligibility";
import { getReachability } from "@/domain/reachability";
import { branchPriority, calculateUtility } from "@/domain/utility";

export type GeneratedStrategy = { items: StrategyItem[]; excluded: Exclusion[] };

export function buildStrategyItems(profile: CandidateProfile, options: Option[]): StrategyItem[] {
  return options
    .map((option) => {
      const utility = calculateUtility(profile, option);
      const reachability = getReachability(profile, option);
      const branchIndex = branchPriority(profile, option.branch);
      const confidence: StrategyItem["confidence"] =
        reachability.band === "INSUFFICIENT_EVIDENCE" ? "LOW" :
        Object.keys(utility.factorValues).length < Object.values(profile.factorWeights).filter((weight) => weight > 0).length ? "MEDIUM" : "HIGH";
      const reasons: StrategyItem["reasons"] = [
        {
          code: "BRANCH_PRIORITY",
          parameters: { branch: option.branch, declaredPosition: branchIndex + 1, isDeclaredPriority: branchIndex < profile.branchPriorities.length }
        },
        {
          code: "UTILITY_FACTORS",
          parameters: { comparableFactors: Object.keys(utility.factorValues), utility: Number(utility.utility.toFixed(4)) }
        },
        {
          code: "REACHABILITY_REFERENCE",
          parameters: { band: reachability.band, closingRank: reachability.closingRank ?? "unavailable", effectiveYear: reachability.effectiveYear ?? "unavailable" }
        }
      ];
      return {
        position: 0,
        option,
        reachability: reachability.band,
        utility: Number(utility.utility.toFixed(6)),
        normalizedFactors: utility.normalizedFactors,
        reasons,
        confidence
      };
    })
    .sort((left, right) => {
      const branchDifference = branchPriority(profile, left.option.branch) - branchPriority(profile, right.option.branch);
      if (branchDifference !== 0) return branchDifference;
      const utilityDifference = right.utility - left.utility;
      if (utilityDifference !== 0) return utilityDifference;
      return left.option.canonicalOptionId.localeCompare(right.option.canonicalOptionId);
    })
    .map((item, index) => ({ ...item, position: index + 1 }));
}

export function generateStrategy(profile: CandidateProfile, options: Option[]): GeneratedStrategy {
  const { included, excluded } = filterEligibleOptions(profile, options);
  return { items: buildStrategyItems(profile, included), excluded };
}
