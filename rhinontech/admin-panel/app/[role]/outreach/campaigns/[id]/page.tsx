"use client";

import { CampaignDetailPage } from "@/components/Admin/Outreach/CampaignDetailPage";
import { useParams } from "next/navigation";

export default function CampaignDetailRoute() {
  const params = useParams();
  return <CampaignDetailPage id={params.id as string} />;
}
