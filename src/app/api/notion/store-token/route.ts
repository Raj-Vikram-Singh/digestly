import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateCsrfHeader } from "@/lib/csrf-protection";
import { encrypt } from "@/lib/encryption";

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
        { error: "User not authenticated" },
        { status: 401 },
      );
    }
    const body = await req.json();
    const { code } = body;
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    const redirect_uri = process.env.NOTION_REDIRECT_URI;
    const client_id = process.env.NOTION_CLIENT_ID;
    const client_secret = process.env.NOTION_CLIENT_SECRET;

    // Exchange code for access token
    const notionPayload = {
      grant_type: "authorization_code",
      code,
      redirect_uri,
    };
    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      },
      body: JSON.stringify(notionPayload),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      // Don't expose detailed error information from external APIs
      return NextResponse.json(
        {
          error:
            "Failed to exchange authorization code. Please try reconnecting to Notion.",
        },
        { status: 400 },
      );
    }
    // Use Supabase admin client to get user info
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: userData, error: userError } =
      await adminClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }
    const userId = userData.user.id;

    // Encrypt the Notion access token before storing
    const encryptedToken = encrypt(data.access_token);

    // Store the encrypted Notion token in the profiles table
    const { error } = await adminClient
      .from("profiles")
      .upsert({ id: userId, notion_access_token: encryptedToken });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    // Log the error server-side for debugging, but don't expose details to client
    console.error("Notion token exchange error:", err);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing your request. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Remove Notion token from user profile and pause all schedules
  try {
    // Validate CSRF token
    if (!validateCsrfHeader(req)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: userData, error: userError } =
      await adminClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }
    const userId = userData.user.id;
    // Remove the Notion token from the profiles table
    const { error } = await adminClient
      .from("profiles")
      .update({ notion_access_token: null })
      .eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Pause all schedules for this user
    const { error: pauseError } = await adminClient
      .from("schedules")
      .update({ status: "paused" })
      .eq("user_id", userId)
      .neq("status", "paused");
    if (pauseError) {
      return NextResponse.json({ error: pauseError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    // Log the error server-side for debugging, but don't expose details to client
    console.error("Notion disconnect error:", err);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing your request. Please try again.",
      },
      { status: 500 },
    );
  }
}
