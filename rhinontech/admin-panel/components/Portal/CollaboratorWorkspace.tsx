"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";
import { SideNavProvider } from "@/context/SideNavContext";
import { ProjectWorkspace } from "@/components/Admin/Work/Project/ProjectWorkspace";
import { TbFolderOff, TbLoader } from "react-icons/tb";
import type { ProjectSummary } from "@/components/Admin/Work/Project/types";

/**
 * The collaborator shell.
 *
 * Deliberately the SAME workspace internal users get — all six tabs, one set of
 * components, one set of hooks. Scoping is the API's job: /work/projects returns
 * only granted projects and /tasks only guestVisible ones, so a second bespoke
 * UI would have been a parallel thing to keep in sync for no benefit.
 */
export function CollaboratorWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("project");

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  useEffect(() => {
    apiFetch<ProjectSummary[]>("/work/projects")
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  const signOut = () => {
    Cookies.remove("authToken");
    Cookies.remove("permissions");
    window.location.href = "/auth/login";
  };

  if (projects === null) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-stone-400">
        <TbLoader className="mr-2 animate-spin" size={16} /> Loading your workspace…
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <TbFolderOff size={30} className="text-stone-300" />
        <h1 className="text-lg font-semibold text-stone-800">Nothing shared with you yet</h1>
        <p className="max-w-sm text-sm text-stone-500">
          When someone shares a project with you it will appear here. If you were expecting
          access, ask whoever invited you to confirm the project has been shared.
        </p>
        <button onClick={signOut} className="mt-1 text-xs font-medium text-stone-600 underline">
          Sign out
        </button>
      </div>
    );
  }

  // Fall back to the first granted project rather than 404ing on a stale ?project=.
  const activeId = projects.find((p) => p.id === requested)?.id ?? projects[0].id;

  return (
    <SideNavProvider>
      <div className="h-screen p-2 app-backdrop">
        <ProjectWorkspace
          projectId={activeId}
          roleSlug="collaborator"
          mode="collaborator"
          hrefFor={(id) => `/portal?project=${id}`}
          onSignOut={signOut}
        />
      </div>
    </SideNavProvider>
  );
}
