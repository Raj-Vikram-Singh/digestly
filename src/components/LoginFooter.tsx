"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// This component conditionally renders for login pages only
export function LoginFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isLoginPage = pathname.startsWith("/login");

  if (!isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
