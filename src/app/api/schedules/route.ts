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

// GET: List schedules for the user
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

  const { data, error } = await adminClient
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedules: data });
}
