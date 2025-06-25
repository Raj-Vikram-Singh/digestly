"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

export default function AuthDebugPage() {
  const searchParams = useSearchParams();
  const [sessionStatus, setSessionStatus] = useState<string>(
    "Checking session...",
  );
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [supabaseEnv, setSupabaseEnv] = useState<{
    url?: string;
    key?: string;
  }>({});

  useEffect(() => {
    // Collect all URL parameters
    const params: Record<string, string> = {};
    if (searchParams) {
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    setQueryParams(params);

    // Check Supabase environment
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setSupabaseEnv({
      url: url ? url.substring(0, 12) + "..." : "Not set",
      key: key ? key.substring(0, 8) + "..." : "Not set",
    });

    // Check session status if possible
    const checkSession = async () => {
      try {
        if (!url || !key) {
          setSessionStatus("Cannot check session - missing Supabase config");
          return;
        }

        const supabase = createBrowserClient(url, key);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setSessionStatus(`Session error: ${error.message}`);
          return;
        }

        if (data?.session) {
          setSessionStatus("Active session found");
        } else {
          setSessionStatus("No active session");
        }
      } catch (err) {
        setSessionStatus(
          `Error checking session: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };

    checkSession();
  }, [searchParams]);

  const handleExchangeCode = async () => {
    const code = searchParams?.get("code");
    if (!code) {
      alert("No code parameter found in URL");
      return;
    }

    try {
      setSessionStatus("Attempting to exchange code...");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setSessionStatus(`Code exchange error: ${error.message}`);
      } else {
        setSessionStatus("Code exchanged successfully!");

        // Check the session again
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSessionStatus(
            "Session created! You can now redirect to the dashboard.",
          );
        } else {
          setSessionStatus("Code exchanged but no session found.");
        }
      }
    } catch (err) {
      setSessionStatus(
        `Exchange error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Auth Debugger</h1>

        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="font-semibold text-lg mb-2">Session Status</h2>
          <div className="font-mono bg-gray-100 p-2 rounded">
            {sessionStatus}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">URL Parameters</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(queryParams, null, 2)}
          </pre>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Supabase Environment</h2>
          <pre className="bg-gray-100 p-3 rounded">
            {JSON.stringify(supabaseEnv, null, 2)}
          </pre>
        </div>

        <div className="flex flex-col gap-4">
          {queryParams.code && (
            <button
              onClick={handleExchangeCode}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Manually Exchange Code for Session
            </button>
          )}

          <Link
            href="/dashboard"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/login"
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-center"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
