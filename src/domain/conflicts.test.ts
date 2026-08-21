import { describe, expect, it } from "vitest";
import { CandidateProfileSchema } from "@/contracts/schemas";
import { optionsById } from "@/data/seed-options";
import { auditOrderedIds } from "@/domain/audit";
import { profileFixtures } from "@/test-fixtures";

const codes = (ids: string[], profile = profileFixtures.demoCandidate) =>
  auditOrderedIds(profile, ids, optionsById).conflicts.map((conflict) => conflict.code);

describe("eight deterministic conflict rules", () => {
  it("finds branch contradictions, hard-budget violations, dominated pairs, and duplicates", () => {
    const conflicts = codes(["ACET-ECE", "ACET-CSE", "SKIT-CSE", "GBTU-CSE", "NMIT-CSE", "NMIT-CSE"]);
    expect(conflicts).toContain("CF-01");
    expect(conflicts).toContain("CF-02");
    expect(conflicts).toContain("CF-04");
    expect(conflicts).toContain("CF-07");
  });

  it("finds distance and never-accept violations in a manually retained list", () => {
    const distanceProfile = CandidateProfileSchema.parse({
      ...profileFixtures.demoCandidate,
      maxDistance: { km: 30, mode: "hard" }
    });
    expect(codes(["ACET-CSE"], distanceProfile)).toContain("CF-03");

    const neverAcceptProfile = CandidateProfileSchema.parse({
      ...profileFixtures.demoCandidate,
      branchPriorities: ["IT", "ECE"],
      hardConstraints: { ...profileFixtures.demoCandidate.hardConstraints, neverAcceptBranches: ["CSE"] }
    });
    expect(codes(["GBTU-CSE"], neverAcceptProfile)).toContain("CF-06");
  });

  it("finds unsafe coverage and evidence gaps without inventing facts", () => {
    const dreamOnlyProfile = CandidateProfileSchema.parse({
      ...profileFixtures.demoCandidate,
      rank: { value: 180_000, type: "CRL" }
    });
    expect(codes(["GBTU-CSE"], dreamOnlyProfile)).toContain("CF-05");
    expect(codes(["RIT-ME"], profileFixtures.softEvidenceProfile)).toContain("CF-08");
  });
});
