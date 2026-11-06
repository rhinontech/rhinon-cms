"use client";

import { usePathname } from "next/navigation";
import { moduleTone } from "@/components/Admin/Common/navConfig";

/** The colour of the module the current page belongs to: /admin/work/... -> Work's green. */
export function useModuleTone(): string {
  return moduleTone(usePathname().split("/")[2] ?? "");
}
