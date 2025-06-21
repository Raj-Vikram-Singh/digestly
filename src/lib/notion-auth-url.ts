// lib/notion-auth-url.ts
export function getNotionAuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
    response_type: "code",
    owner: "user",
    redirect_uri: process.env.NEXT_PUBLIC_NOTION_REDIRECT_URI!, // <-- use NEXT_PUBLIC_ here
    ...(state ? { state } : {}),
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}
