"use client";

import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { TbUpload, TbTrash } from "react-icons/tb";

export function CompanySignature() {
  const token = Cookies.get("authToken");
  const permissions: string[] = (() => {
    try { return JSON.parse(Cookies.get("permissions") || "[]"); }
    catch { return []; }
  })();
  const canWrite = permissions.includes("settings:write");

  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/signature`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUrl(data.url ?? null);
    } catch {
      setUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    if (file.type !== "image/png") {
      alert("Please upload a PNG (ideally with a transparent background).");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("signature", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not upload the signature.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remove the company signature? Relieving and experience letters will go back to leaving blank space for a signature.")) return;
    setBusy(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/signature`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUrl(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 max-w-xl">
      <h3 className="text-sm font-semibold text-gray-900">Company signature</h3>
      <p className="mt-1 text-xs text-gray-500">
        Used to sign relieving and experience letters generated from the Team panel.
        Upload a PNG with a transparent background for the cleanest result.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
          {loading ? (
            <span className="text-xs text-gray-400">Loading…</span>
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Company signature" className="max-h-14 max-w-36 object-contain" />
          ) : (
            <span className="text-xs text-gray-400">No signature set</span>
          )}
        </div>

        {canWrite && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <TbUpload size={14} /> {url ? "Replace" : "Upload"} signature
            </button>
            {url && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <TbTrash size={14} /> Remove
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
