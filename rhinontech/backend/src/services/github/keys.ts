import { execFile } from "child_process";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import type { ProjectRepo } from "../../models";
import { GitHubError, asInstallation } from "./app";

const run = promisify(execFile);

/**
 * Generates an OpenSSH ed25519 key pair with ssh-keygen.
 *
 * Node can make ed25519 keys, but only in PKCS8 PEM, which older ssh/git builds
 * refuse; ssh-keygen's own format is what every client accepts. The private key
 * only touches disk inside a 0700 temp dir that is removed immediately.
 */
export async function generateSshKeyPair(comment: string): Promise<{ publicKey: string; privateKey: string }> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "rk-"));
  try {
    const file = path.join(dir, "id_ed25519");
    await run("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", file]);
    const [privateKey, publicKey] = await Promise.all([
      fsp.readFile(file, "utf8"),
      fsp.readFile(`${file}.pub`, "utf8"),
    ]);
    return { publicKey: publicKey.trim(), privateKey };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

/** Removes a link's deploy key from GitHub. Never throws: unlinking must not hang on GitHub. */
export async function removeDeployKey(link: ProjectRepo): Promise<void> {
  if (!link.deployKeyId) return;
  try {
    await asInstallation(Number(link.installationId), `/repos/${link.repoFullName}/keys/${link.deployKeyId}`, { method: "DELETE" });
  } catch (err: any) {
    // Already gone on GitHub is fine; anything else still shouldn't block unlinking.
    if (!(err instanceof GitHubError && err.status === 404)) console.error("[GitHub] Deploy key delete:", err.message);
  }
}
