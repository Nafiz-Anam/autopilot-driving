import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllStripeSettings, updateSetting, SETTING_KEYS } from "@/lib/settings";

function maskKey(value: string): string {
  if (!value || value.length < 8) return value ? "••••••••" : "";
  return "••••••••" + value.slice(-4);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const settings = await getAllStripeSettings();

    return NextResponse.json({
      success: true,
      data: {
        stripe_publishable_key: settings.stripe_publishable_key,
        stripe_secret_key_masked: maskKey(settings.stripe_secret_key),
        stripe_webhook_secret_masked: maskKey(settings.stripe_webhook_secret),
        has_secret_key: !!settings.stripe_secret_key,
        has_webhook_secret: !!settings.stripe_webhook_secret,
        has_publishable_key: !!settings.stripe_publishable_key,
        mode: settings.stripe_publishable_key?.startsWith("pk_live_") ? "live" : "test",
      },
    });
  } catch (err) {
    console.error("[admin/settings GET] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as {
      stripe_publishable_key?: string;
      stripe_secret_key?: string;
      stripe_webhook_secret?: string;
    };

    const updates: Promise<void>[] = [];

    if (body.stripe_publishable_key !== undefined && body.stripe_publishable_key !== "") {
      updates.push(updateSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY, body.stripe_publishable_key));
    }
    if (body.stripe_secret_key !== undefined && body.stripe_secret_key !== "") {
      updates.push(updateSetting(SETTING_KEYS.STRIPE_SECRET_KEY, body.stripe_secret_key));
    }
    if (body.stripe_webhook_secret !== undefined && body.stripe_webhook_secret !== "") {
      updates.push(updateSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET, body.stripe_webhook_secret));
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/settings PATCH] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as { action: "test_connection" };

    if (body.action === "test_connection") {
      const { getStripeSecretKey } = await import("@/lib/settings");
      const Stripe = (await import("stripe")).default;

      const secretKey = await getStripeSecretKey();
      if (!secretKey) {
        return NextResponse.json({ success: false, error: "No Stripe secret key configured" }, { status: 400 });
      }

      try {
        const stripe = new Stripe(secretKey);
        const balance = await stripe.balance.retrieve();
        return NextResponse.json({
          success: true,
          data: {
            connected: true,
            currency: balance.available[0]?.currency?.toUpperCase() ?? "GBP",
          },
        });
      } catch (stripeErr) {
        const message = stripeErr instanceof Error ? stripeErr.message : "Connection failed";
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/settings POST] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
