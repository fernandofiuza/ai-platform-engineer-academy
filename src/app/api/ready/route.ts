import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready" });
  } catch (error) {
    logger.error("readiness check failed", { error });
    return NextResponse.json({ status: "not-ready" }, { status: 503 });
  }
}
