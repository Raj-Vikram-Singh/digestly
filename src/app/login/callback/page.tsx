"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Spinner } from "@/components/ui/spinner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Function to handle the Supabase auth callback
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback handler running");

        // Get the code from the URL if it exists
        const code = searchParams?.get("code");

        if (!code) {
          console.log("No auth code found in URL");
          setError("No authentication code found. Please try again.");
          setIsProcessing(false);
          return;
        }

        console.log("Auth code found, creating Supabase client");

        // Create Supabase client
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        console.log("Exchanging code for session");

        // The core of the OAuth flow - exchange the code for a session
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Failed to exchange auth code:", exchangeError);
          setError(`Authentication failed: ${exchangeError.message}`);
          setIsProcessing(false);
          return;
        }

        console.log("Code exchanged successfully, checking for session");

        // Check if we have a valid session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError(`Session error: ${sessionError.message}`);
          setIsProcessing(false);
          return;
        }

        if (sessionData?.session) {
          console.log("Valid session found, redirecting to dashboard");
          router.push("/dashboard");
        } else {
          console.error("No session found after code exchange");
          setError("Failed to create session. Please try again.");
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        setError("An unexpected error occurred. Please try again.");
        setIsProcessing(false);
      }
    };

    // Run the handler as soon as the component mounts
    handleAuthCallback();
  }, [router, searchParams]);

  // Display loading state or error
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-sm px-4 text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-600 font-medium">{error}</div>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Spinner className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
            <p className="text-gray-600">
              {isProcessing
                ? "Processing authentication..."
                : "Redirecting to dashboard..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
