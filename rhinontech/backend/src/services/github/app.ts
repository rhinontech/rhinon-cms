import jwt from "jsonwebtoken";

/**
 * GitHub App client.
 *
 * The App authenticates as itself with a short-lived RS256 JWT, then exchanges
 * that for an installation token (1h) scoped to the repos the installation was
 * granted. Tokens are cached per installation until a few minutes before expiry.
 *
 * Env:
 *   GITHUB_APP_ID           numeric App ID
 *   GITHUB_APP_SLUG         the app's URL name, for the "Install" link
 *   GITHUB_APP_PRIVATE_KEY  the .pem — raw, with literal "\n", or base64-encoded
 *   GITHUB_WEBHOOK_SECRET   the webhook secret set on the App
 */
const API = "https://api.github.com";

function privateKey(): string | null {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!raw) return null;
  if (raw.includes("BEGIN")) return raw.replace(/\\n/g, "\n");
  return Buffer.from(raw, "base64").toString("utf8");
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_APP_ID && privateKey() && process.env.GITHUB_WEBHOOK_SECRET);
}

export function installUrl(): string | null {
  const slug = process.env.GITHUB_APP_SLUG;
  return slug ? `https://github.com/apps/${slug}/installations/new` : null;
}

function appJwt(): string {
  const key = privateKey();
  if (!process.env.GITHUB_APP_ID || !key) throw new Error("GitHub App is not configured");
  const now = Math.floor(Date.now() / 1000);
  // iat is backdated to absorb clock drift between us and GitHub.
  return jwt.sign({ iat: now - 60, exp: now + 9 * 60, iss: process.env.GITHUB_APP_ID }, key, { algorithm: "RS256" });
}

export class GitHubError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 204) return undefined as T;
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new GitHubError(body?.message || `GitHub ${res.status}`, res.status);
  return body as T;
}

const tokenCache = new Map<number, { token: string; expiresAt: number }>();

async function installationToken(installationId: number): Promise<string> {
  const hit = tokenCache.get(installationId);
  if (hit && hit.expiresAt - Date.now() > 5 * 60 * 1000) return hit.token;
  const out = await request<{ token: string; expires_at: string }>(
    `/app/installations/${installationId}/access_tokens`,
    appJwt(),
    { method: "POST" }
  );
  tokenCache.set(installationId, { token: out.token, expiresAt: new Date(out.expires_at).getTime() });
  return out.token;
}

/** Call the REST API as an installation. */
export async function asInstallation<T>(installationId: number, path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, await installationToken(installationId), init);
}

export interface AvailableRepo {
  id: number;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  installationId: number;
  htmlUrl: string;
}

/** Every repo any installation of the App can see — the picker when linking a project. */
export async function listAvailableRepos(): Promise<AvailableRepo[]> {
  const installs = await request<{ id: number }[]>("/app/installations?per_page=100", appJwt());
  const repos: AvailableRepo[] = [];
  for (const inst of installs) {
    for (let page = 1; page <= 10; page++) {
      const out = await asInstallation<{ repositories: any[] }>(
        inst.id,
        `/installation/repositories?per_page=100&page=${page}`
      );
      for (const r of out.repositories) {
        repos.push({
          id: r.id,
          fullName: r.full_name,
          private: r.private,
          defaultBranch: r.default_branch,
          installationId: inst.id,
          htmlUrl: r.html_url,
        });
      }
      if (out.repositories.length < 100) break;
    }
  }
  return repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
}
