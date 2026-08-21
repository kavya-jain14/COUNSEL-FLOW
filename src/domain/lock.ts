import { createHash, randomUUID } from "node:crypto";
import type { Acknowledgement, CandidateProfile, Conflict, StrategyItem } from "@/contracts/schemas";
import { prisma } from "@/lib/prisma";
import { DATASET_VERSION, ENGINE_VERSION } from "@/lib/version";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function unresolvedCriticalConflicts(conflicts: Conflict[]) {
  return conflicts.filter((conflict) => conflict.lockBlocking);
}

export function makeStrategyHash(profile: CandidateProfile, items: StrategyItem[]) {
  return createHash("sha256")
    .update(stableJson({
      profile,
      orderedOptionIds: items.map((item) => item.option.canonicalOptionId),
      datasetVersion: DATASET_VERSION,
      engineVersion: ENGINE_VERSION
    }))
    .digest("hex");
}

type LockInput = {
  profile: CandidateProfile;
  items: StrategyItem[];
  conflicts: Conflict[];
  acknowledgements: Acknowledgement[];
};

export async function persistLockedStrategy(input: LockInput) {
  const strategyHash = makeStrategyHash(input.profile, input.items);
  const existing = await prisma.lockedStrategy.findUnique({ where: { strategyHash } });
  if (existing) return { snapshot: existing, reusedExistingSnapshot: true };

  const snapshot = await prisma.lockedStrategy.create({
    data: {
      id: randomUUID(),
      strategyHash,
      datasetVersion: DATASET_VERSION,
      engineVersion: ENGINE_VERSION,
      // Round-trip through JSON to guarantee Prisma receives plain immutable JSON data.
      profileJson: JSON.parse(JSON.stringify(input.profile)),
      strategyJson: JSON.parse(JSON.stringify(input.items)),
      auditJson: JSON.parse(JSON.stringify(input.conflicts)),
      acknowledgementsJson: JSON.parse(JSON.stringify(input.acknowledgements))
    }
  });
  return { snapshot, reusedExistingSnapshot: false };
}
