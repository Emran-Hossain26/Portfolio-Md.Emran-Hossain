import { NextResponse } from "next/server";

/**
 * TEMP (perf investigation): returns the actual function execution region.
 * No secrets. Remove after the region configuration is verified.
 */
export async function GET() {
  return NextResponse.json({
    vercelRegion: process.env.VERCEL_REGION ?? "(unset — default region)",
    deployedRegionHeader: process.env.NEXT_PUBLIC_REGION_PROBE ?? null,
  });
}
