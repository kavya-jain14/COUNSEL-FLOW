export const ENGINE_VERSION = "2026.08.17-mvp.1";
export const DATASET_VERSION = "uptac-reference-2025-26-demo.1";
export const DATASET_LABEL = "UPTAC 2025-26 reference-cycle demo dataset";

export const sourceMetadata = {
  datasetVersion: DATASET_VERSION,
  datasetLabel: DATASET_LABEL,
  disclaimer:
    "Curated historical/reference data for a hackathon demo. It is not live counselling data and is not an admission guarantee.",
  primarySources: [
    {
      label: "UPTAC Information Brochure 2025-26",
      effectiveYear: 2025,
      url: "https://uptac.admissions.nic.in/document/information-brouchure-for-academic-session-2025-26/"
    },
    {
      label: "UPTAC OR-CR reference portal",
      effectiveYear: 2025,
      url: "https://uptac.admissions.nic.in/or-cr/"
    }
  ]
} as const;
