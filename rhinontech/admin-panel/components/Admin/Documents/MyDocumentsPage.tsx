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
  TbEye,
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
  if (!mimeType) return <TbFile size={size} className="text-muted-foreground" />;
  if (mimeType === "application/pdf") return <TbFileTypePdf size={size} className="text-red-500 dark:text-red-400" />;
  if (mimeType.startsWith("image/")) return <TbPhoto size={size} className="text-blue-500 dark:text-blue-400" />;
  return <TbFile size={size} className="text-muted-foreground" />;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-3 sm:p-4" onClick={onClose}>
      <div className="glass-modal rounded-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between h-14 px-4 sm:px-5 border-b shrink-0">
          <p className="font-semibold tracking-tight text-sm sm:text-base">{isFullfilling ? "Upload Requested Document" : "Upload Document"}</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><TbX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 overflow-y-auto">
          {!isFullfilling && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                className="border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Employment Contract 2024"
                required
              />
            </div>
          )}
          {!isFullfilling && (
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
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">File</label>
            <div
              className="border-2 border-dashed rounded-lg p-5 sm:p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <TbUpload size={24} className="mx-auto text-muted-foreground mb-2" />
              {file ? (
                <p className="text-xs sm:text-sm text-foreground/85 font-medium truncate max-w-full">{file.name}</p>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">Click to select file</p>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border hover:bg-muted/40">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Preview Modal ───────────────────────────────────────────────────────────

function isPreviewable(mimeType: string | null) {
  return mimeType === "application/pdf" || !!mimeType?.startsWith("image/");
}

function PreviewModal({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div
        className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl glass-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground/85 rounded-lg hover:bg-muted">
            <TbX size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-muted">
          <iframe src={url} className="h-full w-full" title={title} />
        </div>
      </div>
    </div>
  );
}

// ─── Aside Panel ─────────────────────────────────────────────────────────────

function DocAside({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { downloadUrl } = await apiFetch<{ downloadUrl: string }>(`/documents/${doc.id}/download`);
      window.open(downloadUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    try {
      const { downloadUrl } = await apiFetch<{ downloadUrl: string }>(`/documents/${doc.id}/download`);
      setPreviewUrl(downloadUrl);
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="flex min-h-0 h-full w-full flex-col overflow-hidden">
      <div className="sticky top-0 w-full flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b bg-card z-10 shrink-0">
        <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">
          Document Details
        </p>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><TbX size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 sm:gap-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border shrink-0">
            <FileIcon mimeType={doc.mimeType} size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{doc.title}</p>
            <CategoryBadge category={doc.category} />
          </div>
        </div>
        <div className="rounded-xl glass-card divide-y divide-border">
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex justify-between gap-2">
            <span className="text-xs text-muted-foreground">File name</span>
            <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[200px]">{doc.fileName || "—"}</span>
          </div>
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex justify-between gap-2">
            <span className="text-xs text-muted-foreground">File size</span>
            <span className="font-semibold text-foreground text-xs sm:text-sm">{formatFileSize(doc.fileSize)}</span>
          </div>
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex justify-between gap-2">
            <span className="text-xs text-muted-foreground">Uploaded by</span>
            <span className="font-semibold text-foreground text-xs sm:text-sm">{doc.uploader?.fullName || "—"}</span>
          </div>
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex justify-between gap-2">
            <span className="text-xs text-muted-foreground">Date</span>
            <span className="font-semibold text-foreground text-xs sm:text-sm">
              {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        {doc.fileKey && (
          <div className="flex flex-col gap-2 pt-1">
            {isPreviewable(doc.mimeType) && (
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="flex items-center gap-2 justify-center w-full py-2.5 rounded-lg border text-foreground/85 text-xs sm:text-sm font-medium hover:bg-muted/40 disabled:opacity-50 transition-colors"
              >
                <TbEye size={16} />
                {previewing ? "Opening..." : "Preview"}
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 justify-center w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <TbDownload size={16} />
              {downloading ? "Getting link..." : "Download"}
            </button>
          </div>
        )}
      </div>
      {previewUrl && (
        <PreviewModal title={doc.title} url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
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
  const [mobileDetail, setMobileDetail] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fulfillDoc, setFulfillDoc] = useState<Doc | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      // "self" keeps this page scoped to the signed-in user's own documents
      // even for admins (plain /documents returns everyone's for them).
      const data = await apiFetch<Doc[]>("/documents?employeeId=self");
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
    <div className="flex min-h-0 min-w-0 gap-2 h-full overflow-hidden w-full">
      <main className={cn("flex min-h-0 min-w-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <p className="text-base sm:text-lg font-semibold tracking-tight truncate">My Documents</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
          >
            <TbUpload size={15} />
            <span>Upload Document</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-auto p-3 sm:p-5 flex flex-col gap-4 sm:gap-5 max-w-full">
          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
            {(["all", ...ALL_CATEGORIES] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0",
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border text-foreground/70 hover:bg-muted/40"
                )}
              >
                {c === "all" ? "All" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground/85">Pending Requests</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingRequests.map(doc => (
                  <div key={doc.id} className="rounded-xl border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 p-3.5 sm:p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <TbAlertCircle size={20} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">Document Requested: {doc.title}</p>
                        <CategoryBadge category={doc.category} />
                      </div>
                    </div>
                    {doc.requestNote && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-400/15 rounded p-2">{doc.requestNote}</p>
                    )}
                    <button
                      onClick={() => setFulfillDoc(doc)}
                      className="flex items-center gap-2 justify-center w-full py-2 rounded-lg bg-amber-500 text-white text-xs sm:text-sm font-medium hover:bg-amber-600 transition-colors"
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
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <TbFile size={40} className="text-muted-foreground/50" />
              <p className="text-xs sm:text-sm">No documents found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => { setSelectedDoc(doc); setMobileDetail(true); }}
                  className="rounded-xl glass-card p-3.5 sm:p-4 flex flex-col gap-3 text-left hover:border-blue-200 dark:hover:border-blue-400/25 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted/40 border shrink-0">
                      <FileIcon mimeType={doc.mimeType} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                      <CategoryBadge category={doc.category} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
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
        "min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail && selectedDoc ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        selectedDoc ? "lg:w-[42%]" : "lg:w-0"
      )}>
        {selectedDoc && (
          <DocAside
            doc={selectedDoc}
            onClose={() => { setSelectedDoc(null); setMobileDetail(false); }}
          />
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
