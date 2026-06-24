"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useSideNav } from "@/context/SideNavContext";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import {
  TbFile,
  TbFileTypePdf,
  TbPhoto,
  TbX,
  TbUpload,
  TbDownload,
  TbTrash,
  TbSearch,
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
  createdAt: string;
  employee: { id: string; fullName: string; companyEmail: string; department: string };
  uploader: { id: string; fullName: string };
}

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
  department: string;
  documentCount: number;
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

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType, size = 18 }: { mimeType: string | null; size?: number }) {
  if (!mimeType) return <TbFile size={size} className="text-gray-400" />;
  if (mimeType === "application/pdf") return <TbFileTypePdf size={size} className="text-red-500" />;
  if (mimeType.startsWith("image/")) return <TbPhoto size={size} className="text-blue-500" />;
  return <TbFile size={size} className="text-gray-400" />;
}

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

// ─── Upload for Employee Modal ────────────────────────────────────────────────

interface UploadForEmployeeModalProps {
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

function UploadForEmployeeModal({ employees, onClose, onSuccess }: UploadForEmployeeModalProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !employeeId) { setError("Please fill all fields and select a file"); return; }
    setLoading(true);
    setError("");
    try {
      const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/documents/presign", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, mimeType: file.type, employeeId, title, category }),
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await apiFetch("/documents", {
        method: "POST",
        body: JSON.stringify({ employeeId, title, category, fileKey: key, fileName: file.name, fileSize: file.size, mimeType: file.type }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between h-14 px-5 border-b">
          <p className="font-semibold tracking-tight">Upload Document for Employee</p>
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
            <label className="text-xs text-gray-400">Title</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Document title"
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
            <label className="text-xs text-gray-400">File</label>
            <input
              type="file"
              className="border rounded-lg px-3 py-2 text-sm"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
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
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Aside Panel ─────────────────────────────────────────────────────────────

interface DocAsideProps {
  doc: Doc;
  onClose: () => void;
  onDeleted: () => void;
}

function DocAside({ doc, onClose, onDeleted }: DocAsideProps) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { downloadUrl } = await apiFetch<{ downloadUrl: string }>(`/documents/${doc.id}/download`);
      window.open(downloadUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/documents/${doc.id}`, { method: "DELETE" });
      onDeleted();
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex min-h-0 h-full w-full flex-col overflow-hidden">
      <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
        <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
          Document Details
        </p>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"><TbX size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gray-50 border">
            <FileIcon mimeType={doc.mimeType} size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{doc.title}</p>
            <CategoryBadge category={doc.category} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white divide-y divide-gray-50">
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-gray-400">Employee</span>
            <span className="font-semibold text-gray-900 text-sm">{doc.employee?.fullName || "—"}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-gray-400">Department</span>
            <span className="font-semibold text-gray-900 text-sm">{doc.employee?.department || "—"}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-gray-400">File name</span>
            <span className="font-semibold text-gray-900 text-sm truncate max-w-[55%] text-right">{doc.fileName || "—"}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-gray-400">File size</span>
            <span className="font-semibold text-gray-900 text-sm">{formatFileSize(doc.fileSize)}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-gray-400">Uploaded by</span>
            <span className="font-semibold text-gray-900 text-sm">{doc.uploader?.fullName || "—"}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-gray-400">Date</span>
            <span className="font-semibold text-gray-900 text-sm">
              {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {doc.fileKey && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 justify-center w-full py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              <TbDownload size={16} />
              {downloading ? "Getting link..." : "Download"}
            </button>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 justify-center w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
            >
              <TbTrash size={16} />
              Delete
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg border text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AllDocumentsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = employeeFilter ? `?employeeId=${employeeFilter}` : "";
      const data = await apiFetch<Doc[]>(`/documents${params}`);
      setDocs(data.filter(d => !d.isRequest || d.fileKey));
    } finally {
      setLoading(false);
    }
  }, [employeeFilter]);

  useEffect(() => {
    apiFetch<Employee[]>("/documents/employees").then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const filtered = docs.filter(doc => {
    if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-2">
            <SubNavToggle />
            <p className="text-lg font-semibold tracking-tight">All Documents</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            <TbUpload size={16} />
            Upload for Employee
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.documentCount})</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as "all" | Category)}
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <div className="flex-1 min-w-[180px] relative">
              <TbSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <TbFile size={40} className="text-gray-200" />
              <p className="text-sm">No documents found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Employee</th>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Uploaded by</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(doc => (
                    <tr
                      key={doc.id}
                      className={cn(
                        "hover:bg-blue-50 cursor-pointer transition-colors",
                        selectedDoc?.id === doc.id && "bg-blue-50"
                      )}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{doc.employee?.fullName || "—"}</p>
                        <p className="text-xs text-gray-400">{doc.employee?.department || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileIcon mimeType={doc.mimeType} />
                          <span className="text-gray-800">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><CategoryBadge category={doc.category} /></td>
                      <td className="px-4 py-3 text-gray-600">{doc.uploader?.fullName || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatFileSize(doc.fileSize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        selectedDoc ? "w-[42%]" : "w-0"
      )}>
        {selectedDoc && (
          <DocAside
            doc={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onDeleted={fetchDocs}
          />
        )}
      </aside>

      {showUpload && (
        <UploadForEmployeeModal
          employees={employees}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchDocs}
        />
      )}
    </div>
  );
}
