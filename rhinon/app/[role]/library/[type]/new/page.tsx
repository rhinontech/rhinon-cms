"use client";

import { use } from "react";
import { LibraryEditor } from "@/views/Library/LibraryEditor";
import { useRouter } from "next/navigation";

const SLUG_TO_FILTER: Record<string, string> = {
  "all": "LinkedIn Post",
  "linkedin-post": "LinkedIn Post",
  "linkedin-video": "LinkedIn Video",
  "linkedin-article": "LinkedIn Article",
};

export default function NewLibraryAssetPage({ params }: { params: Promise<{ role: string, type: string }> }) {
  const { role, type } = use(params);
  const router = useRouter();
  const channel = SLUG_TO_FILTER[type] || "LinkedIn Post";
  
  return <LibraryEditor asset={null} initialChannel={channel} />;
}
