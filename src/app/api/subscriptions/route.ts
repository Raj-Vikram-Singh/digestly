import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Create Supabase admin client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get user details
    const { data: userData, error: userError } =
      await adminClient.auth.getUser(token);

    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    const userId = userData.user.id;

    // Get subscription information
    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select(
        "tier, status, current_period_end, payment_provider, payment_subscription_id, payment_customer_id",
      )
      .eq("user_id", userId)
      .maybeSingle();

    // Default to free tier if no subscription found
    let tier = "free";
    let status = "active";
    let currentPeriodEnd = null;

    if (subscription) {
      tier = subscription.tier;
      status = subscription.status;
      currentPeriodEnd = subscription.current_period_end;
    }

    // Get feature details for this tier
    const { data: features } = await adminClient
      .from("subscription_features")
      .select(
        "max_digests, allowed_frequencies, custom_templates, priority_support",
      )
      .eq("tier", tier)
      .single();

    // Count user's current schedules
    const { count: currentCount } = await adminClient
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return NextResponse.json({
      tier,
      status,
      currentPeriodEnd,
      paymentProvider: subscription?.payment_provider || null,
      paymentCustomerId: subscription?.payment_customer_id || null,
      paymentSubscriptionId: subscription?.payment_subscription_id || null,
      maxDigests: features?.max_digests || 3,
      allowedFrequencies: features?.allowed_frequencies || ["daily", "weekly"],
      customTemplates: features?.custom_templates || false,
      prioritySupport: features?.priority_support || false,
      currentCount: currentCount || 0,
    });
  } catch (error) {
    console.error("Subscription retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription details" },
      { status: 500 },
    );
  }
}
