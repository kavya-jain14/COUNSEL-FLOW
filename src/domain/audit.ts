import type { Acknowledgement, CandidateProfile, Option, StrategyItem } from "@/contracts/schemas";
import { auditConflicts } from "@/domain/conflicts";
import { buildStrategyItems } from "@/domain/strategy";

export function auditOrderedIds(profile: CandidateProfile, orderedOptionIds: string[], optionsById: Map<string, Option>, acknowledgements: Acknowledgement[] = []) {
  const options = orderedOptionIds.map((optionId) => {
    const option = optionsById.get(optionId);
    if (!option) throw new Error(`Unknown canonical option ID: ${optionId}`);
    return option;
  });
  // Preserve the user's exact manual order. Facts are always rebuilt from canonical options.
  const rebuiltItems: StrategyItem[] = buildStrategyItems(profile, options)
    .sort((left, right) => orderedOptionIds.indexOf(left.option.canonicalOptionId) - orderedOptionIds.indexOf(right.option.canonicalOptionId))
    .map((item, index) => ({ ...item, position: index + 1 }));
  return { items: rebuiltItems, conflicts: auditConflicts(profile, rebuiltItems, acknowledgements) };
}
