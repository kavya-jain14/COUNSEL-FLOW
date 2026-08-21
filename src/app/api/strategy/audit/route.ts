import { NextResponse } from "next/server";
import { AuditStrategyRequestSchema } from "@/contracts/schemas";
import { optionsById } from "@/data/seed-options";
import { auditOrderedIds } from "@/domain/audit";
import { badRequest, serverError } from "@/lib/http";
import { DATASET_VERSION, ENGINE_VERSION } from "@/lib/version";

export async function POST(request: Request) {
  try {
    const input = AuditStrategyRequestSchema.parse(await request.json());
    const audit = auditOrderedIds(input.profile, input.orderedOptionIds, optionsById, input.acknowledgements);
    return NextResponse.json({ ...audit, engineVersion: ENGINE_VERSION, datasetVersion: DATASET_VERSION });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest(new Error("Request body must be valid JSON."));
    if (error instanceof Error && error.message.includes("Unknown canonical")) return badRequest(error);
    if (error && typeof error === "object" && "issues" in error) return badRequest(error);
    return serverError(error);
  }
}
