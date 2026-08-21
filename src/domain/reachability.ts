import type { CandidateProfile, Option } from "@/contracts/schemas";

export type Reachability = {
  band: "DREAM" | "TARGET" | "SAFE" | "INSUFFICIENT_EVIDENCE";
  closingRank?: number;
  sourceLabel?: string;
  effectiveYear?: number;
};

export function getReachability(profile: CandidateProfile, option: Option): Reachability {
  const historical = option.historicalClosingRanks.find((observation) => observation.category === profile.category);
  if (!historical || historical.source.status !== "VERIFIED") return { band: "INSUFFICIENT_EVIDENCE" };

  // Lower ranks are better. The bands are transparent reference heuristics, not admission probabilities.
  const ratio = profile.rank.value / historical.closingRank;
  const band = ratio > 1.15 ? "DREAM" : ratio > 0.9 ? "TARGET" : "SAFE";
  return {
    band,
    closingRank: historical.closingRank,
    sourceLabel: historical.source.sourceLabel,
    effectiveYear: historical.source.effectiveYear
  };
}
