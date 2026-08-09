"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DomainPickerModal } from "@/components/Admin/Content/DomainPickerModal";
import type { ContentDomain } from "@/components/Admin/Content/domains";

export default function ContentRootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const [open, setOpen] = useState(true);

  const handleSelect = (domain: ContentDomain) => {
    router.push(`/${roleSlug}/content/${domain}`);
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <DomainPickerModal open={open} onOpenChange={setOpen} onSelect={handleSelect} />
      {!open && (
        <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
          <p>Choose which website's content you want to manage.</p>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800"
          >
            Choose a site
          </button>
        </div>
      )}
    </div>
  );
}
