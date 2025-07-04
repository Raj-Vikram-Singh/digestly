"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/auth";

function NotionCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Exchanging code...");

  useEffect(() => {
    async function handleCallback() {
      if (!searchParams) {
        setStatus("Missing search parameters in callback URL.");
        return;
      }
      const code = searchParams.get("code");
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
      if (!session) {
        setStatus("User session not found. Please log in again.");
        router.replace("/login");
        return;
      }
      // Call protected API to store Notion token
      const { addCsrfHeaders } = await import("@/lib/csrf-client");
      const res = await fetch(
        "/api/notion/store-token",
        addCsrfHeaders({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code }),
        }),
      );
      if (res.ok) {
        setStatus("Notion connected! Redirecting to dashboard...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      } else {
        const err = await res.json();
        setStatus(
          "Failed to connect Notion: " + (err.error || "Unknown error"),
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

export default function NotionCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotionCallbackContent />
    </Suspense>
  );
}
