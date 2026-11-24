"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

export interface CsvColumn {
  /** Field sent to the API. */
  key: string;
  label: string;
  required?: boolean;
  /** Header names that map to this field (case-insensitive), besides the label. */
  aliases?: string[];
}

/**
 * Import rows from a CSV through an existing create endpoint, one row at a time.
 *
 * Each row is the same request a person would make by hand, so plan limits,
 * validation and side effects (invite emails) all apply per row, and a failure
 * stops only that row. Shows a preview first, then a per-row result.
 */
export function CsvImportDialog({
  open, onClose, title, description, columns, endpoint, buildBody, onDone, template,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  columns: CsvColumn[];
  endpoint: string;
  /** Turns a mapped row into the request body (defaults, lookups). Return a string to reject the row with that reason. */
  buildBody: (row: Record<string, string>) => Record<string, unknown> | string;
  onDone: () => void;
  /** Example CSV offered for download. */
  template: string;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Array<{ ok: boolean; message: string }>>([]);
  const [running, setRunning] = useState(false);

  const reset = () => { setRows([]); setError(""); setResults([]); };

  const parse = (file: File) => {
    reset();
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const headers = (meta.fields ?? []).map((h) => h.trim().toLowerCase());
        const find = (c: CsvColumn) => {
          const names = [c.key, c.label, ...(c.aliases ?? [])].map((n) => n.toLowerCase());
          const i = headers.findIndex((h) => names.includes(h));
          return i === -1 ? null : meta.fields![i];
        };
        const missing = columns.filter((c) => c.required && !find(c));
        if (missing.length) { setError(`Missing column: ${missing.map((c) => c.label).join(", ")}. Download the template to see the format.`); return; }
        if (data.length > 200) { setError("Up to 200 rows at a time, please split the file."); return; }
        setRows(data.map((raw) => Object.fromEntries(columns.map((c) => { const h = find(c); return [c.key, h ? String(raw[h] ?? "").trim() : ""]; }))));
      },
      error: () => setError("Could not read that file. Save it as CSV and try again."),
    });
  };

  const run = async () => {
    setRunning(true);
    const out: Array<{ ok: boolean; message: string }> = [];
    for (const row of rows) {
      const body = buildBody(row);
      if (typeof body === "string") { out.push({ ok: false, message: body }); setResults([...out]); continue; }
      try {
        await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
        out.push({ ok: true, message: "Added" });
      } catch (err) {
        out.push({ ok: false, message: err instanceof Error ? err.message : "Failed" });
      }
      setResults([...out]);
    }
    setRunning(false);
    onDone();
  };

  const okCount = results.filter((r) => r.ok).length;
  const downloadTemplate = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([template], { type: "text/csv" }));
    a.download = "template.csv";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !running) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} className="text-sm" disabled={running} />
          <button type="button" onClick={downloadTemplate} className="text-xs font-medium text-primary hover:underline">Download template</button>
        </div>
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">{error}</p>}
        {rows.length > 0 && (
          <div className="max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>{columns.map((c) => <th key={c.key} className="px-2 py-1.5 text-left font-medium">{c.label}</th>)}<th className="px-2 py-1.5 text-left font-medium">Result</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={i}>
                    {columns.map((c) => <td key={c.key} className="max-w-[160px] truncate px-2 py-1.5">{r[c.key]}</td>)}
                    <td className={`px-2 py-1.5 ${results[i] ? (results[i].ok ? "text-emerald-600" : "text-red-600") : "text-muted-foreground"}`}>{results[i]?.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {results.length === rows.length && rows.length > 0 && !running && (
          <p className="text-sm">{`${okCount} of ${rows.length} added.${okCount < rows.length ? " The rest show why in the Result column." : ""}`}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={running}>Close</Button>
          <Button onClick={run} disabled={running || rows.length === 0 || results.length > 0}>{running ? `Importing ${results.length + 1} of ${rows.length}…` : `Import ${rows.length || ""} rows`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
