"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useSideNav } from "@/context/SideNavContext";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import {
  TbFileAlert,
  TbFileCheck,
  TbX,
  TbDownload,
} from "react-icons/tb";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "offer_letter" | "contract" | "id_proof" | "appraisal" | "nda" | "other";

interface Doc {
  id: string;
  employeeId: string;
  title: string;
  category: Category;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isRequest: boolean;
  requestNote: string | null;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; fullName: string; companyEmail: string; department: string };
  uploader: { id: string; fullName: string };
}

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Category, string> = {
  offer_letter: "Offer Letter",
  contract: "Contract",
  id_proof: "ID Proof",
  appraisal: "Appraisal",
  nda: "NDA",
  other: "Other",
};

const ALL_CATEGORIES: Category[] = ["offer_letter", "contract", "id_proof", "appraisal", "nda", "other"];

function CategoryBadge({ category }: { category: Category }) {
  const colors: Record<Category, string> = {
    offer_letter: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-400/20",
    contract: "bg-purple-50 dark:bg-purple-400/10 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-400/20",
    id_proof: "bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-300 border-green-100 dark:border-green-400/20",
    appraisal: "bg-orange-50 dark:bg-orange-400/10 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-400/20",
    nda: "bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-300 border-red-100 dark:border-red-400/20",
    other: "bg-muted/40 text-foreground/70 border-border",
  };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", colors[category])}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ─── Request Document Modal ───────────────────────────────────────────────────

interface RequestModalProps {
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

function RequestModal({ employees, onClose, onSuccess }: RequestModalProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [requestNote, setRequestNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) { setError("Please select an employee"); return; }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/documents/request", {
        method: "POST",
        body: JSON.stringify({ employeeId, title, category, requestNote }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-3 sm:p-4" onClick={onClose}>
      <div className="glass-modal rounded-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between h-14 px-4 sm:px-5 border-b shrink-0">
          <p className="font-semibold tracking-tight text-sm sm:text-base">Request Document</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><TbX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Employee</label>
            <select
              className="border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-full"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Document Title</label>
            <input
              className="border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Passport Copy"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Category</label>
            <select
              className="border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-full"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
            >
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Note to Employee <span className="text-muted-foreground/70">(optional)</span></label>
            <textarea
              className="border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={requestNote}
              onChange={e => setRequestNote(e.target.value)}
              placeholder="Any instructions or context for the employee..."
            />
          </div>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border hover:bg-muted/40">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Requesting..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Table rows ───────────────────────────────────────────────────────────────

function PendingRow({ doc }: { doc: Doc }) {
  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3">
        <p className="font-medium text-foreground">{doc.employee?.fullName || "—"}</p>
        <p className="text-xs text-muted-foreground">{doc.employee?.department || ""}</p>
      </td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-foreground">{doc.title}</td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3"><CategoryBadge category={doc.category} /></td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-foreground/70">
        {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-muted-foreground max-w-[200px] truncate">{doc.requestNote || "—"}</td>
    </tr>
  );
}

function FulfilledRow({ doc }: { doc: Doc }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { downloadUrl } = await apiFetch<{ downloadUrl: string }>(`/documents/${doc.id}/download`);
      window.open(downloadUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3">
        <p className="font-medium text-foreground">{doc.employee?.fullName || "—"}</p>
        <p className="text-xs text-muted-foreground">{doc.employee?.department || ""}</p>
      </td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-foreground">{doc.title}</td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3"><CategoryBadge category={doc.category} /></td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-foreground/70">
        {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3 text-foreground/70">
        {new Date(doc.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-3.5 sm:px-4 py-2.5 sm:py-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-400/15 disabled:opacity-50"
        >
          <TbDownload size={14} />
          {downloading ? "..." : "Download"}
        </button>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RequestsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsData, empData] = await Promise.all([
        apiFetch<Doc[]>("/documents"),
        apiFetch<Employee[]>("/documents/employees"),
      ]);
      setDocs(docsData.filter(d => d.isRequest));
      setEmployees(empData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = docs.filter(d => !d.fileKey);
  const fulfilled = docs.filter(d => !!d.fileKey);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <SubNavToggle />
          <p className="text-base sm:text-lg font-semibold tracking-tight truncate">Document Requests</p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
        >
          <TbFileAlert size={15} />
          <span>Request Document</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4 sm:gap-6 max-w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <>
            {/* Pending Section */}
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <TbFileAlert size={18} className="text-amber-500 dark:text-amber-400" />
                <p className="text-xs sm:text-sm font-semibold text-foreground/85">Pending Requests</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300">{pending.length}</span>
              </div>
              {pending.length === 0 ? (
                <div className="rounded-xl glass-card px-4 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="rounded-xl glass-card overflow-x-auto shadow-xs max-w-full w-full">
                  <table className="w-full min-w-[560px] text-xs sm:text-sm">
                    <thead className="glass-thead text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Employee</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Document Requested</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Category</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Requested Date</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pending.map(doc => <PendingRow key={doc.id} doc={doc} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fulfilled Section */}
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <TbFileCheck size={18} className="text-green-500 dark:text-green-400" />
                <p className="text-xs sm:text-sm font-semibold text-foreground/85">Fulfilled Requests</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300">{fulfilled.length}</span>
              </div>
              {fulfilled.length === 0 ? (
                <div className="rounded-xl glass-card px-4 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                  No fulfilled requests yet
                </div>
              ) : (
                <div className="rounded-xl glass-card overflow-x-auto shadow-xs max-w-full w-full">
                  <table className="w-full min-w-[560px] text-xs sm:text-sm">
                    <thead className="glass-thead text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Employee</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Document</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Category</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Requested</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Uploaded</th>
                        <th className="text-left px-3.5 sm:px-4 py-2.5 sm:py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fulfilled.map(doc => <FulfilledRow key={doc.id} doc={doc} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showRequest && (
        <RequestModal
          employees={employees}
          onClose={() => setShowRequest(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
