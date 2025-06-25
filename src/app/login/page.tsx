"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleMagicLinkLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      // Create a full absolute URL for the callback
      const redirectUrl = new URL(
        "/login/callback-alt",
        window.location.origin,
      ).toString();

      // Send the magic link email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          // These options help ensure proper behavior with Supabase auth
          shouldCreateUser: true,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("Magic link sent! Check your email inbox.");
      }
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      // Create a full absolute URL for the callback
      const redirectUrl = new URL(
        "/login/callback-alt",
        window.location.origin,
      ).toString();

      // Start the OAuth flow with Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      // Check for errors
      if (error) {
        setMessage(`Login error: ${error.message}`);
        setLoading(false);
        return;
      }

      // Check if we got a proper URL to redirect to
      if (!data?.url) {
        setMessage("Failed to start login process. Please try again.");
        setLoading(false);
        return;
      }

      // If we get here, we have a URL to redirect to
      window.location.href = data.url;
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Logo in top left corner */}
      <div className="w-full px-6 pt-6 md:pt-8 mb-16">
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image
              src="/digestly_logo.png"
              alt="Digestly Logo"
              width={36}
              height={36}
              priority
            />
            <span className="text-xl font-bold text-gray-800">Digestly</span>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md px-6 mx-auto mt-8">
        {/* Tagline */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Connect. Schedule. Deliver.
          </h1>
          <p className="text-sm text-gray-500">
            Log in to continue to Digestly
          </p>
        </div>

        {/* Google login */}
        <div className="mb-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner className="h-5 w-5 text-gray-500" />
                <span>Connecting...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Magic link login */}
        <form onSubmit={handleMagicLinkLogin} className="space-y-4">
          <div>
            <input
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-md transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner className="h-5 w-5 text-white" />
                <span>Sending...</span>
              </div>
            ) : (
              "Continue with email"
            )}
          </button>

          {message && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
              {message}
            </div>
          )}
        </form>

        {/* Terms */}
        <div className="mt-8 text-center text-xs text-gray-500">
          By continuing, you agree to Digestly&apos;s{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
