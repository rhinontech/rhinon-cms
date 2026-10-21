"use client";

import { usePathname, useParams } from "next/navigation";
import { TbArticle, TbTrophy, TbCalendarEvent, TbSparkles } from "react-icons/tb";
import { CollapsibleSubNav, type SubNavItem } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useDomainConfig, type ContentResource } from "@/components/Admin/Content/domains";

const RESOURCE_ICON: Record<ContentResource, React.ReactNode> = {
  blogs: <TbArticle size={18} />,
  "case-studies": <TbTrophy size={18} />,
  events: <TbCalendarEvent size={18} />,
};

export function ContentSubNav() {
  const pathname = usePathname();
  const params = useParams();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;
  const { config } = useDomainConfig(domain);
  const base = `/${roleSlug}/content/${domain}`;

  const items: SubNavItem[] = (config?.resources || []).map((r) => ({
    label: r.label,
    href: r.key === "blogs" ? base : `${base}/${r.key}`,
    icon: RESOURCE_ICON[r.key],
    exact: r.key === "blogs",
  }));
  // AI drafting sits right under Blogs: topics in, draft posts out.
  items.splice(1, 0, { label: "AI Writer", href: `${base}/ai-writer`, icon: <TbSparkles size={18} /> });

  return <CollapsibleSubNav title={config?.label || "Content"} items={items} />;
}
