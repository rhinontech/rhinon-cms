// IndexNow ownership proof. The backend pings api.indexnow.org with
// keyLocation=<site>/indexnow.txt when a blog is published; Bing and the other
// IndexNow engines fetch this file and check it matches the key they were sent.
// The key is public by design (anyone can read it here), so it lives in code;
// INDEXNOW_KEY can override it, and must then match the backend's value.
const DEFAULT_KEY = "a5475ae866cf66166a98a29eeed3c8f3";

export const dynamic = "force-static";

export function GET() {
  return new Response(process.env.INDEXNOW_KEY || DEFAULT_KEY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
