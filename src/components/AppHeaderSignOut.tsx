"use client";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/SignOutButton";

export function AppHeaderSignOut() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <SignOutButton />;
}
