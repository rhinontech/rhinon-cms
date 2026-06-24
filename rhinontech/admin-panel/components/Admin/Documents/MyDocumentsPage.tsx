"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  TbAlertCircle,
} from "react-icons/tb";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "offer_letter" | "contract" | "id_proof" | "appraisal" | "nda" | "other";

interface Doc {
  id: string;
  employeeId: string;
  uploadedById: string;
  title: string;
  category: Category;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isRequest: boolean;
  requestNote: string | null;
  createdAt: string;
  uploader: { id: string; fullName: string };
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

function FileIcon({ mimeType, size = 28 }: { mimeType: string | null; size?: number }) {
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

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  prefillDocId?: string;
  prefillTitle?: string;
  prefillCategory?: Category;
}

function UploadModal({ onClose, onSuccess, prefillDocId, prefillTitle, prefillCategory }: UploadModalProps) {
  const [title, setTitle] = useState(prefillTitle || "");
  const [category, setCategory] = useState<Category>(prefillCategory || "other");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isFullfilling = !!prefillDocId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    setLoading(true);
    setError("");
    try {
      if (isFullfilling) {
        // Fulfilling a request: presign then PUT then PUT /documents/:id/upload
        const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/documents/presign", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, mimeType: file.type, employeeId: "self", title, category }),
        });
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        await apiFetch(`/documents/${prefillDocId}/upload`, {
          method: "PUT",
          body: JSON.stringify({ fileKey: key, fileName: file.name, fileSize: file.size, mimeType: file.type }),
        });
      } else {
        // New upload: presign then PUT then POST /documents
        const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/documents/presign", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, mimeType: file.type, employeeId: "self", title, category }),
        });
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        await apiFetch("/documents", {
          method: "POST",
          body: JSON.stringify({ employeeId: "self", title, category, fileKey: key, fileName: file.name, fileSize: file.size, mimeType: file.type }),
        });
      }
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
          <p className="font-semibold tracking-tight">{isFullfilling ? "Upload Requested Document" : "Upload Document"}</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><TbX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {!isFullfilling && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Title</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Employment Contract 2024"
                required
              />
            </div>
          )}
          {!isFullfilling && (
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
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">File</label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <TbUpload size={24} className="mx-auto text-gray-400 mb-2" />
              {file ? (
                <p className="text-sm text-gray-700 font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Click to select file</p>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
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

function DocAside({ doc, onClose }: { doc: Doc; onClose: () => void }) {
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
            <span className="text-xs text-gray-400">File name</span>
            <span className="font-semibold text-gray-900 text-sm">{doc.fileName || "—"}</span>
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
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MyDocumentsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [fulfillDoc, setFulfillDoc] = useState<Doc | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Doc[]>("/documents");
      setDocs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const actualDocs = docs.filter(d => !d.isRequest || d.fileKey);
  const pendingRequests = docs.filter(d => d.isRequest && !d.fileKey);

  const filtered = categoryFilter === "all"
    ? actualDocs
    : actualDocs.filter(d => d.category === categoryFilter);

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-2">
            <SubNavToggle />
            <p className="text-lg font-semibold tracking-tight">My Documents</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            <TbUpload size={16} />
            Upload Document
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 flex flex-col gap-5">
          {/* Category Tabs */}
          <div className="flex gap-1 flex-wrap">
            {(["all", ...ALL_CATEGORIES] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  categoryFilter === c
                    ? "bg-stone-900 text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                )}
              >
                {c === "all" ? "All" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">Pending Requests</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingRequests.map(doc => (
                  <div key={doc.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <TbAlertCircle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Document Requested: {doc.title}</p>
                        <CategoryBadge category={doc.category} />
                      </div>
                    </div>
                    {doc.requestNote && (
                      <p className="text-xs text-amber-700 bg-amber-100 rounded p-2">{doc.requestNote}</p>
                    )}
                    <button
                      onClick={() => setFulfillDoc(doc)}
                      className="flex items-center gap-2 justify-center w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
                    >
                      <TbUpload size={14} />
                      Upload Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <TbFile size={40} className="text-gray-200" />
              <p className="text-sm">No documents found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-3 text-left hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-50 border">
                      <FileIcon mimeType={doc.mimeType} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                      <CategoryBadge category={doc.category} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        selectedDoc ? "w-[42%]" : "w-0"
      )}>
        {selectedDoc && (
          <DocAside doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
        )}
      </aside>

      {/* Modals */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={fetchDocs} />
      )}
      {fulfillDoc && (
        <UploadModal
          onClose={() => setFulfillDoc(null)}
          onSuccess={fetchDocs}
          prefillDocId={fulfillDoc.id}
          prefillTitle={fulfillDoc.title}
          prefillCategory={fulfillDoc.category}
        />
      )}
    </div>
  );
}
