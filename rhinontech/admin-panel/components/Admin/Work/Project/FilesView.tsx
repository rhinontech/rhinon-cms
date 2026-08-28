"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { apiFetch, API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import {
  TbDownload, TbFile, TbFileText, TbLoader, TbPhoto, TbTrash, TbUpload,
} from "react-icons/tb";
import type { ProjectTask, TaskRow } from "./types";

interface ProjectFile {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string | null;
  uploadedBy?: { id: string; fullName: string } | null;
  task?: { id: string; title: string } | null;
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType?.startsWith("image/")) return <TbPhoto size={16} className="text-blue-500 dark:text-blue-400" />;
  if (mimeType?.includes("pdf") || mimeType?.startsWith("text/")) return <TbFileText size={16} className="text-red-500 dark:text-red-400" />;
  return <TbFile size={16} className="text-muted-foreground" />;
}

export function FilesView({
  projectId, rows, onChanged,
}: {
  projectId: string;
  rows: TaskRow[];
  onChanged: () => void;
}) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadTo, setUploadTo] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setFiles(await apiFetch<ProjectFile[]>(`/work/projects/${projectId}/attachments`));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    if (!uploadTo) {
      toast.error("Pick which task the file belongs to first.");
      return;
    }
    setUploading(true);
    try {
      // Multipart: Content-Type must be left to the browser so it sets the boundary.
      const token = Cookies.get("authToken");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/tasks/${uploadTo}/attachments`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      await load();
      onChanged();
      toast.success(`Uploaded ${file.name}`);
    } catch (err: any) {
      toast.error(err.message || "Could not upload that file");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (f: ProjectFile) => {
    if (!window.confirm(`Delete "${f.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/tasks/${f.taskId}/attachments/${f.id}`, { method: "DELETE" });
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Could not delete that file");
    }
  };

  const tasks: ProjectTask[] = rows.map((r) => r.task);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b glass-header px-4 py-2">
        <select
          value={uploadTo}
          onChange={(e) => setUploadTo(e.target.value)}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Attach to which task…</option>
          {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={!uploadTo || uploading}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? <TbLoader size={13} className="animate-spin" /> : <TbUpload size={13} />}
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
        <span className="ml-auto text-[11px] text-muted-foreground">Max 25 MB per file</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[760px]">
          <div className="sticky top-0 grid grid-cols-[2fr_1.2fr_90px_120px_1fr_44px] items-center border-b glass-thead px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>File name</span>
            <span>Location</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span>Uploaded by</span>
            <span />
          </div>

          {loading && (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <TbLoader className="animate-spin" size={15} /> Loading files…
            </p>
          )}

          {!loading && files.map((f) => (
            <div key={f.id} className="grid grid-cols-[2fr_1.2fr_90px_120px_1fr_44px] items-center border-b px-4 py-2.5 text-sm hover:bg-muted/40">
              <span className="flex min-w-0 items-center gap-2">
                <FileIcon mimeType={f.mimeType} />
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer" className="truncate text-foreground hover:underline">
                    {f.name}
                  </a>
                ) : (
                  <span className="truncate text-foreground">{f.name}</span>
                )}
              </span>
              <span className="truncate">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground/70">
                  {f.task?.title ?? "—"}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{humanSize(f.size)}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(f.createdAt), "dd/MM/yyyy")}</span>
              <span className="truncate text-xs text-foreground/70">{f.uploadedBy?.fullName ?? "—"}</span>
              <span className="flex items-center gap-0.5">
                {f.url && (
                  <a href={f.url} download className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground/85" title="Download">
                    <TbDownload size={14} />
                  </a>
                )}
                <button onClick={() => remove(f)} className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300" title="Delete">
                  <TbTrash size={14} />
                </button>
              </span>
            </div>
          ))}

          {!loading && !files.length && (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No files yet. Pick a task above and upload one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
