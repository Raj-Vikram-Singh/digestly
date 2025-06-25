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
      className="rounded-md bg-gray-100 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
      onClick={handleSignOut}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V8.5a.5.5 0 00-1 0V15H4V5h8.5a.5.5 0 000-1H4a1 1 0 00-1 1z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M6.854 10.146a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l4-4a.5.5 0 00-.708-.708L9 11.293V6.5a.5.5 0 00-1 0v4.793l-1.146-1.147z"
          clipRule="evenodd"
        />
      </svg>
      Sign Out
    </button>
  );
}
