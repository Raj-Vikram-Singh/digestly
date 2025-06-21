import { NextRequest, NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion";
import { createClient } from "@supabase/supabase-js";

// Notion property type guards
function isTitleProperty(
  prop: unknown,
): prop is { type: "title"; title: { plain_text: string }[] } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "title" &&
    Array.isArray((prop as { title?: unknown[] }).title)
  );
}
function isRichTextProperty(
  prop: unknown,
): prop is { type: "rich_text"; rich_text: { plain_text: string }[] } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "rich_text" &&
    Array.isArray((prop as { rich_text?: unknown[] }).rich_text)
  );
}
function isSelectProperty(
  prop: unknown,
): prop is { type: "select"; select: { name?: string } | null } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "select"
  );
}
function isMultiSelectProperty(
  prop: unknown,
): prop is { type: "multi_select"; multi_select: { name?: string }[] } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "multi_select" &&
    Array.isArray((prop as { multi_select?: unknown[] }).multi_select)
  );
}
function isNumberProperty(
  prop: unknown,
): prop is { type: "number"; number: number | null } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "number"
  );
}
function isCheckboxProperty(
  prop: unknown,
): prop is { type: "checkbox"; checkbox: boolean } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "checkbox"
  );
}
function isDateProperty(
  prop: unknown,
): prop is { type: "date"; date: { start?: string } | null } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "date"
  );
}
function isPeopleProperty(
  prop: unknown,
): prop is { type: "people"; people: { name?: string; id?: string }[] } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "people" &&
    Array.isArray((prop as { people?: unknown[] }).people)
  );
}
function isEmailProperty(
  prop: unknown,
): prop is { type: "email"; email: string | null } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "email"
  );
}
function isUrlProperty(
  prop: unknown,
): prop is { type: "url"; url: string | null } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "url"
  );
}
function isPhoneNumberProperty(
  prop: unknown,
): prop is { type: "phone_number"; phone_number: string | null } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    (prop as { type?: string }).type === "phone_number"
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const url = new URL(req.url);
  const dbId = url.searchParams.get("id");

  if (!token) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 },
    );
  }
  if (!dbId) {
    return NextResponse.json({ error: "Missing database id" }, { status: 400 });
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
    // Fetch the first 5 pages/rows from the database
    const pages = await notion.databases.query({
      database_id: dbId,
      page_size: 5,
    });
    // Normalize rows: flatten properties for preview
    const rows = (pages.results as Record<string, unknown>[]).map((page) => {
      const flat: Record<string, unknown> = {};
      const properties = page.properties as Record<string, unknown>;
      Object.entries(properties).forEach(([key, prop]) => {
        if (isTitleProperty(prop) && prop.title.length > 0) {
          flat[key] = prop.title[0].plain_text;
        } else if (isRichTextProperty(prop) && prop.rich_text.length > 0) {
          flat[key] = prop.rich_text[0].plain_text;
        } else if (isSelectProperty(prop)) {
          flat[key] = prop.select?.name || "";
        } else if (isMultiSelectProperty(prop)) {
          flat[key] = prop.multi_select.map((s) => s.name).join(", ");
        } else if (isNumberProperty(prop)) {
          flat[key] = prop.number;
        } else if (isCheckboxProperty(prop)) {
          flat[key] = prop.checkbox ? "Yes" : "No";
        } else if (isDateProperty(prop)) {
          flat[key] = prop.date?.start || "";
        } else if (isPeopleProperty(prop)) {
          flat[key] = prop.people.map((p) => p.name || p.id).join(", ");
        } else if (isEmailProperty(prop)) {
          flat[key] = prop.email || "";
        } else if (isUrlProperty(prop)) {
          flat[key] = prop.url || "";
        } else if (isPhoneNumberProperty(prop)) {
          flat[key] = prop.phone_number || "";
        } else {
          flat[key] = "";
        }
      });
      return flat;
    });
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
