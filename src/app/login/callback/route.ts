import { NextRequest, NextResponse } from "next/server";

// This route will redirect all auth callbacks to our new path
export const dynamic = "force-dynamic";

// Handle all auth requests
// Helper function for redirecting to the alt path
function redirectToAlt(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  const redirectUrl = new URL(
    `/login/callback-alt${searchParams ? "?" + searchParams : ""}`,
    url.origin,
  );
  console.log(`Redirecting auth callback to: ${redirectUrl.toString()}`);

  return NextResponse.redirect(redirectUrl);
}

// Handle GET requests (used by both OAuth and magic links)
export async function GET(request: NextRequest) {
  return redirectToAlt(request);
}

// Handle POST requests (sometimes used by Supabase auth)
export async function POST(request: NextRequest) {
  return redirectToAlt(request);
}
