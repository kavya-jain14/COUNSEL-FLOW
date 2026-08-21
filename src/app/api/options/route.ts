import { NextResponse } from "next/server";
import { seedOptions } from "@/data/seed-options";
import { sourceMetadata } from "@/lib/version";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ ...sourceMetadata, options: seedOptions });
}
