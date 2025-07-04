import { createClient } from "@supabase/supabase-js";
import { getNotionClient } from "@/lib/notion";
import { NextResponse } from "next/server";

function formatRowsAsHtmlTable(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "<p>No data found.</p>";
  const columns = Object.keys(rows[0]);
  return `
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <thead>
        <tr>${columns.map((col) => `<th>${col}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${columns.map((col) => `<td>${row[col] ?? ""}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

async function sendDigest({
  dbId,
  email,
  notionToken,
}: {
  dbId: string;
  email: string;
  notionToken: string;
}) {
  const notion = getNotionClient(notionToken);
  // Fetch up to 20 rows for the digest
  const pages = await notion.databases.query({
    database_id: dbId,
    page_size: 20,
  });
  const rows = (pages.results as Record<string, unknown>[]).map((page) => {
    const flat: Record<string, unknown> = {};
    const properties = page.properties as Record<string, unknown>;
    Object.entries(properties).forEach(([key, prop]) => {
      if (
        typeof prop === "object" &&
        prop !== null &&
        "type" in prop &&
        typeof (prop as { type: unknown }).type === "string"
      ) {
        const type = (prop as { type: string }).type;
        if (
          type === "title" &&
          "title" in prop &&
          Array.isArray((prop as Record<string, unknown>)["title"])
        ) {
          const titleArr = (prop as Record<string, unknown>)[
            "title"
          ] as unknown[];
          if (
            titleArr.length > 0 &&
            typeof titleArr[0] === "object" &&
            titleArr[0] !== null &&
            "plain_text" in (titleArr[0] as object) &&
            typeof (titleArr[0] as Record<string, unknown>)["plain_text"] ===
              "string"
          ) {
            flat[key] = (titleArr[0] as { plain_text: string }).plain_text;
          } else {
            flat[key] = "";
          }
        } else if (
          type === "rich_text" &&
          "rich_text" in prop &&
          Array.isArray((prop as Record<string, unknown>)["rich_text"])
        ) {
          const richArr = (prop as Record<string, unknown>)[
            "rich_text"
          ] as unknown[];
          if (
            richArr.length > 0 &&
            typeof richArr[0] === "object" &&
            richArr[0] !== null &&
            "plain_text" in (richArr[0] as object) &&
            typeof (richArr[0] as Record<string, unknown>)["plain_text"] ===
              "string"
          ) {
            flat[key] = (richArr[0] as { plain_text: string }).plain_text;
          } else {
            flat[key] = "";
          }
        } else if (
          type === "select" &&
          "select" in prop &&
          typeof (prop as Record<string, unknown>)["select"] === "object" &&
          (prop as Record<string, unknown>)["select"] !== null &&
          typeof (
            (prop as { select: { name?: unknown } | null }).select as {
              name?: unknown;
            } | null
          )?.name === "string"
        ) {
          flat[key] =
            (prop as { select: { name?: string } | null }).select?.name || "";
        } else if (
          type === "multi_select" &&
          "multi_select" in prop &&
          Array.isArray((prop as Record<string, unknown>)["multi_select"])
        ) {
          flat[key] = (prop as { multi_select: unknown[] }).multi_select
            .map((s) =>
              typeof s === "object" && s !== null && "name" in s
                ? (s as { name?: string }).name
                : undefined,
            )
            .filter(Boolean)
            .join(", ");
        } else if (
          type === "number" &&
          "number" in prop &&
          (typeof (prop as Record<string, unknown>)["number"] === "number" ||
            (prop as Record<string, unknown>)["number"] === null)
        ) {
          flat[key] = (prop as { number?: number | null }).number;
        } else if (
          type === "checkbox" &&
          "checkbox" in prop &&
          typeof (prop as Record<string, unknown>)["checkbox"] === "boolean"
        ) {
          flat[key] = (prop as { checkbox: boolean }).checkbox ? "Yes" : "No";
        } else if (
          type === "date" &&
          "date" in prop &&
          typeof (prop as Record<string, unknown>)["date"] === "object" &&
          (prop as Record<string, unknown>)["date"] !== null &&
          typeof (
            (prop as { date: { start?: unknown } | null }).date as {
              start?: unknown;
            } | null
          )?.start === "string"
        ) {
          flat[key] =
            (prop as { date: { start?: string } | null }).date?.start || "";
        } else if (
          type === "people" &&
          "people" in prop &&
          Array.isArray((prop as Record<string, unknown>)["people"])
        ) {
          flat[key] = (prop as { people: unknown[] }).people
            .map((p) =>
              typeof p === "object" && p !== null
                ? (p as { name?: string; id?: string }).name ||
                  (p as { name?: string; id?: string }).id
                : undefined,
            )
            .filter(Boolean)
            .join(", ");
        } else if (
          type === "email" &&
          "email" in prop &&
          (typeof (prop as Record<string, unknown>)["email"] === "string" ||
            (prop as Record<string, unknown>)["email"] === null)
        ) {
          flat[key] = (prop as { email?: string | null }).email || "";
        } else if (
          type === "url" &&
          "url" in prop &&
          (typeof (prop as Record<string, unknown>)["url"] === "string" ||
            (prop as Record<string, unknown>)["url"] === null)
        ) {
          flat[key] = (prop as { url?: string | null }).url || "";
        } else if (
          type === "phone_number" &&
          "phone_number" in prop &&
          (typeof (prop as Record<string, unknown>)["phone_number"] ===
            "string" ||
            (prop as Record<string, unknown>)["phone_number"] === null)
        ) {
          flat[key] =
            (prop as { phone_number?: string | null }).phone_number || "";
        } else {
          flat[key] = "";
        }
      } else {
        flat[key] = "";
      }
    });
    return flat;
  });

  // Send email using Resend
  const html = formatRowsAsHtmlTable(rows);
  const subject = "Your Notion Database Digest";
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing Resend API key");
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Digestly <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    }),
  });
  if (!emailRes.ok) {
    const err = await emailRes.json();
    throw new Error(err.error || "Failed to send email");
  }
  return true;
}

export async function GET(req: Request) {
  // Check for API key authorization
  const authHeader = req.headers.get("authorization");
  const cronApiKey = process.env.CRON_API_KEY;

  // Require API key to be set in environment and match the request
  if (!cronApiKey || authHeader !== `Bearer ${cronApiKey}`) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  // Connect to Supabase
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Calculate time window for schedules due since last run
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Get the current time and time window (default: last 15 minutes)
  const currentTime = now.toISOString().slice(11, 16); // 'HH:MM'

  // For once-per-day cron, use a wider window to catch any schedules due today
  // For frequent crons, you can use a smaller window (e.g., 15-20 minutes)

  // Create a time 24 hours ago (window)
  const windowMinutes = 24 * 60; // 24 hours
  const windowTime = new Date(now);
  windowTime.setMinutes(windowTime.getMinutes() - windowMinutes);
  const windowTimeStr = windowTime.toISOString().slice(11, 16); // 'HH:MM'

  // First, check all schedules to debug
  // Get schedules that need to be processed

  // Get all active schedules due in the time window
  const { data: schedules, error } = await adminClient
    .from("schedules")
    .select("*")
    .eq("status", "active")
    .lte("start_date", currentDate)
    .or(`end_date.is.null,end_date.gte.${currentDate}`)
    // Match time_of_day within our window
    .gte("time_of_day", windowTimeStr)
    .lte("time_of_day", currentTime);

  if (error) {
    return NextResponse.json(
      { error: "Error fetching schedules" },
      { status: 500 },
    );
  }

  for (const schedule of schedules || []) {
    // Fetch user's Notion token
    const { data: profile } = await adminClient
      .from("profiles")
      .select("notion_access_token")
      .eq("id", schedule.user_id)
      .single();
    if (!profile?.notion_access_token) {
      continue;
    }
    // Call your sendDigest logic (reuse your API code)
    try {
      await sendDigest({
        dbId: schedule.db_id,
        email: schedule.email,
        notionToken: profile.notion_access_token,
      });
    } catch {
      // Optionally: log failure
    }
  }

  return NextResponse.json(
    {
      message: "Scheduled digests processed",
      processed: schedules?.length || 0,
      window: { start: windowTimeStr, end: currentTime },
    },
    { status: 200 },
  );
}

export const dynamic = "force-dynamic";
