// lib/notion.ts
import { Client } from "@notionhq/client";
import { decrypt } from "./encryption";

/**
 * Returns a Notion API client instance using the user's access token.
 * If the token is encrypted, it will attempt to decrypt it first.
 */
export function getNotionClient(accessToken: string) {
  let token = accessToken;

  // Check if the token appears to be encrypted and try to decrypt it
  if (accessToken && accessToken.includes(":")) {
    try {
      token = decrypt(accessToken);
    } catch (error) {
      console.error("Error decrypting Notion token:", error);
      // Fall back to using the token as-is if decryption fails
    }
  }

  return new Client({ auth: token });
}
