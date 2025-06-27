// lib/validation.ts

/**
 * Input validation and sanitization utilities
 */

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Sanitize string input (remove potentially harmful content)
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  // Basic HTML sanitization
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Validate subscription tier
export function isValidTier(tier: string): boolean {
  return ["free", "pro", "enterprise"].includes(tier);
}

// Validate schedule frequency
export function isValidFrequency(frequency: string, tier: string): boolean {
  switch (tier) {
    case "free":
      return ["daily", "weekly"].includes(frequency);
    case "pro":
      return ["daily", "weekly", "monthly"].includes(frequency);
    case "enterprise":
      return ["daily", "weekly", "monthly", "custom"].includes(frequency);
    default:
      return ["daily", "weekly"].includes(frequency);
  }
}

// Validate time format (HH:MM)
export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

// Validate date format (YYYY-MM-DD)
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  // Check if it's actually a valid date
  const dateObj = new Date(date);
  return dateObj.toString() !== "Invalid Date";
}

// Validate schedule status
export function isValidStatus(status: string): boolean {
  return ["active", "paused"].includes(status);
}

// Sanitize and validate ID
export function isValidId(id: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}
