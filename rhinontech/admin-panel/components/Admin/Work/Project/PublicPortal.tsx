"use client";

import { useRouter } from "next/navigation";
import { SideNavProvider } from "@/context/SideNavContext";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { portalPath, projectSlug } from "./portalUrl";

/**
 * The client portal: the project's workspace, read-only and unauthenticated —
 * Table, Board, Gantt, Analytics and Calendar, plus the Bugs & Changes list.
 * The API only serves projects with workspace visibility.
 *
 * The URL's name segment is cosmetic. Once the project loads, a missing or
 * stale one (an old /p/<id> link, a renamed project) is replaced in place.
 */
export function PublicPortal({ projectId, slug }: { projectId: string; slug?: string }) {
  const router = useRouter();
  return (
    <SideNavProvider>
      <div className="h-screen bg-muted/40 p-0 sm:p-3">
        <ProjectWorkspace
          projectId={projectId}
          roleSlug=""
          mode="public"
          onProjectLoaded={(p) => {
            if (slug !== projectSlug(p.name)) router.replace(portalPath(p.name, p.id));
          }}
        />
      </div>
    </SideNavProvider>
  );
}
