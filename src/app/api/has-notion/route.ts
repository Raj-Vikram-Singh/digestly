import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ notionConnected: false });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: user, error: userError } =
    await adminClient.auth.getUser(token);

  if (userError || !user?.user?.id) {
    return NextResponse.json({ notionConnected: false });
  }

  const userId = user.user.id;

  const { data } = await adminClient
    .from("profiles")
    .select("notion_access_token")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    notionConnected: !!data?.notion_access_token,
  });
}
