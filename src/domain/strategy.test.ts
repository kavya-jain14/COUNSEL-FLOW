import { describe, expect, it } from "vitest";
import { seedOptions } from "@/data/seed-options";
import { generateStrategy } from "@/domain/strategy";
import { profileFixtures } from "@/test-fixtures";

describe("strategy generation golden fixture", () => {
  it("is deterministic and never auto-includes a hard-constraint failure", () => {
    const first = generateStrategy(profileFixtures.demoCandidate, seedOptions);
    const second = generateStrategy(profileFixtures.demoCandidate, seedOptions);
    const firstIds = first.items.map((item) => item.option.canonicalOptionId);

    expect(firstIds).toEqual(second.items.map((item) => item.option.canonicalOptionId));
    expect(firstIds).not.toContain("NMIT-CSE"); // Rs 2.05 lakh exceeds the hard Rs 1.5 lakh ceiling.
    expect(firstIds).not.toContain("RIT-ME"); // The hard fee check has insufficient evidence.
    expect(first.items.every((item) => item.option.branch !== "ME" || item.position > 0)).toBe(true);
    expect(first.excluded.map((item) => item.optionId)).toContain("NMIT-CSE");
  });

  it("places branch priority before small utility differences", () => {
    const result = generateStrategy(profileFixtures.demoCandidate, seedOptions);
    const firstIt = result.items.findIndex((item) => item.option.branch === "IT");
    const lastCse = result.items.map((item) => item.option.branch).lastIndexOf("CSE");
    expect(lastCse).toBeLessThan(firstIt);
  });
});
