import { RepoAccess, User } from "../../models";
import type { RepoPermission } from "../../models/GitHub";
import { GitHubError, asInstallation, listAvailableRepos } from "./app";
import { notify } from "../notifications";

/**
 * Repo access for employees. GitHub can't create accounts for us, so this
 * invites an existing username as a collaborator; GitHub emails the invite.
 * Personal-account repos ignore the permission level (collaborators get write).
 */
const collaboratorPath = (a: RepoAccess) => `/repos/${a.repoFullName}/collaborators/${a.githubLogin}`;

export async function grantRepoAccess(user: User, repoIds: number[], permission: RepoPermission, grantedById: string) {
  const login = user.githubLogin!;
  const wanted = new Set(repoIds);
  const repos = (await listAvailableRepos()).filter((r) => wanted.has(r.id));

  for (const repo of repos) {
    const [row] = await RepoAccess.findOrCreate({
      where: { userId: user.id, repoId: repo.id },
      defaults: {
        userId: user.id, repoId: repo.id, repoFullName: repo.fullName, installationId: repo.installationId,
        githubLogin: login, permission, grantedById,
      },
    });
    try {
      // 201 with an invitation = invite sent; 204 = already a collaborator.
      const invite = await asInstallation<{ id: number } | undefined>(repo.installationId, `/repos/${repo.fullName}/collaborators/${login}`, {
        method: "PUT",
        body: JSON.stringify({ permission }),
      });
      await row.update({
        githubLogin: login, permission, grantedById, error: null,
        status: invite ? "invited" : "active",
        invitationId: invite?.id ?? null,
      });
      await notify({ userIds: [user.id], type: "github.access_granted", title: `You were given access to ${repo.fullName}`, body: invite ? "Accept the invite GitHub emailed you." : null, link: "/profile", actorId: grantedById });
    } catch (err: any) {
      await row.update({ githubLogin: login, permission, status: "failed", error: String(err.message).slice(0, 300) });
    }
  }
}

/** Invites turn active when accepted; GitHub only tells us if we ask. */
export async function listRepoAccess(userId: string): Promise<RepoAccess[]> {
  const rows = await RepoAccess.findAll({ where: { userId }, order: [["repoFullName", "ASC"]] });
  await Promise.all(rows.filter((r) => r.status === "invited").map(async (r) => {
    try {
      await asInstallation(Number(r.installationId), collaboratorPath(r));
      await r.update({ status: "active", invitationId: null });
    } catch {
      /* 404 = not accepted yet */
    }
  }));
  return rows;
}

/** Withdraws the invite and removes the collaborator. The row stays, with the error, if GitHub refuses. */
export async function revokeRepoAccess(row: RepoAccess): Promise<boolean> {
  const inst = Number(row.installationId);
  try {
    if (row.invitationId) {
      await asInstallation(inst, `/repos/${row.repoFullName}/invitations/${row.invitationId}`, { method: "DELETE" }).catch((err) => {
        if (!(err instanceof GitHubError && err.status === 404)) throw err;
      });
    }
    await asInstallation(inst, collaboratorPath(row), { method: "DELETE" }).catch((err) => {
      if (!(err instanceof GitHubError && err.status === 404)) throw err;
    });
    await row.destroy();
    return true;
  } catch (err: any) {
    await row.update({ status: "failed", error: `Could not remove: ${err.message}`.slice(0, 300) });
    await notify({ userIds: [row.grantedById], type: "github.revoke_failed", title: `Couldn't remove ${row.githubLogin} from ${row.repoFullName}`, body: "Remove their access on GitHub by hand.", link: "/employees" });
    console.error(`[GitHub] Revoke ${row.repoFullName}/${row.githubLogin}:`, err.message);
    return false;
  }
}

/** Offboarding: never throws, so a GitHub outage can't block an exit. Failures stay visible on the row. */
export async function revokeAllRepoAccess(userId: string): Promise<number> {
  const rows = await RepoAccess.findAll({ where: { userId } });
  const results = await Promise.all(rows.map(revokeRepoAccess));
  return results.filter(Boolean).length;
}
