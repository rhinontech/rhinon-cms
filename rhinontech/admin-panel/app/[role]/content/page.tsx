"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TbLoader } from "react-icons/tb";
import { DomainPickerModal } from "@/components/Admin/Content/DomainPickerModal";
import { useContentDomains } from "@/components/Admin/Content/domains";

export default function ContentRootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const [open, setOpen] = useState(true);
  const { domains, loading } = useContentDomains();

  const handleSelect = (domain: string) => {
    router.push(`/${roleSlug}/content/${domain}`);
  };

  // A workspace with a single site has nothing to choose between — skip straight
  // to it rather than showing a one-option picker.
  useEffect(() => {
    if (!loading && domains.length === 1) {
      router.replace(`/${roleSlug}/content/${domains[0].slug}`);
    }
  }, [loading, domains, roleSlug, router]);

  if (loading || domains.length === 1) {
    return (
      <main className="flex h-full w-full items-center justify-center">
        <TbLoader size={22} className="animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <DomainPickerModal open={open} onOpenChange={setOpen} onSelect={handleSelect} />
      {!open && (
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <p>Choose which website's content you want to manage.</p>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Choose a site
          </button>
        </div>
      )}
    </div>
  );
}
