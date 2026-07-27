"use client";

import { usePathname } from "next/navigation";
import { TbArticle, TbTrophy } from "react-icons/tb";
import { CollapsibleSubNav, type SubNavItem } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";

export function ContentSubNav() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/content`;

  const items: SubNavItem[] = [
    { label: "Blogs", href: base, icon: <TbArticle size={18} />, exact: true },
    { label: "Case Studies", href: `${base}/case-studies`, icon: <TbTrophy size={18} /> },
  ];

  return <CollapsibleSubNav title="Content" items={items} />;
}
