import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateCsrfHeader } from "@/lib/csrf-protection";
import { isValidTier, sanitizeString } from "@/lib/validation";

export const dynamic = "force-dynamic";

// This is a simplified version that would be replaced with actual payment processing
export async function POST(req: NextRequest) {
  try {
    // Validate CSRF token
    if (!validateCsrfHeader(req)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get requested tier and optional payment info from request body
    const {
      tier,
      paymentProvider,
      paymentCustomerId,
      paymentSubscriptionId,
      paymentData,
    } = await req.json();

    // Input validation
    if (!tier || !isValidTier(tier)) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 },
      );
    }

    // Sanitize payment provider-related inputs
    const sanitizedProvider = paymentProvider
      ? sanitizeString(paymentProvider)
      : null;
    const sanitizedCustomerId = paymentCustomerId
      ? sanitizeString(paymentCustomerId)
      : null;
    const sanitizedSubscriptionId = paymentSubscriptionId
      ? sanitizeString(paymentSubscriptionId)
      : null;

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

    // Check if user already has a subscription
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    // Set up subscription period
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // One month from now

    if (existingSub) {
      // Update existing subscription
      // Define a more specific type but still allow for dynamic properties
      const updateData: Record<string, string | boolean | object | null> = {
        tier,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      };

      // Add payment related fields if provided - use sanitized values
      if (sanitizedProvider) updateData.payment_provider = sanitizedProvider;
      if (sanitizedCustomerId)
        updateData.payment_customer_id = sanitizedCustomerId;
      if (sanitizedSubscriptionId)
        updateData.payment_subscription_id = sanitizedSubscriptionId;
      if (paymentData) updateData.payment_data = paymentData;

      const { error: updateError } = await adminClient
        .from("subscriptions")
        .update(updateData)
        .eq("user_id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 },
        );
      }
    } else {
      // Create new subscription
      const insertData: Record<string, string | boolean | object | null> = {
        user_id: userId,
        tier,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      };

      // Add payment related fields if provided - use sanitized values
      if (sanitizedProvider) insertData.payment_provider = sanitizedProvider;
      if (sanitizedCustomerId)
        insertData.payment_customer_id = sanitizedCustomerId;
      if (sanitizedSubscriptionId)
        insertData.payment_subscription_id = sanitizedSubscriptionId;
      if (paymentData) insertData.payment_data = paymentData;

      const { error: insertError } = await adminClient
        .from("subscriptions")
        .insert(insertData);

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 },
        );
      }

      // Also update user's profile
      await adminClient
        .from("profiles")
        .update({ subscription_tier: tier })
        .eq("id", userId);
    }

    // If downgrading, auto-pause excess schedules
    if (tier === "free" || tier === "pro") {
      // Get max digests for the new tier
      const { data: featureRow } = await adminClient
        .from("subscription_features")
        .select("max_digests")
        .eq("tier", tier)
        .single();
      const maxDigests = featureRow?.max_digests ?? 3;
      if (maxDigests !== -1) {
        // Get all active schedules for the user, ordered by created_at ASC
        const { data: activeSchedules } = await adminClient
          .from("schedules")
          .select("id, created_at")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: true });
        if (activeSchedules && activeSchedules.length > maxDigests) {
          // Find the excess schedules (those after the first maxDigests)
          const toPause = activeSchedules.slice(maxDigests).map((s) => s.id);
          if (toPause.length > 0) {
            await adminClient
              .from("schedules")
              .update({ status: "paused" })
              .in("id", toPause);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated subscription to ${tier} tier`,
      tier,
    });
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription update" },
      { status: 500 },
    );
  }
}
