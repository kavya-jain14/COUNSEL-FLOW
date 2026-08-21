import { NextResponse } from "next/server";
import { DATASET_VERSION, ENGINE_VERSION } from "@/lib/version";

export async function GET() {
  return NextResponse.json({ status: "ok", engineVersion: ENGINE_VERSION, datasetVersion: DATASET_VERSION });
}
