"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function AppHeaderNav() {
  const pathname = usePathname() || "";
  const isLanding = pathname === "/";

  return (
    <nav className="hidden md:flex gap-6 text-sm text-muted-foreground items-center">
      {isLanding ? (
        <>
          <a href="#features" className="hover:text-blue-700 transition">
            Features
          </a>
          <a href="#pricing" className="hover:text-blue-700 transition">
            Pricing
          </a>
          <a href="#faq" className="hover:text-blue-700 transition">
            FAQ
          </a>
          <Link
            href="/login"
            className="ml-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
          >
            Login
          </Link>
        </>
      ) : (
        <>
          <Link href="/dashboard" className="hover:text-blue-700 transition">
            Dashboard
          </Link>
          <Link href="/" className="hover:text-blue-700 transition">
            Home
          </Link>
        </>
      )}
    </nav>
  );
}
