// app/api/notion/databases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion";
import { createClient } from "@supabase/supabase-js"; // use supabase-js for client creation

export async function GET(req: NextRequest) {
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

  const { data: user, error: userError } =
    await adminClient.auth.getUser(token);

  if (userError || !user?.user?.id) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 },
    );
  }

  const userId = user.user.id;

  // Get Notion token from profiles table
  const { data, error } = await adminClient
    .from("profiles")
    .select("notion_access_token")
    .eq("id", userId)
    .single();

  if (error || !data?.notion_access_token) {
    return NextResponse.json(
      { error: "No Notion account connected" },
      { status: 401 },
    );
  }

  const notion = getNotionClient(data.notion_access_token);

  try {
    const dbs = await notion.search({
      filter: { property: "object", value: "database" },
      page_size: 10,
    });
    return NextResponse.json({ results: dbs.results });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
