"use client";

import { useParams } from "next/navigation";
import { PublicPortal } from "@/components/Admin/Work/Project/PublicPortal";

export default function PublicProjectPortalPage() {
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>();
  return <PublicPortal projectId={projectId} slug={slug} />;
}
