"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { LAST_PROJECT_KEY } from "@/components/Admin/Work/Project/lastProject";

/**
 * "Projects" lands inside a project's workspace, not on a list one click short
 * of it: the last project opened in this browser, else the first one. With no
 * projects at all there is nothing to open, so it falls back to the list.
 */
export default function WorkProjectsEntry() {
  const router = useRouter();
  const { role } = useParams<{ role: string }>();

  useEffect(() => {
    let cancelled = false;
    apiFetch<Array<{ id: string }>>("/work/projects")
      .then((projects) => {
        if (cancelled) return;
        let remembered: string | null = null;
        try { remembered = window.localStorage.getItem(LAST_PROJECT_KEY); } catch { /* storage blocked */ }
        const target = projects.find((p) => p.id === remembered) ?? projects[0];
        router.replace(target ? `/${role}/work/projects/${target.id}` : `/${role}/work/clients`);
      })
      .catch(() => !cancelled && router.replace(`/${role}/work/clients`));
    return () => { cancelled = true; };
  }, [role, router]);

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Opening your project…</div>
  );
}
