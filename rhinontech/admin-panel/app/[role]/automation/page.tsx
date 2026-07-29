"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutomationIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "admin";

  useEffect(() => {
    router.replace(`/${roleSlug}/automation/workflows`);
  }, [router, roleSlug]);

  return (
    <div className="flex h-full items-center justify-center p-8 text-gray-500">
      Redirecting to Workflows...
    </div>
  );
}
