// This route is no longer used. The Notion OAuth callback is now handled on the client side at /notion/callback/page.tsx
// and the token is stored via /api/notion/store-token.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect("/");
}
