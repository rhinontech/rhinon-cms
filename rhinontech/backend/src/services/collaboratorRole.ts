import { Permission, Role } from "../models";

/**
 * The locked role every external collaborator gets.
 *
 * It carries exactly one grant: `work:read`. That is not a privilege — it is the
 * key to the route guards on /work, /tasks and /workflow, which the portal
 * cannot function without. A guest's real limits come from three other places:
 *
 *   - GUEST_ALLOWED_MOUNTS in the auth middleware (which routers they may touch)
 *   - the ProjectMember allowlist (which projects exist for them)
 *   - Task.guestVisible (which tasks inside those projects they may see)
 *
 * hasPermission() also hard-returns false for guests, so this grant can never
 * become a management bypass.
 *
 * Idempotent, so it is safe to call on every boot and on every invite.
 */
export async function ensureCollaboratorRole(): Promise<Role> {
  const [role] = await Role.findOrCreate({
    where: { slug: "collaborator" },
    defaults: { name: "Collaborator", slug: "collaborator" } as any,
  });

  const workRead = await Permission.findOne({ where: { name: "work:read" } });
  if (workRead) {
    const already = await (role as any).hasPermission(workRead);
    if (!already) await (role as any).addPermission(workRead);
  }

  return role;
}
