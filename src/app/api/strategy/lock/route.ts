import { NextResponse } from "next/server";
import { LockStrategyRequestSchema } from "@/contracts/schemas";
import { optionsById } from "@/data/seed-options";
import { auditOrderedIds } from "@/domain/audit";
import { persistLockedStrategy, unresolvedCriticalConflicts } from "@/domain/lock";
import { badRequest, serverError } from "@/lib/http";
import { DATASET_VERSION, ENGINE_VERSION } from "@/lib/version";

export async function POST(request: Request) {
  try {
    const input = LockStrategyRequestSchema.parse(await request.json());
    const audit = auditOrderedIds(input.profile, input.orderedOptionIds, optionsById, input.acknowledgements);
    const blockers = unresolvedCriticalConflicts(audit.conflicts);
    if (blockers.length > 0) {
      return NextResponse.json({
        error: "LOCK_BLOCKED",
        message: "Resolve all critical conflicts before locking this strategy.",
        blockers,
        audit
      }, { status: 409 });
    }
    const locked = await persistLockedStrategy({
      profile: input.profile,
      items: audit.items,
      conflicts: audit.conflicts,
      acknowledgements: input.acknowledgements
    });
    return NextResponse.json({
      snapshotId: locked.snapshot.id,
      strategyHash: locked.snapshot.strategyHash,
      lockedAt: locked.snapshot.lockedAt,
      reusedExistingSnapshot: locked.reusedExistingSnapshot,
      candidateNote: input.candidateNote,
      acknowledgedWarnings: audit.conflicts.filter((conflict) => conflict.severity === "WARNING" && conflict.isAcknowledged),
      engineVersion: ENGINE_VERSION,
      datasetVersion: DATASET_VERSION
    }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest(new Error("Request body must be valid JSON."));
    if (error instanceof Error && error.message.includes("Unknown canonical")) return badRequest(error);
    if (error && typeof error === "object" && "issues" in error) return badRequest(error);
    return serverError(error);
  }
}
