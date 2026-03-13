"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CampaignsRedirect() {
  const router = useRouter();
  const params = useParams();
  const role = params.role;

  useEffect(() => {
    router.replace(`/${role}/campaigns/email`);
  }, [role, router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
    </div>
  );
}
