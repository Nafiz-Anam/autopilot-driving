import { NextResponse } from "next/server";
import { listActivePricingCategories } from "@/lib/lesson-pricing";

/** Public pricing catalogue — `Cache-Control: no-store` so admin edits show immediately. */
export async function GET() {
  try {
    const data = await listActivePricingCategories();
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("[pricing/categories GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
