"use client";

import { useParams } from "next/navigation";
import { PublicPortal } from "@/components/Admin/Work/Project/PublicPortal";

/** Old portal links (/p/<id>): same portal, redirected to /public/<name>/<id> once loaded. */
export default function LegacyPublicProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return <PublicPortal projectId={projectId} />;
}
