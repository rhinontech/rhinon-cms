"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { TbLoader } from "react-icons/tb";
import { ContentSubNav } from "@/components/Admin/Common/ContentSubNav/ContentSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { useContentDomains } from "@/components/Admin/Content/domains";

export default function ContentDomainLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;

  const { domains, loading } = useContentDomains();
  // Until the workspace's sites have loaded, an unknown slug is not yet wrong —
  // redirecting on `loading` would bounce every first paint back to the picker.
  const known = domains.some((d) => d.slug === domain);

  useEffect(() => {
    if (!loading && !known) router.replace(`/${roleSlug}/content`);
  }, [loading, known, roleSlug, router]);

  if (loading || !known) {
    return (
      <main className="flex h-full w-full items-center justify-center">
        <TbLoader size={22} className="animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <SideNavProvider>
      <div className="flex h-full w-full overflow-hidden">
        <ContentSubNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SideNavProvider>
  );
}
