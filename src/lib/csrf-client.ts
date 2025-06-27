// lib/csrf-client.ts
"use client";

/**
 * Client-side CSRF protection utilities
 * Generates and attaches CSRF tokens to all fetch requests
 */

// Generate a CSRF token (simple implementation)
function generateCsrfToken(): string {
  const timestamp = new Date().getTime().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Get stored CSRF token or generate a new one
 */
export function getCsrfToken(): string {
  // Use a single token per session for simplicity
  let token = sessionStorage.getItem("csrfToken");

  if (!token) {
    token = generateCsrfToken();
    sessionStorage.setItem("csrfToken", token);
  }

  return token;
}

/**
 * Adds CSRF protection headers to fetch requests
 * @param options - Standard fetch options
 */
export function addCsrfHeaders(options: RequestInit = {}): RequestInit {
  const csrfToken = getCsrfToken();

  // Create headers if they don't exist
  const headers = options.headers || {};
  const updatedHeaders = {
    ...headers,
    "x-csrf-token": csrfToken,
  };

  return {
    ...options,
    headers: updatedHeaders,
    // Add credentials to ensure cookies are sent
    credentials: "include",
  };
}
