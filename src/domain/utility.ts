import type { CandidateProfile, Option } from "@/contracts/schemas";

export type UtilityResult = {
  utility: number;
  factorValues: Record<string, number>;
  normalizedFactors: Record<string, number>;
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function factorValues(profile: CandidateProfile, option: Option): Record<string, number | null> {
  const budgetReference = profile.annualBudget?.amountInr ?? 200_000;
  const distanceReference = profile.maxDistance?.km ?? 250;
  return {
    placements: option.placementsScore === null ? null : option.placementsScore / 100,
    fees: option.annualFeeInr === null ? null : clamp(1 - option.annualFeeInr / (budgetReference * 1.5)),
    location: option.distanceKm === null ? null : clamp(1 - option.distanceKm / (distanceReference * 1.5)),
    campus: option.campusScore === null ? null : option.campusScore / 100,
    hostel: option.hostelAvailable === null ? null : option.hostelAvailable ? 1 : 0
  };
}

export function calculateUtility(profile: CandidateProfile, option: Option): UtilityResult {
  const rawValues = factorValues(profile, option);
  const enabled = Object.entries(profile.factorWeights).filter(([factor, weight]) => weight > 0 && rawValues[factor] !== null);
  const weightTotal = enabled.reduce((total, [, weight]) => total + weight, 0);
  const normalizedFactors: Record<string, number> = {};
  const comparableValues: Record<string, number> = {};

  if (weightTotal === 0) return { utility: 0, factorValues: comparableValues, normalizedFactors };

  let utility = 0;
  for (const [factor, weight] of enabled) {
    const value = rawValues[factor]!;
    comparableValues[factor] = value;
    normalizedFactors[factor] = weight / weightTotal;
    utility += value * normalizedFactors[factor];
  }
  return { utility, factorValues: comparableValues, normalizedFactors };
}

export function branchPriority(profile: CandidateProfile, branch: Option["branch"]) {
  const index = profile.branchPriorities.indexOf(branch);
  return index === -1 ? profile.branchPriorities.length + 1 : index;
}
