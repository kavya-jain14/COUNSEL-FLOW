import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "The request is invalid.", issues: error.flatten() },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid request." },
    { status: 400 }
  );
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { error: "INTERNAL_ERROR", message: "The server could not complete the request." },
    { status: 500 }
  );
}
