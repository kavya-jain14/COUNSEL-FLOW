import { NextResponse } from "next/server";
import { GenerateStrategyRequestSchema } from "@/contracts/schemas";
import { auditConflicts } from "@/domain/conflicts";
import { generateStrategy } from "@/domain/strategy";
import { seedOptions } from "@/data/seed-options";
import { badRequest, serverError } from "@/lib/http";
import { DATASET_VERSION, ENGINE_VERSION, sourceMetadata } from "@/lib/version";

export async function POST(request: Request) {
  try {
    const { profile } = GenerateStrategyRequestSchema.parse(await request.json());
    const strategy = generateStrategy(profile, seedOptions);
    const conflicts = auditConflicts(profile, strategy.items);
    return NextResponse.json({
      profile,
      items: strategy.items,
      excluded: strategy.excluded,
      conflicts,
      engineVersion: ENGINE_VERSION,
      datasetVersion: DATASET_VERSION,
      sourceMetadata
    });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest(new Error("Request body must be valid JSON."));
    if (error instanceof Error && error.message.includes("Unknown canonical")) return badRequest(error);
    if (error && typeof error === "object" && "issues" in error) return badRequest(error);
    return serverError(error);
  }
}
