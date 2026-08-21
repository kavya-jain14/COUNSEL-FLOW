import type { CandidateProfile, StrategyItem } from "@/contracts/schemas";

export function explainWhyHere(profile: CandidateProfile, item: StrategyItem, preceding?: StrategyItem) {
  const branchIndex = profile.branchPriorities.indexOf(item.option.branch);
  const branchText = branchIndex === -1
    ? `${item.option.branch} is not one of your explicitly ranked branches`
    : `${item.option.branch} is your #${branchIndex + 1} branch priority`;
  const feeText = item.option.annualFeeInr === null ? "Fee evidence is unavailable" : `annual fee is Rs ${item.option.annualFeeInr.toLocaleString("en-IN")}`;
  const reachText = item.reachability === "INSUFFICIENT_EVIDENCE"
    ? "historical reachability evidence is unavailable, so CounselFlow makes no reachability claim"
    : `the labeled 2025 reference heuristic classifies it as ${item.reachability}`;
  const comparison = preceding
    ? ` It follows ${preceding.option.college} ${preceding.option.branch} because your manual/current order places it there; only an accepted change can move it.`
    : " It is currently first in your list.";

  return `${item.option.college} ${item.option.branch} is here because ${branchText}; ${feeText}; and ${reachText}.${comparison}`;
}
