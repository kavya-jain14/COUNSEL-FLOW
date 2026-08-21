import { createHash } from "node:crypto";
import type { Acknowledgement, CandidateProfile, Conflict, Option, StrategyItem } from "@/contracts/schemas";
import { eligibilityFailures } from "@/domain/eligibility";
import { calculateUtility, branchPriority } from "@/domain/utility";

type DraftConflict = Omit<Conflict, "fingerprint" | "isAcknowledged" | "overrideNote">;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(code: Conflict["code"], optionIds: string[], evidence: Conflict["evidence"]) {
  return createHash("sha256").update(stableJson({ code, optionIds: [...optionIds].sort(), evidence })).digest("hex").slice(0, 20);
}

function draft(input: DraftConflict): DraftConflict {
  return input;
}

function applyAcknowledgements(conflicts: DraftConflict[], acknowledgements: Acknowledgement[]): Conflict[] {
  const notes = new Map(acknowledgements.map((acknowledgement) => [acknowledgement.fingerprint, acknowledgement.note]));
  return conflicts.map((conflict) => {
    const conflictFingerprint = fingerprint(conflict.code, conflict.optionIds, conflict.evidence);
    const note = notes.get(conflictFingerprint);
    const canAcknowledge = conflict.severity !== "CRITICAL";
    return {
      ...conflict,
      fingerprint: conflictFingerprint,
      isAcknowledged: canAcknowledge && Boolean(note),
      overrideNote: canAcknowledge ? note : undefined
    };
  });
}

function moveBefore(ids: string[], movingId: string, anchorId: string) {
  const withoutMoving = ids.filter((id) => id !== movingId);
  const anchor = withoutMoving.indexOf(anchorId);
  if (anchor < 0) return ids;
  return [...withoutMoving.slice(0, anchor), movingId, ...withoutMoving.slice(anchor)];
}

function hasVerifiedRankEvidence(profile: CandidateProfile, option: Option) {
  return option.historicalClosingRanks.some((rank) => rank.category === profile.category && rank.source.status === "VERIFIED");
}

function evidenceGapConflicts(profile: CandidateProfile, item: StrategyItem): DraftConflict[] {
  const option = item.option;
  const gaps: DraftConflict[] = [];
  const missingHardFee = profile.annualBudget?.mode === "hard" && (option.annualFeeInr === null || option.factSources.fees.status !== "VERIFIED");
  const missingHardDistance = profile.maxDistance?.mode === "hard" && (option.distanceKm === null || option.factSources.distance.status !== "VERIFIED");

  if (missingHardFee || missingHardDistance) {
    gaps.push(draft({
      code: "CF-08",
      severity: "CRITICAL",
      title: "Required hard-constraint evidence is unavailable",
      message: `CounselFlow cannot verify ${missingHardFee ? "the fee" : "the distance"} required by your hard constraint for ${option.college}.`,
      optionIds: [option.canonicalOptionId],
      evidence: { missingFact: missingHardFee ? "annualFeeInr" : "distanceKm", constraintMode: "hard" },
      recommendedAction: "REVIEW_EVIDENCE",
      lockBlocking: true
    }));
  }
  if (!hasVerifiedRankEvidence(profile, option)) {
    gaps.push(draft({
      code: "CF-08",
      severity: "WARNING",
      title: "Reachability evidence is unavailable",
      message: `No verified ${profile.category} historical closing-rank observation is stored for ${option.college} ${option.branch}; no reachability claim is made.`,
      optionIds: [option.canonicalOptionId],
      evidence: { missingFact: "historicalClosingRank", category: profile.category },
      recommendedAction: "REVIEW_EVIDENCE",
      lockBlocking: false
    }));
  }
  return gaps;
}

function dominates(profile: CandidateProfile, candidate: StrategyItem, incumbent: StrategyItem) {
  const candidateValues = calculateUtility(profile, candidate.option).factorValues;
  const incumbentValues = calculateUtility(profile, incumbent.option).factorValues;
  const selectedFactors = Object.entries(profile.factorWeights)
    .filter(([, weight]) => weight > 0)
    .map(([factor]) => factor)
    .filter((factor) => candidateValues[factor] !== undefined && incumbentValues[factor] !== undefined);
  if (selectedFactors.length === 0) return { isDominated: false, selectedFactors };
  const equalOrBetterEverywhere = selectedFactors.every((factor) => candidateValues[factor] >= incumbentValues[factor]);
  const betterSomewhere = selectedFactors.some((factor) => candidateValues[factor] > incumbentValues[factor]);
  return { isDominated: equalOrBetterEverywhere && betterSomewhere, selectedFactors };
}

export function auditConflicts(profile: CandidateProfile, items: StrategyItem[], acknowledgements: Acknowledgement[] = []): Conflict[] {
  const conflicts: DraftConflict[] = [];
  const ids = items.map((item) => item.option.canonicalOptionId);

  for (const item of items) {
    const option = item.option;
    if (profile.annualBudget?.mode === "hard" && option.annualFeeInr !== null && option.annualFeeInr > profile.annualBudget.amountInr) {
      conflicts.push(draft({
        code: "CF-02", severity: "CRITICAL", title: "Hard budget violation",
        message: `${option.college} ${option.branch} costs Rs ${option.annualFeeInr.toLocaleString("en-IN")} annually, above your hard Rs ${profile.annualBudget.amountInr.toLocaleString("en-IN")} ceiling.`,
        optionIds: [option.canonicalOptionId], evidence: { annualFeeInr: option.annualFeeInr, budgetInr: profile.annualBudget.amountInr },
        recommendedAction: "REMOVE", lockBlocking: true
      }));
    }
    if (profile.maxDistance?.mode === "hard" && option.distanceKm !== null && option.distanceKm > profile.maxDistance.km) {
      conflicts.push(draft({
        code: "CF-03", severity: "CRITICAL", title: "Hard distance violation",
        message: `${option.college} ${option.branch} is ${option.distanceKm} km away, beyond your hard ${profile.maxDistance.km} km limit.`,
        optionIds: [option.canonicalOptionId], evidence: { distanceKm: option.distanceKm, maxDistanceKm: profile.maxDistance.km },
        recommendedAction: "REMOVE", lockBlocking: true
      }));
    }

    const failures = eligibilityFailures(profile, option).filter((failure) =>
      ["NEVER_ACCEPT_BRANCH", "EXCLUDED_CITY", "EXCLUDED_INSTITUTE_TYPE", "HOSTEL_REQUIRED"].includes(failure.code)
    );
    for (const failure of failures) {
      conflicts.push(draft({
        code: "CF-06", severity: "CRITICAL", title: "Never-accept option retained",
        message: `${option.college} ${option.branch} violates a declared never-accept choice: ${failure.message}`,
        optionIds: [option.canonicalOptionId], evidence: { failureCode: failure.code, branch: option.branch, city: option.city },
        recommendedAction: "REMOVE", lockBlocking: true
      }));
    }
    conflicts.push(...evidenceGapConflicts(profile, item));
  }

  const repeatedIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  for (const optionId of repeatedIds) {
    conflicts.push(draft({
      code: "CF-07", severity: "WARNING", title: "Duplicate option",
      message: `${optionId} appears more than once. A college-branch choice must appear only once in the final preference list.`,
      optionIds: [optionId], evidence: { occurrences: ids.filter((id) => id === optionId).length },
      recommendedAction: "DEDUPLICATE", lockBlocking: false
    }));
  }

  for (let higher = 0; higher < items.length; higher += 1) {
    const above = items[higher];
    for (let lower = higher + 1; lower < items.length; lower += 1) {
      const below = items[lower];
      const branchContradiction = branchPriority(profile, above.option.branch) > branchPriority(profile, below.option.branch);
      const comparable = above.option.college === below.option.college || Math.abs(above.utility - below.utility) <= 0.2;
      if (branchContradiction && comparable) {
        conflicts.push(draft({
          code: "CF-01", severity: "WARNING", title: "Branch-priority contradiction",
          message: `${above.option.branch} is above the higher-priority ${below.option.branch} option. The options are comparable under your selected factors, so confirm a college-over-branch tradeoff or move the higher-priority branch up.`,
          optionIds: [above.option.canonicalOptionId, below.option.canonicalOptionId],
          evidence: { aboveBranch: above.option.branch, belowBranch: below.option.branch, abovePosition: higher + 1, belowPosition: lower + 1 },
          recommendedAction: "MOVE", proposedOrder: moveBefore(ids, below.option.canonicalOptionId, above.option.canonicalOptionId), lockBlocking: false
        }));
        break;
      }
    }
  }

  for (let index = 0; index < items.length - 1; index += 1) {
    const above = items[index];
    const below = items[index + 1];
    const comparison = dominates(profile, below, above);
    if (comparison.isDominated) {
      conflicts.push(draft({
        code: "CF-04", severity: "WARNING", title: "Dominated adjacent option",
        message: `${below.option.college} ${below.option.branch}, immediately below, is equal or better on every selected comparable factor and better on at least one. Review this ordering.`,
        optionIds: [above.option.canonicalOptionId, below.option.canonicalOptionId],
        evidence: { comparedFactors: comparison.selectedFactors, abovePosition: index + 1, belowPosition: index + 2 },
        recommendedAction: "MOVE", proposedOrder: [...ids.slice(0, index), below.option.canonicalOptionId, above.option.canonicalOptionId, ...ids.slice(index + 2)], lockBlocking: false
      }));
    }
  }

  const hasFallback = items.some((item) => item.reachability === "SAFE");
  if (items.length > 0 && !hasFallback) {
    conflicts.push(draft({
      code: "CF-05", severity: "WARNING", title: "No candidate-acceptable fallback",
      message: "Your list contains only Dream, Target, or insufficient-evidence options. CounselFlow will not insert an unwanted college, but you should review constraints or add an acceptable fallback.",
      optionIds: ids, evidence: { reachabilityBands: items.map((item) => item.reachability) },
      recommendedAction: "ACKNOWLEDGE", lockBlocking: false
    }));
  }

  return applyAcknowledgements(conflicts, acknowledgements);
}
