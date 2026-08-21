import { NextResponse } from "next/server";
import { ExplainStrategyRequestSchema } from "@/contracts/schemas";
import { optionsById } from "@/data/seed-options";
import { auditOrderedIds } from "@/domain/audit";
import { explainWhyHere } from "@/domain/explain";
import { badRequest, serverError } from "@/lib/http";
import { DATASET_VERSION, ENGINE_VERSION } from "@/lib/version";

export async function POST(request: Request) {
  try {
    const input = ExplainStrategyRequestSchema.parse(await request.json());
    const audit = auditOrderedIds(input.profile, input.orderedOptionIds, optionsById);
    const index = audit.items.findIndex((item) => item.option.canonicalOptionId === input.optionId);
    if (index < 0) return badRequest(new Error("optionId must appear in orderedOptionIds."));
    const item = audit.items[index];
    return NextResponse.json({
      optionId: input.optionId,
      explanation: explainWhyHere(input.profile, item, audit.items[index - 1]),
      facts: item.reasons,
      engineVersion: ENGINE_VERSION,
      datasetVersion: DATASET_VERSION
    });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest(new Error("Request body must be valid JSON."));
    if (error instanceof Error && (error.message.includes("Unknown canonical") || error.message.includes("optionId"))) return badRequest(error);
    if (error && typeof error === "object" && "issues" in error) return badRequest(error);
    return serverError(error);
  }
}
