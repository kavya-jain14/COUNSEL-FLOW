import type { CandidateProfile, Option } from "@/contracts/schemas";

export type Exclusion = {
  optionId: string;
  code: string;
  message: string;
};

function cityIsExcluded(profile: CandidateProfile, city: string) {
  return profile.hardConstraints.excludedCities.some((excluded) => excluded.toLowerCase() === city.toLowerCase());
}

export function eligibilityFailures(profile: CandidateProfile, option: Option): Exclusion[] {
  const failures: Exclusion[] = [];

  if (!option.eligibleCategories.includes(profile.category)) {
    failures.push({ optionId: option.canonicalOptionId, code: "ELIGIBILITY_CATEGORY", message: "The reference sample has no eligibility for this category." });
  }
  if (profile.hardConstraints.neverAcceptBranches.includes(option.branch)) {
    failures.push({ optionId: option.canonicalOptionId, code: "NEVER_ACCEPT_BRANCH", message: `${option.branch} is a never-accept branch.` });
  }
  if (cityIsExcluded(profile, option.city)) {
    failures.push({ optionId: option.canonicalOptionId, code: "EXCLUDED_CITY", message: `${option.city} is an excluded city.` });
  }
  if (profile.hardConstraints.excludedInstituteTypes.includes(option.instituteType)) {
    failures.push({ optionId: option.canonicalOptionId, code: "EXCLUDED_INSTITUTE_TYPE", message: `${option.instituteType} institutes are excluded.` });
  }
  if (profile.hardConstraints.hostelRequired && option.hostelAvailable !== true) {
    failures.push({ optionId: option.canonicalOptionId, code: "HOSTEL_REQUIRED", message: "A confirmed hostel is required." });
  }
  if (profile.annualBudget?.mode === "hard") {
    if (option.annualFeeInr === null || option.factSources.fees.status !== "VERIFIED") {
      failures.push({ optionId: option.canonicalOptionId, code: "MISSING_HARD_FEE_EVIDENCE", message: "The hard budget cannot be checked with the available fee evidence." });
    } else if (option.annualFeeInr > profile.annualBudget.amountInr) {
      failures.push({ optionId: option.canonicalOptionId, code: "HARD_BUDGET", message: "Annual fee exceeds the hard budget." });
    }
  }
  if (profile.maxDistance?.mode === "hard") {
    if (option.distanceKm === null || option.factSources.distance.status !== "VERIFIED") {
      failures.push({ optionId: option.canonicalOptionId, code: "MISSING_HARD_DISTANCE_EVIDENCE", message: "The hard distance cannot be checked with the available evidence." });
    } else if (option.distanceKm > profile.maxDistance.km) {
      failures.push({ optionId: option.canonicalOptionId, code: "HARD_DISTANCE", message: "Distance exceeds the hard travel limit." });
    }
  }
  return failures;
}

export function filterEligibleOptions(profile: CandidateProfile, options: Option[]) {
  const included: Option[] = [];
  const excluded: Exclusion[] = [];
  for (const option of options) {
    const failures = eligibilityFailures(profile, option);
    if (failures.length === 0) included.push(option);
    else excluded.push(...failures);
  }
  return { included, excluded };
}
