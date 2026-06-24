"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbTarget,
  TbPlus,
  TbSearch,
  TbChevronRight,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbFileDescription,
  TbEdit,
  TbTrash,
  TbCheck,
  TbX
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";

interface Policy {
  id: string;
  title: string;
  category: "Attendance" | "Leave" | "Conduct" | "Welfare";
  lastUpdated: string;
  content: string;
  version: string;
}

export function GovernancePage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const isSuperAdmin = roleSlug === "superadmin";

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const data = await apiFetch<Policy[]>("/attendance/policies");
      setPolicies(data);
      if (data.length > 0) setSelectedPolicy(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleSave = async () => {
    if (!selectedPolicy) return;
    try {
      // For demo, we just update local state after success
      await apiFetch(`/attendance/policies`, {
        method: "POST",
        body: JSON.stringify(selectedPolicy)
      });
      setIsEditing(false);
      fetchPolicies();
    } catch (err) {
      alert("Failed to save policy");
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-white", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4 bg-white">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Governance & Policies</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">HR Rules & Guidelines</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setSelectedPolicy({
                    id: "new",
                    title: "Untitled Policy",
                    category: "Attendance",
                    lastUpdated: new Date().toISOString(),
                    content: "",
                    version: "v1.0"
                  } as any);
                  setIsEditing(true);
                  setIsPreviewExpanded(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-800 transition-all shadow-md"
              >
                <TbPlus size={16} /> New Policy
              </button>
            )}
            {!isPreviewExpanded && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100 transition-all">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="relative">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search policies..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="p-20 text-center text-stone-300 italic">Loading policies...</div>
            ) : policies.map(policy => (
              <div
                key={policy.id}
                onClick={() => { setSelectedPolicy(policy); setIsPreviewExpanded(true); setIsEditing(false); }}
                className={cn(
                  "p-4 rounded-2xl border border-stone-100 transition-all cursor-pointer flex items-center justify-between group",
                  selectedPolicy?.id === policy.id ? "bg-stone-50 border-stone-200 ring-1 ring-stone-200 shadow-sm" : "bg-white hover:bg-stone-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-stone-900 text-white shadow-sm">
                    <TbFileDescription size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{policy.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{policy.category}</span>
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">{policy.version}</span>
                    </div>
                  </div>
                </div>
                <TbChevronRight className={cn("text-stone-200 group-hover:text-stone-900 group-hover:translate-x-1 transition-all", selectedPolicy?.id === policy.id && "text-stone-900")} />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        isPreviewExpanded && selectedPolicy ? "w-[42%] ml-1.5" : "w-0"
      )}>
        {selectedPolicy && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">Policy Viewer</p>
              </div>
              <div className="flex items-center gap-3">
                {isSuperAdmin && (
                  <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-gray-900 transition-colors">
                    <TbEdit size={20} />
                  </button>
                )}
                <button onClick={() => setIsPreviewExpanded(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Policy Title</label>
                    <input
                      type="text"
                      defaultValue={selectedPolicy.title}
                      className="w-full px-4 py-3 text-lg font-bold border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Content</label>
                    <textarea
                      defaultValue={selectedPolicy.content}
                      className="w-full h-[400px] px-4 py-3 text-sm leading-relaxed border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-6 border-t">
                    <button onClick={handleSave} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
                      <TbCheck /> Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white text-stone-400 border border-stone-100 rounded-xl font-bold text-sm hover:bg-stone-50 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <article className="prose prose-stone max-w-none">
                  <div className="mb-8">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full">{selectedPolicy.category}</span>
                    <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">{selectedPolicy.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Version {selectedPolicy.version}</span>
                      <span>•</span>
                      <span>Updated {new Date(selectedPolicy.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">
                    {selectedPolicy.content}
                  </div>

                  <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <div className="p-2 bg-stone-900 text-white rounded-lg shadow-md"><TbTarget size={20} /></div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Compliance Required</p>
                      <p className="text-xs text-blue-700 mt-1">All employees must read and acknowledge this policy by the end of this quarter.</p>
                    </div>
                  </div>
                </article>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
