// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getNotionAuthUrl } from "@/lib/notion-auth-url";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<unknown>(null);
  const [notionConnected, setNotionConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuthAndNotion() {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (!session) {
        router.replace("/login");
        return;
      }

      // Check if Notion is connected
      const res = await fetch("/api/has-notion", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const json = await res.json();
      setNotionConnected(json.notionConnected === true);

      setLoading(false);

      // If both session and Notion connected, redirect to dashboard
      if (session && json.notionConnected === true) {
        router.replace("/dashboard");
      }
    }
    checkAuthAndNotion();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (session && notionConnected === false) {
    // User is logged in but Notion not connected
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Welcome to Digestly 🚀</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          Connect your Notion to start!
        </p>
        <Button onClick={() => (window.location.href = getNotionAuthUrl())}>
          Connect with Notion
        </Button>
      </main>
    );
  }

  // If redirected, return nothing.
  return null;
}
