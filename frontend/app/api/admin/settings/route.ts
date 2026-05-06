import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { getAllStripeSettings, getSmtpSettings, updateSetting, SETTING_KEYS } from "@/lib/settings";
import {
  createStripeClient,
  isStripePublishableKey,
  isStripeSecretKey,
  isStripeWebhookSecret,
} from "@/lib/stripe-server";

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
    const smtp = await getSmtpSettings();

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
        smtp_host: smtp.smtp_host,
        smtp_port: smtp.smtp_port,
        smtp_user: smtp.smtp_user,
        smtp_pass_masked: maskKey(smtp.smtp_pass),
        email_from: smtp.email_from,
        email_admin: smtp.email_admin,
        has_smtp_pass: !!smtp.smtp_pass,
        has_smtp_config: !!(smtp.smtp_host && smtp.smtp_user && smtp.smtp_pass && smtp.email_from && smtp.email_admin),
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
      smtp_host?: string;
      smtp_port?: number | string;
      smtp_user?: string;
      smtp_pass?: string;
      email_from?: string;
      email_admin?: string;
    };

    const updates: Promise<void>[] = [];

    if (body.stripe_publishable_key !== undefined && body.stripe_publishable_key !== "") {
      if (!isStripePublishableKey(body.stripe_publishable_key)) {
        return NextResponse.json(
          { success: false, error: "Invalid Stripe publishable key format" },
          { status: 400 }
        );
      }
      updates.push(updateSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY, body.stripe_publishable_key));
    }
    if (body.stripe_secret_key !== undefined && body.stripe_secret_key !== "") {
      if (!isStripeSecretKey(body.stripe_secret_key)) {
        return NextResponse.json(
          { success: false, error: "Invalid Stripe secret key format" },
          { status: 400 }
        );
      }
      updates.push(updateSetting(SETTING_KEYS.STRIPE_SECRET_KEY, body.stripe_secret_key));
    }
    if (body.stripe_webhook_secret !== undefined && body.stripe_webhook_secret !== "") {
      if (!isStripeWebhookSecret(body.stripe_webhook_secret)) {
        return NextResponse.json(
          { success: false, error: "Invalid Stripe webhook secret format" },
          { status: 400 }
        );
      }
      updates.push(updateSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET, body.stripe_webhook_secret));
    }
    if (body.smtp_host !== undefined && body.smtp_host !== "") {
      updates.push(updateSetting(SETTING_KEYS.SMTP_HOST, body.smtp_host.trim()));
    }
    if (body.smtp_port !== undefined && body.smtp_port !== "") {
      const parsedPort = Number(body.smtp_port);
      if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
        return NextResponse.json({ success: false, error: "Invalid SMTP port" }, { status: 400 });
      }
      updates.push(updateSetting(SETTING_KEYS.SMTP_PORT, String(parsedPort)));
    }
    if (body.smtp_user !== undefined && body.smtp_user !== "") {
      updates.push(updateSetting(SETTING_KEYS.SMTP_USER, body.smtp_user.trim()));
    }
    if (body.smtp_pass !== undefined && body.smtp_pass !== "") {
      updates.push(updateSetting(SETTING_KEYS.SMTP_PASS, body.smtp_pass));
    }
    if (body.email_from !== undefined && body.email_from !== "") {
      updates.push(updateSetting(SETTING_KEYS.EMAIL_FROM, body.email_from.trim()));
    }
    if (body.email_admin !== undefined && body.email_admin !== "") {
      updates.push(updateSetting(SETTING_KEYS.EMAIL_ADMIN, body.email_admin.trim()));
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

    const body = await request.json() as { action: "test_connection" | "test_smtp" };

    if (body.action === "test_connection") {
      const { getStripeSecretKey } = await import("@/lib/settings");

      const secretKey = await getStripeSecretKey();
      if (!secretKey) {
        return NextResponse.json({ success: false, error: "No Stripe secret key configured" }, { status: 400 });
      }

      try {
        const stripe = createStripeClient(secretKey);
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

    if (body.action === "test_smtp") {
      const smtp = await getSmtpSettings();
      if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass || !smtp.email_from) {
        return NextResponse.json({ success: false, error: "SMTP is not fully configured" }, { status: 400 });
      }

      try {
        const transporter = nodemailer.createTransport({
          host: smtp.smtp_host,
          port: smtp.smtp_port,
          secure: smtp.smtp_port === 465,
          auth: {
            user: smtp.smtp_user,
            pass: smtp.smtp_pass,
          },
        });
        await transporter.verify();
        return NextResponse.json({
          success: true,
          data: { connected: true, host: smtp.smtp_host, port: smtp.smtp_port },
        });
      } catch (smtpErr) {
        const message = smtpErr instanceof Error ? smtpErr.message : "SMTP connection failed";
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/settings POST] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
