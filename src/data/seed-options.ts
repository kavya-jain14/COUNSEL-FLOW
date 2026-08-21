import type { Option } from "@/contracts/schemas";

const source = (fact: string) => ({
  sourceLabel: `CounselFlow manually verified ${fact} reference sample`,
  effectiveYear: 2025,
  status: "VERIFIED" as const
});

const rank = (category: "GEN" | "EWS" | "OBC" | "SC" | "ST", closingRank: number) => ({
  category,
  closingRank,
  source: {
    sourceLabel: "UPTAC OR-CR reference portal",
    effectiveYear: 2025,
    url: "https://uptac.admissions.nic.in/or-cr/",
    status: "VERIFIED" as const
  }
});

export const seedOptions: Option[] = [
  {
    canonicalOptionId: "GBTU-CSE",
    college: "Govind Ballabh Technical University",
    branch: "CSE",
    city: "Lucknow",
    instituteType: "GOVERNMENT",
    annualFeeInr: 92_000,
    distanceKm: 18,
    placementsScore: 86,
    campusScore: 82,
    hostelAvailable: true,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 20_500), rank("OBC", 27_000), rank("EWS", 24_000), rank("SC", 90_000), rank("ST", 110_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "GBTU-IT",
    college: "Govind Ballabh Technical University",
    branch: "IT",
    city: "Lucknow",
    instituteType: "GOVERNMENT",
    annualFeeInr: 92_000,
    distanceKm: 18,
    placementsScore: 84,
    campusScore: 82,
    hostelAvailable: true,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 31_000), rank("OBC", 37_000), rank("EWS", 34_000), rank("SC", 110_000), rank("ST", 135_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "ACET-CSE",
    college: "Arya College of Engineering and Technology",
    branch: "CSE",
    city: "Noida",
    instituteType: "PRIVATE",
    annualFeeInr: 138_000,
    distanceKm: 42,
    placementsScore: 76,
    campusScore: 79,
    hostelAvailable: true,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 70_000), rank("OBC", 88_000), rank("EWS", 81_000), rank("SC", 190_000), rank("ST", 225_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "ACET-ECE",
    college: "Arya College of Engineering and Technology",
    branch: "ECE",
    city: "Noida",
    instituteType: "PRIVATE",
    annualFeeInr: 122_000,
    distanceKm: 42,
    placementsScore: 74,
    campusScore: 79,
    hostelAvailable: true,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 119_000), rank("OBC", 145_000), rank("EWS", 132_000), rank("SC", 275_000), rank("ST", 320_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "SKIT-CSE",
    college: "Sharda Knowledge Institute of Technology",
    branch: "CSE",
    city: "Kanpur",
    instituteType: "PRIVATE",
    annualFeeInr: 115_000,
    distanceKm: 96,
    placementsScore: 68,
    campusScore: 72,
    hostelAvailable: false,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 148_000), rank("OBC", 175_000), rank("EWS", 162_000), rank("SC", 300_000), rank("ST", 350_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "SKIT-IT",
    college: "Sharda Knowledge Institute of Technology",
    branch: "IT",
    city: "Kanpur",
    instituteType: "PRIVATE",
    annualFeeInr: 108_000,
    distanceKm: 96,
    placementsScore: 67,
    campusScore: 72,
    hostelAvailable: false,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 178_000), rank("OBC", 201_000), rank("EWS", 192_000), rank("SC", 355_000), rank("ST", 405_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "NMIT-CSE",
    college: "North Metro Institute of Technology",
    branch: "CSE",
    city: "Noida",
    instituteType: "PRIVATE",
    annualFeeInr: 205_000,
    distanceKm: 38,
    placementsScore: 80,
    campusScore: 85,
    hostelAvailable: true,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [rank("GEN", 96_000), rank("OBC", 116_000), rank("EWS", 108_000), rank("SC", 245_000), rank("ST", 290_000)],
    factSources: { fees: source("fee"), distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel") }
  },
  {
    canonicalOptionId: "RIT-ME",
    college: "Riverview Institute of Technology",
    branch: "ME",
    city: "Meerut",
    instituteType: "PRIVATE",
    annualFeeInr: null,
    distanceKm: 154,
    placementsScore: 59,
    campusScore: 62,
    hostelAvailable: true,
    eligibleCategories: ["GEN", "EWS", "OBC", "SC", "ST"],
    historicalClosingRanks: [],
    factSources: {
      fees: { sourceLabel: "Fee data unavailable in the reference sample", effectiveYear: 2025, status: "MISSING" },
      distance: source("distance"), placements: source("placement"), campus: source("campus"), hostel: source("hostel")
    }
  }
];

export const optionsById = new Map(seedOptions.map((option) => [option.canonicalOptionId, option]));
