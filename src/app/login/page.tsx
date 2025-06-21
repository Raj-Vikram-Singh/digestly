"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage("Error: " + error.message);
    else setMessage("Check your email for a magic link!");
    setLoading(false);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-6 font-bold">Login or Sign Up</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-80">
        <input
          className="border p-2 rounded"
          placeholder="Your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </main>
  );
}
