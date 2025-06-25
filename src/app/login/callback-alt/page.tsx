"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Initializing authentication...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect will handle the authentication callback
    const handleCallback = async () => {
      try {
        setStatus("Processing authentication...");

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        // First check for an existing session - this can work for magic links
        const { data } = await supabase.auth.getSession();
        const existingSession = data?.session;

        if (existingSession) {
          setStatus("Session found, redirecting to dashboard...");
          setTimeout(() => router.push("/dashboard"), 1000);
          return;
        }

        // No session yet, check the URL parameters
        const code = searchParams?.get("code");
        const type = searchParams?.get("type");
        const accessToken = searchParams?.get("access_token");
        const refreshToken = searchParams?.get("refresh_token");

        // Special handling for magic links - they sometimes provide tokens directly
        if ((type === "recovery" || type === "magiclink") && accessToken) {
          setStatus("Processing magic link authentication...");

          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (setSessionError) {
            setError(`Failed to authenticate: ${setSessionError.message}`);
            return;
          }

          // Redirect after successful magic link auth
          setTimeout(() => router.push("/dashboard"), 1000);
          return;
        }

        // OAuth code exchange for Google login
        if (code) {
          setStatus("Processing Google authentication...");

          try {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              setError(`Authentication failed: ${exchangeError.message}`);
              return;
            }

            // Check if we have a session after code exchange
            const { data: sessionData } = await supabase.auth.getSession();
            const newSession = sessionData?.session;

            if (newSession) {
              setStatus("Authentication successful! Redirecting...");
              setTimeout(() => router.push("/dashboard"), 1000);
            } else {
              setError(
                "Authentication completed but no session was created. Please try again.",
              );
            }
          } catch (exchangeErr) {
            setError(
              `Authentication error: ${exchangeErr instanceof Error ? exchangeErr.message : "Unknown error"}`,
            );
          }
          return;
        } else if (type === "magiclink" || type === "recovery") {
          // Handle magic link flow without tokens
          setStatus("Processing magic link...");

          // Give Supabase client a moment to process any auth parameters
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Check for a session again
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            setStatus("Authentication successful! Redirecting...");
            setTimeout(() => router.push("/dashboard"), 1000);
            return;
          }
        }

        // If we get here and we don't have anything to work with
        if (
          !code &&
          !accessToken &&
          !(type === "magiclink" || type === "recovery")
        ) {
          setError(
            "Missing authentication information. Please try logging in again.",
          );
          return;
        }

        // Final session check
        const { data: finalData, error: finalError } =
          await supabase.auth.getSession();

        if (finalError) {
          setError(`Session error: ${finalError.message}`);
          return;
        }

        if (finalData?.session) {
          setStatus("Authentication successful! Redirecting...");
          setTimeout(() => router.push("/dashboard"), 1000);
        } else {
          setError(
            "Authentication completed but no session was created. Please try logging in again.",
          );
        }
      } catch {
        setError("An unexpected error occurred during authentication.");
      }
    };

    // Call the handler when the component mounts
    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md px-4 text-center">
        {error ? (
          <div className="space-y-4">
            <svg
              className="h-12 w-12 text-red-500 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-medium mb-2">Authentication Error</h2>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <h2 className="text-xl font-medium mb-2">
              Completing Authentication
            </h2>
            <p className="text-gray-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
