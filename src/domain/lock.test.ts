import { describe, expect, it } from "vitest";
import { optionsById } from "@/data/seed-options";
import { auditOrderedIds } from "@/domain/audit";
import { makeStrategyHash, unresolvedCriticalConflicts } from "@/domain/lock";
import { profileFixtures } from "@/test-fixtures";

describe("lock invariants", () => {
  it("creates a reproducible hash for the same profile, dataset, engine, and order", () => {
    const first = auditOrderedIds(profileFixtures.demoCandidate, ["GBTU-CSE", "ACET-CSE"], optionsById);
    const second = auditOrderedIds(profileFixtures.demoCandidate, ["GBTU-CSE", "ACET-CSE"], optionsById);
    expect(makeStrategyHash(profileFixtures.demoCandidate, first.items)).toBe(makeStrategyHash(profileFixtures.demoCandidate, second.items));
  });

  it("blocks lock when a critical conflict remains", () => {
    const audit = auditOrderedIds(profileFixtures.demoCandidate, ["NMIT-CSE", "ACET-CSE"], optionsById);
    expect(unresolvedCriticalConflicts(audit.conflicts).map((conflict) => conflict.code)).toContain("CF-02");
  });
});
