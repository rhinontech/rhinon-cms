"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { TbTrophy, TbPlus, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

type Status = "Draft" | "Published";

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  industry?: string | null;
  image?: string | null;
  displayOrder: number;
  status: Status;
}

export function CaseStudiesManager() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;
  const basePath = `/${roleSlug}/content/${domain}/case-studies`;

  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiFetch<CaseStudy[]>("/content/case-studies");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this case study?")) return;
    try {
      await apiFetch(`/content/case-studies/${id}`, { method: "DELETE" });
      fetchItems();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <main
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel",
        isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">Case Studies</h1>
            <p className="text-xs text-gray-500">Proof points shown on the Rhinon Labs website.</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`${basePath}/new`)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors"
        >
          New Case Study <TbPlus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-stone-100 bg-white animate-pulse" />
            ))
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">No case studies yet.</div>
          ) : (
            items.map((cs) => (
              <div
                key={cs.id}
                onClick={() => router.push(`${basePath}/${cs.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-stone-100 bg-stone-100 flex items-center justify-center">
                    {cs.image ? (
                      <img src={cs.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <TbTrophy size={18} className="text-stone-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-stone-900 text-sm truncate">{cs.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                          cs.status === "Published"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        )}
                      >
                        {cs.status}
                      </span>
                      {cs.industry && <span className="text-xs text-stone-400 truncate">{cs.industry}</span>}
                      <span className="text-[10px] text-stone-300">#{cs.displayOrder}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(cs.id); }}
                    className="p-1.5 text-stone-300 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TbTrash size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
