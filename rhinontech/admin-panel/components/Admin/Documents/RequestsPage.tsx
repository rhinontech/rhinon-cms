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
    offer_letter: "bg-blue-50 text-blue-700 border-blue-100",
    contract: "bg-purple-50 text-purple-700 border-purple-100",
    id_proof: "bg-green-50 text-green-700 border-green-100",
    appraisal: "bg-orange-50 text-orange-700 border-orange-100",
    nda: "bg-red-50 text-red-700 border-red-100",
    other: "bg-gray-50 text-gray-600 border-gray-100",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between h-14 px-5 border-b">
          <p className="font-semibold tracking-tight">Request Document</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><TbX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Employee</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="text-xs text-gray-400">Document Title</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Passport Copy"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Category</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
            >
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Note to Employee <span className="text-gray-300">(optional)</span></label>
            <textarea
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={requestNote}
              onChange={e => setRequestNote(e.target.value)}
              placeholder="Any instructions or context for the employee..."
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{doc.employee?.fullName || "—"}</p>
        <p className="text-xs text-gray-400">{doc.employee?.department || ""}</p>
      </td>
      <td className="px-4 py-3 text-gray-800">{doc.title}</td>
      <td className="px-4 py-3"><CategoryBadge category={doc.category} /></td>
      <td className="px-4 py-3 text-gray-600">
        {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{doc.requestNote || "—"}</td>
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{doc.employee?.fullName || "—"}</p>
        <p className="text-xs text-gray-400">{doc.employee?.department || ""}</p>
      </td>
      <td className="px-4 py-3 text-gray-800">{doc.title}</td>
      <td className="px-4 py-3"><CategoryBadge category={doc.category} /></td>
      <td className="px-4 py-3 text-gray-600">
        {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {new Date(doc.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
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
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
        <div className="flex items-center gap-2">
          <SubNavToggle />
          <p className="text-lg font-semibold tracking-tight">Document Requests</p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
        >
          <TbFileAlert size={16} />
          Request Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
        ) : (
          <>
            {/* Pending Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TbFileAlert size={18} className="text-amber-500" />
                <p className="text-sm font-semibold text-gray-700">Pending Requests</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{pending.length}</span>
              </div>
              {pending.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-400">
                  No pending requests
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Employee</th>
                        <th className="text-left px-4 py-3">Document Requested</th>
                        <th className="text-left px-4 py-3">Category</th>
                        <th className="text-left px-4 py-3">Requested Date</th>
                        <th className="text-left px-4 py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pending.map(doc => <PendingRow key={doc.id} doc={doc} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fulfilled Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TbFileCheck size={18} className="text-green-500" />
                <p className="text-sm font-semibold text-gray-700">Fulfilled Requests</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">{fulfilled.length}</span>
              </div>
              {fulfilled.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-400">
                  No fulfilled requests yet
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Employee</th>
                        <th className="text-left px-4 py-3">Document</th>
                        <th className="text-left px-4 py-3">Category</th>
                        <th className="text-left px-4 py-3">Requested</th>
                        <th className="text-left px-4 py-3">Uploaded</th>
                        <th className="text-left px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
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
