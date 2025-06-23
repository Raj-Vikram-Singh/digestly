"use client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    // Notion signout (remove token)
    try {
      await fetch("/api/notion/store-token", { method: "DELETE" });
    } catch {}
    // Supabase signout
    if (typeof window !== "undefined") {
      const { getSupabaseBrowser } = await import("@/lib/auth");
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    }
    router.replace("/login");
  }

  return (
    <button
      type="button"
      className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-200 transition"
      onClick={handleSignOut}
    >
      Sign Out (Digestly)
    </button>
  );
}
