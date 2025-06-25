"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// This component conditionally renders children based on path
export function ConditionalHeader({
  children,
  excludePaths = [],
  includePaths = [],
}: {
  children: ReactNode;
  excludePaths?: string[];
  includePaths?: string[];
}) {
  const pathname = usePathname() || "";

  // If includePaths is provided and not empty, only show on these paths
  if (includePaths.length > 0) {
    const shouldInclude = includePaths.some((path) =>
      pathname.startsWith(path),
    );
    if (!shouldInclude) {
      return null;
    }
  }

  // If excludePaths is provided, hide on these paths
  if (excludePaths.length > 0) {
    const shouldExclude = excludePaths.some((path) =>
      pathname.startsWith(path),
    );
    if (shouldExclude) {
      return null;
    }
  }

  return <>{children}</>;
}
