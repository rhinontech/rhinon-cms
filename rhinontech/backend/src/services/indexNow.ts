/**
 * Tells IndexNow (Bing, Yandex, Seznam, Naver — and the AI search products built
 * on Bing's index) that URLs changed, so they recrawl within minutes instead of
 * waiting for the sitemap. Google does not participate; it still finds new posts
 * through the sitemap and Search Console.
 *
 * The site proves ownership by serving the key at `keyLocation` — rhinonlabs
 * does that at /indexnow.txt with the same key. Best-effort: a failed ping never blocks a publish.
 */
/**
 * Public by design — rhinonlabs serves the same value at /indexnow.txt
 * (rhinonlabs/app/indexnow.txt/route.ts). Override both with INDEXNOW_KEY.
 */
const DEFAULT_KEY = "a5475ae866cf66166a98a29eeed3c8f3";

export async function pingIndexNow(siteUrl: string | null | undefined, paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY || DEFAULT_KEY;
  if (!key || !siteUrl || !paths.length) return;
  try {
    const base = siteUrl.replace(/\/+$/, "");
    const host = new URL(base).host;
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${base}/indexnow.txt`,
        urlList: paths.map((p) => `${base}${p.startsWith("/") ? p : `/${p}`}`),
      }),
    });
    if (res.status >= 300) console.warn(`[IndexNow] ${host} responded ${res.status}`);
  } catch (err: any) {
    console.warn("[IndexNow] Ping failed:", err.message);
  }
}
