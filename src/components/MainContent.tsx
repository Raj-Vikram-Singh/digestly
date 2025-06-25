"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// This component conditionally applies styling based on the current path
export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isLoginPage = pathname.startsWith("/login");

  return (
    <main className={isLoginPage ? "" : "max-w-5xl mx-auto px-4 py-8"}>
      {children}
    </main>
  );
}
