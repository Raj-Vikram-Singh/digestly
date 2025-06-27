"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    // Notion signout (remove token)
    try {
      const { addCsrfHeaders } = await import("@/lib/csrf-client");
      await fetch(
        "/api/notion/store-token",
        addCsrfHeaders({ method: "DELETE" }),
      );
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
      className="rounded-md bg-gray-100 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
