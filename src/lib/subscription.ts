import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export interface SubscriptionFeatures {
  tier: string;
  maxDigests: number;
  allowedFrequencies: string[];
  customTemplates: boolean;
  prioritySupport: boolean;
  customApiAccess: boolean;
  advancedFiltering: boolean;
}

export async function checkSubscriptionAccess(
  req: NextRequest,
  authToken: string,
  requiredTier: "free" | "pro" | "enterprise",
): Promise<NextResponse | null> {
  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Use Supabase admin client to get subscription details
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get user details from the auth token
    const { data: userData, error: userError } =
      await adminClient.auth.getUser(authToken);
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    const userId = userData.user.id;

    // Get subscription information
    const { data: subscription, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", userId)
      .single();

    if (subscriptionError || !subscription) {
      // Default to free tier if no subscription record exists
      if (requiredTier === "free") {
        return null; // Allow access for free tier features
      }
      return NextResponse.json(
        { error: "Subscription required", requiredTier },
        { status: 403 },
      );
    }

    // Check if subscription is active
    if (subscription.status !== "active") {
      if (requiredTier === "free") {
        return null; // Allow access for free tier features
      }
      return NextResponse.json(
        {
          error: "Subscription inactive",
          currentTier: subscription.tier,
          requiredTier,
        },
        { status: 403 },
      );
    }

    // Check if subscription tier meets requirement
    const tierLevels = { free: 0, pro: 1, enterprise: 2 };
    const userTierLevel =
      tierLevels[subscription.tier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[requiredTier];

    if (userTierLevel >= requiredTierLevel) {
      return null; // Allow access
    }

    return NextResponse.json(
      {
        error: "Subscription upgrade required",
        currentTier: subscription.tier,
        requiredTier,
      },
      { status: 403 },
    );
  } catch (err) {
    console.error("Subscription check error:", err);
    // Default to denying access on error unless it's a free tier feature
    if (requiredTier === "free") {
      return null; // Allow access for free tier features even on error
    }
    return NextResponse.json(
      { error: "Subscription service error" },
      { status: 500 },
    );
  }
}

export async function getUserSubscriptionFeatures(
  authToken: string,
): Promise<SubscriptionFeatures | null> {
  if (!authToken) return null;

  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get user details
    const { data: userData, error: userError } =
      await adminClient.auth.getUser(authToken);
    if (userError || !userData?.user?.id) {
      return null;
    }

    const userId = userData.user.id;

    // Get subscription tier
    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    // Default to free tier if no subscription found
    const tier = subscription?.tier || "free";

    // Get features for this tier
    const { data: features } = await adminClient
      .from("subscription_features")
      .select("*")
      .eq("tier", tier)
      .single();

    if (!features) {
      // Return default free features if no specific features found
      return {
        tier: "free",
        maxDigests: 3,
        allowedFrequencies: ["daily", "weekly"],
        customTemplates: false,
        prioritySupport: false,
        customApiAccess: false,
        advancedFiltering: false,
      };
    }

    // Convert from database schema to our interface
    return {
      tier: features.tier,
      maxDigests: features.max_digests,
      allowedFrequencies: features.allowed_frequencies,
      customTemplates: features.custom_templates,
      prioritySupport: features.priority_support,
      customApiAccess: features.custom_api_access,
      advancedFiltering: features.advanced_filtering,
    };
  } catch (err) {
    console.error("Error fetching subscription features:", err);
    return null;
  }
}
