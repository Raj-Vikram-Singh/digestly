import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

console.log("[store-token] API route loaded");

export async function POST(req: NextRequest) {
  console.log("[store-token] POST handler called");
  try {
    const authHeader = req.headers.get("authorization");
    console.log("[store-token] Authorization header:", authHeader);
    const token = authHeader?.split(" ")[1];
    if (!token) {
      console.log("[store-token] No auth token provided");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }
    const body = await req.json();
    console.log("[store-token] Request body:", body);
    const { code } = body;
    if (!code) {
      console.log("[store-token] No code provided in request body");
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    const redirect_uri = process.env.NOTION_REDIRECT_URI;
    const client_id = process.env.NOTION_CLIENT_ID;
    const client_secret = process.env.NOTION_CLIENT_SECRET;
    console.log("[store-token] redirect_uri:", redirect_uri);
    console.log("[store-token] client_id:", client_id);
    console.log("[store-token] client_secret present:", !!client_secret);
    // Exchange code for access token
    const notionPayload = {
      grant_type: "authorization_code",
      code,
      redirect_uri,
    };
    console.log("[store-token] Payload sent to Notion:", notionPayload);
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
    console.log("[store-token] Notion response status:", tokenRes.status);
    console.log("[store-token] Notion response data:", data);
    if (!tokenRes.ok) {
      console.log("[store-token] Notion token exchange failed");
      return NextResponse.json(
        { error: "Failed to exchange code", details: data },
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
    console.log("[store-token] Supabase getUser result:", userData, userError);
    if (userError || !userData?.user?.id) {
      console.log("[store-token] User not authenticated via Supabase");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }
    const userId = userData.user.id;
    // Store the Notion token in the profiles table
    const { error } = await adminClient
      .from("profiles")
      .upsert({ id: userId, notion_access_token: data.access_token });
    if (error) {
      console.log("[store-token] Error upserting Notion token:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log(
      "[store-token] Notion token stored successfully for user",
      userId,
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.log("[store-token] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error", details: String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Remove Notion token from user profile and pause all schedules
  try {
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
    return NextResponse.json(
      { error: "Unexpected error", details: String(err) },
      { status: 500 },
    );
  }
}
