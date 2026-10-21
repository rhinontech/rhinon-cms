"use client";

import { useParams } from "next/navigation";
import { BlogSitePreview } from "@/components/Admin/Content/SitePreview/BlogSitePreview";

export default function BlogPreviewRoute() {
  const params = useParams();
  return <BlogSitePreview id={params.id as string} domain={params.domain as string} />;
}
