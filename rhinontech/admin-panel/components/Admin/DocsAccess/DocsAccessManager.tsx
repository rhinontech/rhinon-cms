"use client";

import { useEffect, useState } from "react";
import { TbTrash, TbPlus, TbBook, TbRefresh } from "react-icons/tb";
import { apiFetch } from "@/lib/api";

interface DocsAccessEntry {
  id: string;
  email: string;
  grantedByName: string | null;
  note: string | null;
  createdAt: string;
}

export function DocsAccessManager() {
  const [entries, setEntries] = useState<DocsAccessEntry[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<DocsAccessEntry[]>("/docs-access");
      setEntries(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load docs access list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch<DocsAccessEntry & { deduped?: boolean }>("/docs-access", {
        method: "POST",
        body: JSON.stringify({ email: addr, note: note.trim() || undefined }),
      });
      setNotice(res.deduped ? `${addr} already had access.` : `Access granted to ${addr}.`);
      setEmail("");
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to grant access");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, addr: string) => {
    if (!window.confirm(`Revoke developer-docs access for ${addr}?`)) return;
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/docs-access/${id}`, { method: "DELETE" });
      setNotice(`Access revoked for ${addr}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke access");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-stone-200 text-gray-700">
            <TbBook size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Docs Access</h1>
            <p className="mt-1 text-sm text-gray-500">
              Emails allowed to sign in to the Rhinon Help <strong>developer documentation</strong>.
              The public guides stay open to everyone.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          <TbRefresh size={16} />
          Refresh
        </button>
      </div>

      {/* Add form */}
      <form
        onSubmit={add}
        className="mb-5 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@partner.com"
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Acme integration team"
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            <TbPlus size={16} />
            {busy ? "Granting…" : "Grant access"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {notice}
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-500">
          {loading ? "Loading…" : `${entries.length} ${entries.length === 1 ? "person" : "people"} with access`}
        </div>
        {!loading && entries.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No one has developer-docs access yet. Add an email above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{entry.email}</p>
                  <p className="truncate text-xs text-gray-500">
                    {entry.note ? `${entry.note} · ` : ""}
                    Added {new Date(entry.createdAt).toLocaleDateString()}
                    {entry.grantedByName ? ` by ${entry.grantedByName}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => remove(entry.id, entry.email)}
                  aria-label={`Revoke access for ${entry.email}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <TbTrash size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
