"use client";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/SignOutButton";

export function AppHeaderSignOut() {
  const pathname = usePathname() || "";
  // Don't show sign out button on landing page, privacy, or terms pages
  if (
    pathname === "/" ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")
  ) {
    return null;
  }
  return <SignOutButton />;
}
