"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { TbX, TbUpload, TbFileTypeCsv, TbCircleCheck, TbAlertTriangle, TbLoader } from "react-icons/tb";
import { apiFetch } from "@/lib/api";

interface MappedLead {
  name: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl: string;
  phone: string;
  seniority: string;
  department: string;
  industry: string;
  employeeCount: string;
  location: string;
  website: string;
  companyLinkedinUrl: string;
  emailStatus: string;
  emailConfidence: string;
  keywords: string;
  technologies: string;
  annualRevenue: string;
  apolloContactId: string;
  source: string;
  raw: Record<string, string>;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: { row: number; reason: string }[];
}

// Lowercase + trim header keys so mapping is resilient to casing/whitespace.
function normalize(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(row)) out[key.trim().toLowerCase()] = row[key];
  return out;
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v.toString().trim() !== "") return v.toString().trim();
  }
  return "";
}

// Map a raw Apollo (or generic) CSV row to our lead shape.
function mapRow(raw: Record<string, string>): MappedLead {
  const n = normalize(raw);
  const name = [pick(n, "first name"), pick(n, "last name")].filter(Boolean).join(" ").trim()
    || pick(n, "name", "full name");
  const phone = pick(n, "mobile phone", "work direct phone", "corporate phone", "other phone", "home phone")
    .replace(/^'+/, "").trim();
  const location = [pick(n, "city"), pick(n, "state"), pick(n, "country")].filter(Boolean).join(", ");

  // Keep the full original row (non-empty values only) so the aside can show everything.
  const rawClean: Record<string, string> = {};
  for (const k of Object.keys(raw)) {
    const v = (raw[k] ?? "").toString().trim();
    if (v) rawClean[k] = v;
  }

  return {
    name,
    email: pick(n, "email", "primary email"),
    company: pick(n, "company name", "company"),
    title: pick(n, "title"),
    linkedinUrl: pick(n, "person linkedin url", "linkedin url"),
    phone,
    seniority: pick(n, "seniority"),
    department: pick(n, "departments", "department", "sub departments"),
    industry: pick(n, "industry"),
    employeeCount: pick(n, "# employees", "employees", "number of employees"),
    location,
    website: pick(n, "website"),
    companyLinkedinUrl: pick(n, "company linkedin url"),
    emailStatus: pick(n, "email status"),
    emailConfidence: pick(n, "email confidence"),
    keywords: pick(n, "keywords"),
    technologies: pick(n, "technologies"),
    annualRevenue: pick(n, "annual revenue"),
    apolloContactId: pick(n, "apollo contact id"),
    source: "Apollo Import",
    raw: rawClean,
  };
}

export function LeadImportModal({ onClose }: { onClose: (didImport: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<MappedLead[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validRows = rows.filter(r => r.name && r.email);

  const handleFile = (file: File) => {
    setParseError(null);
    setResult(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.data.length) {
          setParseError("No rows found in this file.");
          setRows([]);
          return;
        }
        setRows(res.data.map(mapRow));
      },
      error: (err) => setParseError(err.message),
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const data = await apiFetch<ImportResult>("/leads/import", {
        method: "POST",
        body: JSON.stringify({ leads: validRows }),
      });
      setResult(data);
    } catch (err: any) {
      setParseError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2">
            <TbFileTypeCsv className="text-blue-600" size={20} />
            <h2 className="text-base font-semibold text-gray-900">Import Leads from CSV</h2>
          </div>
          <button onClick={() => onClose(!!result?.imported)} className="text-gray-500 hover:text-gray-900">
            <TbX size={20} />
          </button>
        </div>

        <div className="p-5">
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-2 text-center">
                <TbCircleCheck className="text-green-500" size={40} />
                <p className="mt-2 text-lg font-semibold text-gray-900">{result.imported} leads imported</p>
                <p className="text-sm text-gray-500">out of {result.total} rows in the file</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Imported" value={result.imported} tone="text-green-600" />
                <Stat label="Duplicates" value={result.duplicates} tone="text-amber-600" />
                <Stat label="Invalid" value={result.invalid} tone="text-red-600" />
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-auto rounded-lg border border-red-100 bg-red-50/50 p-3 text-xs text-red-700">
                  {result.errors.map((e, i) => (
                    <div key={i}>Row {e.row}: {e.reason}</div>
                  ))}
                </div>
              )}
              <button
                onClick={() => onClose(true)}
                className="w-full rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-8 text-stone-500 transition-colors hover:border-blue-400 hover:bg-blue-50/30"
              >
                <TbUpload size={28} />
                <span className="text-sm font-medium">{fileName || "Click to select a CSV file"}</span>
                <span className="text-xs text-stone-400">Apollo export or any CSV with name & email columns</span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {parseError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <TbAlertTriangle size={16} /> {parseError}
                </div>
              )}

              {rows.length > 0 && (
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Rows parsed</span>
                    <span className="font-medium text-stone-900">{rows.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Ready to import (name + email)</span>
                    <span className="font-medium text-green-600">{validRows.length}</span>
                  </div>
                  {rows.length - validRows.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Skipped (missing name/email)</span>
                      <span className="font-medium text-red-500">{rows.length - validRows.length}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button onClick={() => onClose(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? <><TbLoader className="animate-spin" size={16} /> Importing...</> : `Import ${validRows.length || ""} leads`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50 py-3">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-stone-400">{label}</p>
    </div>
  );
}
