"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/auth";
import { useRouter } from "next/navigation";

type NotionDatabase = {
  id: string;
  title?: { plain_text: string }[];
  object: string;
  [key: string]: unknown;
};

export default function Dashboard() {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSessionAndFetch() {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }
      setSessionChecked(true);

      // Fetch databases
      try {
        const res = await fetch("/api/notion/databases", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch databases");
          setDatabases([]);
        } else {
          const cleaned = (data.results || []).map((db: NotionDatabase) => ({
            id: db.id,
            title:
              Array.isArray(db.title) &&
              db.title.length > 0 &&
              typeof db.title[0].plain_text === "string"
                ? db.title[0].plain_text
                : "Untitled Database",
            object: db.object,
          }));
          setDatabases(cleaned);
          setError(null);
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Unknown error");
        setDatabases([]);
      } finally {
        setLoading(false);
      }
    }
    checkSessionAndFetch();
  }, [router]);

  if (!sessionChecked) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Checking authentication...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-4">Your Notion Databases</h2>
      {loading && <p>Loading databases…</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && databases.length === 0 && !error && (
        <p>
          No databases found. Make sure you&apos;ve shared at least one database
          with your Notion integration.
        </p>
      )}
      <ul className="space-y-4">
        {databases.map((db) => (
          <li key={db.id} className="border p-4 rounded shadow">
            <div className="font-semibold">
              {typeof db.title === "string" ? db.title : "Untitled Database"}
            </div>
            <div className="text-xs text-muted-foreground">ID: {db.id}</div>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex gap-2">
        <Button onClick={() => (window.location.href = "/")}>
          Back to Home
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const supabase = getSupabaseBrowser();
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Sign Out
        </Button>
      </div>
    </main>
  );
}
