import { NextResponse } from "next/server";
import { getStripePublishableKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const publishableKey = await getStripePublishableKey();
    return NextResponse.json({ publishableKey: publishableKey || null });
  } catch (err) {
    console.error("[stripe/config] error:", err);
    return NextResponse.json({ publishableKey: null }, { status: 500 });
  }
}
