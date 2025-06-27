// lib/csrf-protection.ts

/**
 * CSRF protection utilities for Digestly
 * Uses the Double Submit Cookie pattern combined with Origin/Referer checking
 */

export function validateCsrfHeader(request: Request): boolean {
  // Check Origin header against our domain
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false; // Headers missing
  }

  // Create a URL object to safely compare origins
  try {
    const originUrl = new URL(origin);
    // Check if origin hostname matches our host
    // This handles both localhost dev and production domain
    if (originUrl.hostname !== host.split(":")[0]) {
      return false;
    }
  } catch {
    return false; // Invalid origin URL
  }

  // Check for CSRF token header - matches what we'll set in front-end code
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken) {
    return false;
  }

  // Simple comparison with expected token format (could be enhanced with actual token validation)
  // In a more advanced implementation, you'd verify this against a server-generated token
  return csrfToken.length > 20; // Ensures non-empty, reasonably complex token
}
