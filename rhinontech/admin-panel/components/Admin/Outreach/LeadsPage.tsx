"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TbUsers,
  TbSearch,
  TbPlus,
  TbUpload,
  TbRefresh,
  TbTrash,
  TbEdit,
  TbExternalLink,
  TbBulb,
  TbActivity,
  TbCircleCheck,
  TbLoader,
  TbX,
  TbMail,
  TbTarget,
  TbBrandLinkedin,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbChevronDown
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { LeadImportModal } from "./LeadImportModal";

type LeadStatus = "New" | "Enriched" | "Enrolled" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";
type PanelMode = "view" | "create" | "edit";

interface Lead {
  id: string;
  name: string;
  company: string;
  title: string | null;
  email: string;
  linkedinUrl: string | null;
  status: LeadStatus;
  campaignId: string | null;
  campaign?: { name: string };
  source: string;
  notes: string | null;
  addedAt: string;
  phone?: string | null;
  seniority?: string | null;
  department?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  location?: string | null;
  website?: string | null;
  companyLinkedinUrl?: string | null;
  emailStatus?: string | null;
  emailConfidence?: string | null;
  keywords?: string | null;
  technologies?: string | null;
  annualRevenue?: string | null;
  raw?: Record<string, string> | null;
  enrichment?: Record<string, any> | null;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-blue-50 text-blue-600 border-blue-100",
  Enriched: "bg-purple-50 text-purple-600 border-purple-100",
  Enrolled: "bg-indigo-50 text-indigo-600 border-indigo-100",
  Emailed: "bg-yellow-50 text-yellow-600 border-yellow-100",
  Interested: "bg-green-50 text-green-600 border-green-100",
  Replied: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Bounced: "bg-red-50 text-red-600 border-red-100",
  Unsubscribed: "bg-stone-50 text-stone-600 border-stone-100",
};

export function LeadsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichment, setEnrichment] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    title: "",
    linkedinUrl: "",
    notes: ""
  });

  const fetchLeads = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (statusFilter !== "All") query.set("status", statusFilter);
      const data = await apiFetch<Lead[]>(`/leads?${query.toString()}`);
      setLeads(data);
      if (!selectedLead && data.length > 0) {
        setSelectedLead(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedLead]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.title?.toLowerCase().includes(q))
    );
  }, [leads, search]);

  const handleEnrich = async (leadId: string) => {
    setEnriching(true);
    setEnrichment(null);
    try {
      const data = await apiFetch<any>(`/leads/${leadId}/enrich`, { method: "POST" });
      setEnrichment(data);
      fetchLeads();
    } catch (err) {
      alert("AI Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  const startCreate = () => {
    setForm({ name: "", company: "", email: "", title: "", linkedinUrl: "", notes: "" });
    setPanelMode("create");
    setIsPreviewExpanded(true);
  };

  const startEdit = () => {
    if (!selectedLead) return;
    setForm({
      name: selectedLead.name,
      company: selectedLead.company,
      email: selectedLead.email,
      title: selectedLead.title || "",
      linkedinUrl: selectedLead.linkedinUrl || "",
      notes: selectedLead.notes || ""
    });
    setPanelMode("edit");
    setIsPreviewExpanded(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (panelMode === "create") {
        await apiFetch("/leads", { method: "POST", body: JSON.stringify(form) });
      } else {
        await apiFetch(`/leads/${selectedLead?.id}`, { method: "PUT", body: JSON.stringify(form) });
      }
      setPanelMode("view");
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/leads/${id}`, { method: "DELETE" });
      if (selectedLead?.id === id) setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredLeads.map(l => l.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} lead(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await apiFetch("/leads/bulk-delete", { method: "POST", body: JSON.stringify({ ids: Array.from(selectedIds) }) });
      if (selectedLead && selectedIds.has(selectedLead.id)) setSelectedLead(null);
      setSelectedIds(new Set());
      fetchLeads();
    } catch (err: any) {
      alert(err.message || "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEnrichment(lead.enrichment ?? null);
    setPanelMode("view");
    setIsPreviewExpanded(true);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Leads</h1>
              <p className="text-xs text-gray-500">Manage your outreach prospects and enrichment data.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100">
              Import CSV
              <TbUpload size={14} />
            </button>
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100">
              Add Lead
              <TbPlus size={14} />
            </button>
            {(!isPreviewExpanded || (filteredLeads.length === 0 && panelMode !== "create")) && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-[300px]">
              <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Enriched">Enriched</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Interested">Interested</option>
              <option value="Emailed">Emailed</option>
              <option value="Replied">Replied</option>
              <option value="Bounced">Bounced</option>
              <option value="Unsubscribed">Unsubscribed</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5">
              <span className="text-sm font-medium text-blue-900">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds(new Set())} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white">
                  Clear
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <TbTrash size={14} /> {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-auto rounded-xl border border-gray-100 bg-white">
            <div className="grid min-w-[800px] w-full grid-cols-[44px_minmax(250px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_40px] border-b bg-stone-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="flex items-center justify-center px-2 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
                  title="Select all"
                />
              </span>
              <span className="px-4 py-3">Lead</span>
              <span className="px-4 py-3">Company</span>
              <span className="px-4 py-3">Status</span>
              <span className="px-4 py-3 text-right"></span>
            </div>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 border-b animate-pulse bg-stone-50/50"></div>
              ))
            ) : filteredLeads.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No leads found.</div>
            ) : filteredLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => selectLead(lead)}
                className={cn(
                  "grid min-w-[800px] w-full cursor-pointer grid-cols-[44px_minmax(250px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_40px] items-center border-b text-left text-sm hover:bg-stone-50 transition-colors",
                  selectedLead?.id === lead.id && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                <span className="flex items-center justify-center px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(lead.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
                  />
                </span>
                <span className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-stone-900">{lead.name}</span>
                    <span className="text-xs text-stone-500">{lead.email}</span>
                  </div>
                </span>
                <span className="px-4 py-3 text-gray-600">{lead.company}</span>
                <span className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", STATUS_COLORS[lead.status])}>
                    {lead.status}
                  </span>
                </span>
                <span className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                    className="p-1 text-stone-400 hover:text-red-600 rounded"
                  >
                    <TbTrash size={16} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${isPreviewExpanded && (filteredLeads.length > 0 || panelMode === "create") ? "w-[42%] ml-2" : "w-0"}`}>
        {isPreviewExpanded && (filteredLeads.length > 0 || panelMode === "create") && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-black">
                {panelMode === "create" ? "Add Lead" : panelMode === "edit" ? "Edit Lead" : "Details"}
              </p>
              <div className="flex items-center gap-2">
                {panelMode === "view" && selectedLead && (
                  <button onClick={startEdit} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Edit
                  </button>
                )}
                <button onClick={() => setIsPreviewExpanded(false)} className="text-gray-600 hover:text-gray-900">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {panelMode === "view" && selectedLead ? (
                <div className="p-5 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 leading-tight">{selectedLead.name}</h2>
                    <p className="text-sm text-stone-500 font-medium">{selectedLead.title || "No title"} @ {selectedLead.company}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", STATUS_COLORS[selectedLead.status])}>
                        {selectedLead.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-[10px]">
                        <TbBulb size={16} /> AI Intelligence
                      </div>
                      {!enriching && (
                        <button onClick={() => handleEnrich(selectedLead.id)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 uppercase tracking-wider">
                          <TbRefresh size={12} /> {enrichment ? "Re-run" : "Run Enrichment"}
                        </button>
                      )}
                    </div>
                    {enriching ? (
                      <div className="flex flex-col items-center py-4 text-indigo-400"><TbLoader className="animate-spin mb-1" size={20} /><p className="text-[10px] font-medium uppercase tracking-widest">Analyzing...</p></div>
                    ) : enrichment ? (
                      <div className="space-y-3">
                        <div><p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Context</p><p className="text-xs text-stone-700 leading-relaxed">{enrichment.companyDescription}</p></div>
                        <div><p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Pain Point</p><p className="text-xs text-stone-700 leading-relaxed font-medium">"{enrichment.potentialPainPoint}"</p></div>
                        {enrichment.recentNews && <div><p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Recent News</p><p className="text-xs text-stone-700 leading-relaxed">{enrichment.recentNews}</p></div>}
                        {enrichment.linkedinDiscoveryHint && <div><p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">LinkedIn Hint</p><p className="text-xs text-stone-700 leading-relaxed">{enrichment.linkedinDiscoveryHint}</p></div>}
                      </div>
                    ) : (
                      <p className="text-[10px] text-indigo-400 italic text-center py-2">No intelligence gathered yet.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <DetailCard label="Email" value={selectedLead.email} />
                    {selectedLead.phone && <DetailCard label="Phone" value={selectedLead.phone} />}
                    <DetailCard label="LinkedIn" value={selectedLead.linkedinUrl || "—"} isLink={!!selectedLead.linkedinUrl} />
                    {selectedLead.seniority && <DetailCard label="Seniority" value={selectedLead.seniority} />}
                    {selectedLead.department && <DetailCard label="Department" value={selectedLead.department} />}
                    {selectedLead.industry && <DetailCard label="Industry" value={selectedLead.industry} />}
                    {selectedLead.employeeCount != null && <DetailCard label="Company Size" value={`${selectedLead.employeeCount} employees`} />}
                    {selectedLead.annualRevenue && <DetailCard label="Annual Revenue" value={formatRevenue(selectedLead.annualRevenue)} />}
                    {selectedLead.location && <DetailCard label="Location" value={selectedLead.location} />}
                    {selectedLead.website && <DetailCard label="Website" value={selectedLead.website} isLink />}
                    {selectedLead.companyLinkedinUrl && <DetailCard label="Company LinkedIn" value={selectedLead.companyLinkedinUrl} isLink />}
                    {selectedLead.technologies && <DetailCard label="Tech Stack" value={selectedLead.technologies} />}
                    {selectedLead.emailStatus && <DetailCard label="Email Status" value={selectedLead.emailStatus} />}
                    <DetailCard label="Source" value={selectedLead.source} />
                    <DetailCard label="Notes" value={selectedLead.notes || "—"} />
                  </div>

                  {selectedLead.raw && Object.keys(selectedLead.raw).length > 0 && (
                    <RawDataSection raw={selectedLead.raw} />
                  )}
                </div>
              ) : (
                <form onSubmit={handleSave} className="flex flex-col h-full p-5 space-y-4">
                  <div className="space-y-4">
                    <FormInput label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="John Doe" />
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput label="Company" value={form.company} onChange={v => setForm({ ...form, company: v })} required placeholder="Acme Inc" />
                      <FormInput label="Job Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="CEO" />
                    </div>
                    <FormInput label="Email Address" value={form.email} onChange={v => setForm({ ...form, email: v })} required type="email" placeholder="john@acme.com" />
                    <FormInput label="LinkedIn URL" value={form.linkedinUrl} onChange={v => setForm({ ...form, linkedinUrl: v })} placeholder="https://linkedin.com/in/..." />
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      Internal Notes
                      <textarea
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none h-32 text-sm"
                        placeholder="Add details about this lead..."
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
                    <button type="button" onClick={() => setPanelMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60 transition-colors">
                      {saving ? "Saving..." : panelMode === "create" ? "Create Lead" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </aside>

      {showImport && (
        <LeadImportModal
          onClose={(didImport) => {
            setShowImport(false);
            if (didImport) fetchLeads();
          }}
        />
      )}
    </div>
  );
}

function DetailCard({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {isLink ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" className="font-medium text-blue-600 hover:underline truncate block">{value}</a>
      ) : (
        <p className="font-medium text-gray-900 leading-relaxed">{value}</p>
      )}
    </div>
  );
}

function formatRevenue(v: string): string {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n === 0) return v;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function RawDataSection({ raw }: { raw: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(raw);
  return (
    <div className="mt-4 rounded-xl border border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 rounded-xl"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          All Apollo data ({entries.length} fields)
        </span>
        <TbChevronDown className={cn("text-gray-400 transition-transform", open && "rotate-180")} size={16} />
      </button>
      {open && (
        <div className="divide-y divide-gray-50 border-t">
          {entries.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[38%_62%] gap-2 px-4 py-2 text-xs">
              <span className="break-words text-gray-400">{k}</span>
              <span className="break-words text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormInput({ label, value, onChange, required, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
      />
    </label>
  );
}
