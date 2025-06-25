"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

export function LogoLink() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    async function checkAuth() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch {
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, []);

  // Link to dashboard if authenticated, otherwise link to home
  const linkPath = isAuthenticated ? "/dashboard" : "/";

  return (
    <Link href={linkPath} className="flex items-center gap-2 group">
      <Image
        src="/digestly_logo.png"
        alt="Digestly Logo"
        width={32}
        height={32}
        className="transition-transform group-hover:scale-105"
        priority
      />
      <span className="font-bold text-xl tracking-tight text-blue-700 group-hover:text-blue-800 transition">
        Digestly
      </span>
    </Link>
  );
}
