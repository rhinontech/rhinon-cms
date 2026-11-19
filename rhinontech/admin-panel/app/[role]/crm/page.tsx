"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActiveBrand } from "@/lib/sites";

/**
 * The CRM is one book of people for the whole workspace, so there is no brand to ask for. The
 * `[domain]` in its URLs is still there (it is the brand the person happens to be viewing as, which
 * decides which brand's outreach lists and campaigns they see beside it), so land on it directly.
 */
export default function CrmPage() {
  const router = useRouter();
  const params = useParams();
  const { slug, loading } = useActiveBrand();

  useEffect(() => {
    if (!loading && slug) router.replace(`/${params?.role}/crm/${slug}`);
  }, [loading, slug, router, params?.role]);

  if (!loading && !slug) {
    return <div className="p-8 text-sm text-muted-foreground">This workspace has no brand set up yet, so there is nothing to open.</div>;
  }
  return <div className="p-8 text-sm text-muted-foreground">Opening the CRM…</div>;
}
