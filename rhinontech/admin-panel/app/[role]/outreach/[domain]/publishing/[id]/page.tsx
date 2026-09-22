"use client";

import { PublishDetailPage } from "@/components/Admin/Outreach/publishing/PublishDetailPage";
import { useParams } from "next/navigation";

export default function PublishDetailRoute() {
  const params = useParams();
  return <PublishDetailPage id={params.id as string} />;
}
