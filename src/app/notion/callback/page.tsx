"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/auth";

export default function NotionCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Exchanging code...");

  useEffect(() => {
    console.log("[NotionCallbackPage] loaded");
    async function handleCallback() {
      if (!searchParams) {
        setStatus("Missing search parameters in callback URL.");
        return;
      }
      const code = searchParams.get("code");
      console.log("[NotionCallbackPage] code from URL:", code);
      if (!code) {
        setStatus("Missing code in callback URL.");
        return;
      }
      // Wait for Supabase session to be available
      const supabase = getSupabaseBrowser();
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise((res) => setTimeout(res, 300));
      }
      console.log("[NotionCallbackPage] session:", session);
      if (!session) {
        setStatus("User session not found. Please log in again.");
        router.replace("/login");
        return;
      }
      console.log("[NotionCallbackPage] access_token:", session.access_token);
      // Call protected API to store Notion token
      console.log("[NotionCallbackPage] POSTing to /api/notion/store-token");
      const res = await fetch("/api/notion/store-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setStatus("Notion connected! Redirecting to dashboard...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      } else {
        const err = await res.json();
        setStatus(
          "Failed to connect Notion: " + (err.error || "Unknown error"),
        );
        console.log(
          "[NotionCallbackPage] Error from /api/notion/store-token:",
          err,
        );
      }
    }
    handleCallback();
    // eslint-disable-next-line
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Notion Connection</h1>
      <p>{status}</p>
    </main>
  );
}
