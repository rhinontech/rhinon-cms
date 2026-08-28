"use client";

import { useEffect, useRef, useState } from "react";
import { TbPaperclip, TbPlus, TbFile, TbTrash, TbLoader, TbX, TbDownload } from "react-icons/tb";
import { apiFetch, apiUpload } from "@/lib/api";
import type { PageAttachmentEntry } from "./types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Per-page file attachments — separate from the inline "/image" slash command,
 * this is a standalone list anyone with access to the page can view, and
 * anyone with edit access can add to or remove from. Files live in a private
 * S3 prefix; each row's URL is freshly presigned by the backend, not stored.
 */
export function PageAttachments({ pageId, canEdit }: { pageId: string; canEdit: boolean }) {
  const [attachments, setAttachments] = useState<PageAttachmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PageAttachmentEntry | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreview(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<PageAttachmentEntry[]>(`/pages/${pageId}/attachments`)
      .then((rows) => { if (!cancelled) setAttachments(rows); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pageId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await apiUpload<PageAttachmentEntry>(`/pages/${pageId}/attachments`, file, "file");
      setAttachments((prev) => [attachment, ...prev]);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Remove this attachment?")) return;
    setDeletingId(attachmentId);
    try {
      await apiFetch(`/pages/${pageId}/attachments/${attachmentId}`, { method: "DELETE" });
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || (!canEdit && attachments.length === 0)) return null;

  return (
    <div className="mt-10 border-t border-border pt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <TbPaperclip size={13} /> Attachments{attachments.length > 0 ? ` (${attachments.length})` : ""}
        </p>
        {canEdit && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground/85 disabled:opacity-50"
          >
            {uploading ? <TbLoader size={13} className="animate-spin" /> : <TbPlus size={13} />}
            {uploading ? "Uploading…" : "Add file"}
          </button>
        )}
        <input ref={inputRef} type="file" onChange={handleFile} className="hidden" />
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">No attachments yet.</p>
      ) : (
        <div className="space-y-1">
          {attachments.map((a) => {
            const isImage = a.mimeType.startsWith("image/");
            return (
              <div
                key={a.id}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                  {isImage ? (
                    <img src={a.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <TbFile size={15} />
                  )}
                </span>
                {isImage ? (
                  <button
                    onClick={() => setPreview(a)}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground/85 hover:underline"
                    title={a.name}
                  >
                    {a.name}
                  </button>
                ) : (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/85 hover:underline"
                    title={a.name}
                  >
                    {a.name}
                  </a>
                )}
                <span className="shrink-0 text-[10px] font-medium uppercase text-muted-foreground">
                  {formatSize(a.size)}
                  {a.uploadedBy?.fullName ? ` · ${a.uploadedBy.fullName}` : ""}
                </span>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    title="Remove attachment"
                    className="shrink-0 rounded p-1 text-muted-foreground/70 opacity-0 hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingId === a.id ? <TbLoader size={13} className="animate-spin" /> : <TbTrash size={13} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8"
          onClick={() => setPreview(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open original"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <TbDownload size={18} />
            </a>
            <button
              onClick={() => setPreview(null)}
              title="Close"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <TbX size={18} />
            </button>
          </div>
          <img
            src={preview.url}
            alt={preview.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-white/70">
            {preview.name}
          </p>
        </div>
      )}
    </div>
  );
}
