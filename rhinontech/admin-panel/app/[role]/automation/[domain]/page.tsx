"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useModuleBase } from "@/lib/sites";

export default function AutomationIndexPage() {
  const router = useRouter();
  const base = useModuleBase();

  useEffect(() => {
    router.replace(`${base}/workflows`);
  }, [router, base]);

  return (
    <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
      Redirecting to Workflows...
    </div>
  );
}
