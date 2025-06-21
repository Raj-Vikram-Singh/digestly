// lib/notion.ts
import { Client } from "@notionhq/client";

/**
 * Returns a Notion API client instance using the user's access token.
 */
export function getNotionClient(accessToken: string) {
  return new Client({ auth: accessToken });
}
