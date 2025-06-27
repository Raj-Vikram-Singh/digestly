import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Create a new schedule
export async function POST(req: NextRequest) {
  const { dbId, email, frequency, timeOfDay, timezone, startDate, endDate } =
    await req.json();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

  const insertObj: {
    user_id: string;
    db_id: string;
    email: string;
    frequency: string;
    time_of_day: string;
    timezone: string;
    start_date?: string;
    end_date?: string;
  } = {
    user_id: userId,
    db_id: dbId,
    email,
    frequency,
    time_of_day: timeOfDay,
    timezone,
    start_date: startDate,
  };
  if (endDate) insertObj.end_date = endDate;

  const { data, error } = await adminClient
    .from("schedules")
    .insert([insertObj])
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data });
}

// GET: List schedules for the user (with pagination)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

  // Pagination params
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count, error: countError } = await adminClient
    .from("schedules")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError)
    return NextResponse.json({ error: countError.message }, { status: 500 });

  // Get paginated data
  const { data, error } = await adminClient
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedules: data, total: count });
}

// PATCH: Update schedule (status or full edit)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updateFields } = body;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

  // Defensive: If resuming (status: 'active'), check max digests
  if (updateFields.status === "active") {
    // Get user's subscription tier
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    const tier = sub?.tier || "free";
    // Get max digests for tier
    const { data: features } = await adminClient
      .from("subscription_features")
      .select("max_digests")
      .eq("tier", tier)
      .single();
    const maxDigests = features?.max_digests ?? 3;
    if (maxDigests !== -1) {
      // Count current active schedules (excluding this one if it's already active)
      const { count } = await adminClient
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("id", id);
      if ((count ?? 0) >= maxDigests) {
        return NextResponse.json(
          {
            error: `You are at your schedule limit (${maxDigests}). Upgrade your plan or pause/delete another schedule to resume this one.`,
          },
          { status: 403 },
        );
      }
    }
  }

  const { data, error } = await adminClient
    .from("schedules")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", userId)
    .select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  // Return single object if only one row updated, else array
  if (Array.isArray(data) && data.length === 1) {
    return NextResponse.json({ schedule: data[0] });
  }
  return NextResponse.json({ schedules: data });
}

// DELETE: Delete a schedule
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

  const { error } = await adminClient
    .from("schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
