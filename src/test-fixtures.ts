import { CandidateProfileSchema } from "@/contracts/schemas";

export const profileFixtures = {
  demoCandidate: CandidateProfileSchema.parse({
    rank: { value: 75_000, type: "CRL" },
    category: "GEN",
    branchPriorities: ["CSE", "IT", "ECE"],
    annualBudget: { amountInr: 150_000, mode: "hard" },
    maxDistance: { km: 120, mode: "hard" },
    factorWeights: { placements: 40, fees: 20, location: 20, campus: 10, hostel: 10 },
    hardConstraints: {
      neverAcceptBranches: [],
      excludedCities: [],
      excludedInstituteTypes: [],
      hostelRequired: false
    }
  }),
  softEvidenceProfile: CandidateProfileSchema.parse({
    rank: { value: 75_000, type: "CRL" },
    category: "GEN",
    branchPriorities: ["CSE", "IT", "ECE"],
    annualBudget: { amountInr: 150_000, mode: "soft" },
    factorWeights: { placements: 40, fees: 20, location: 20, campus: 10, hostel: 10 },
    hardConstraints: {
      neverAcceptBranches: [],
      excludedCities: [],
      excludedInstituteTypes: [],
      hostelRequired: false
    }
  })
};
