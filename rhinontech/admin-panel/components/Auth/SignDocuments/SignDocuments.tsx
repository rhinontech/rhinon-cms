"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TbCheck, TbX, TbFileText, TbDownload } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { SignaturePad } from "./SignaturePad";

type Stage = "loading" | "invalid" | "signing" | "done";

interface SigningDocument {
  id: string;
  category: "offer_letter" | "nda";
  title: string;
  fileName: string | null;
  signed: boolean;
  signedAt: string | null;
  viewUrl: string | null;
  downloadUrl?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  offer_letter: "Offer Letter",
  nda: "Non-Disclosure Agreement",
};

export function SignDocuments() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("loading");
  const [employeeName, setEmployeeName] = useState("");
  const [documents, setDocuments] = useState<SigningDocument[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // true/false only when "done" was reached by signing in this session (the
  // backend fires the account-setup email then); null on a revisit.
  const [setupEmailSent, setSetupEmailSent] = useState<boolean | null>(null);

  const load = () => {
    if (!token) { setStage("invalid"); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/document-signing/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setEmployeeName(data.employeeName ?? "");
        setDocuments(data.documents ?? []);
        if (data.allSigned) {
          setStage("done");
        } else {
          const firstUnsigned = (data.documents ?? []).findIndex((d: SigningDocument) => !d.signed);
          setActiveIndex(firstUnsigned === -1 ? 0 : firstUnsigned);
          setStage("signing");
        }
      })
      .catch(() => setStage("invalid"));
  };

  useEffect(load, [token]);

  const activeDoc = documents[activeIndex];

  const handleSign = async (payload: { type: "typed"; fullName: string } | { type: "drawn"; signatureImageBase64: string }) => {
    if (!activeDoc) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/document-signing/${token}/documents/${activeDoc.id}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Could not submit your signature. Please try again.");
        return;
      }

      const updated = documents.map((d, i) =>
        i === activeIndex ? { ...d, signed: true, downloadUrl: data.downloadUrl } : d
      );
      setDocuments(updated);

      if (data.allSigned) {
        setSetupEmailSent(typeof data.setupEmailSent === "boolean" ? data.setupEmailSent : null);
        setStage("done");
      } else {
        const nextIndex = updated.findIndex((d) => !d.signed);
        setActiveIndex(nextIndex === -1 ? activeIndex : nextIndex);
      }
    } catch {
      setError("Could not submit your signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4 lg:p-6">
      {/* Signing gets the full viewport width (big document viewer); the
          loading / invalid / done states stay compact, centered cards. */}
      <div className={cn("w-full", stage === "signing" ? "max-w-none" : "max-w-lg")}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <span className="text-primary-foreground font-bold text-lg">R</span>
          </div>
          <p className="text-sm text-muted-foreground">Rhinon Tech · Document Signing</p>
        </div>

        {stage === "loading" && (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Verifying your link...</p>
          </div>
        )}

        {stage === "invalid" && (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-400/10 flex items-center justify-center mx-auto mb-4">
              <TbX size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <p className="font-semibold text-foreground mb-1">Link expired or invalid</p>
            <p className="text-sm text-muted-foreground">This signing link has expired or already been used. Contact HR to resend it.</p>
          </div>
        )}

        {stage === "signing" && activeDoc && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-6 py-5">
              <p className="text-primary-foreground font-semibold text-lg">Welcome, {employeeName.split(" ")[0] || "there"}!</p>
              <p className="text-primary-foreground/70 text-sm mt-0.5">Review and sign your documents to complete onboarding</p>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Document viewer — takes all remaining width */}
              <div className="flex-1 min-w-0 p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TbFileText size={16} /> {CATEGORY_LABEL[activeDoc.category] ?? activeDoc.title}
                </div>
                {activeDoc.viewUrl && (
                  <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-lg border border-border bg-muted">
                    <iframe src={activeDoc.viewUrl} className="h-full w-full" title={activeDoc.title} />
                  </div>
                )}
              </div>

              {/* Progress + signature panel */}
              <div className="lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-border p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          doc.signed ? "bg-green-600 text-primary-foreground" : i === activeIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {doc.signed ? <TbCheck size={13} /> : i + 1}
                      </div>
                      <span className={cn("text-xs font-medium truncate", i === activeIndex ? "text-foreground" : "text-muted-foreground")}>
                        {CATEGORY_LABEL[doc.category] ?? doc.title}
                      </span>
                      {i < documents.length - 1 && <div className="h-px flex-1 bg-muted" />}
                    </div>
                  ))}
                </div>

                <SignaturePad defaultName={employeeName} busy={submitting} onSubmit={handleSign} />

                {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
              </div>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-green-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <TbCheck size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">All documents signed!</p>
                  <p className="text-green-100 text-sm">Thanks, {employeeName.split(" ")[0] || "there"} — you're all set</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              {setupEmailSent === true && (
                <div className="rounded-lg border border-blue-100 dark:border-blue-400/20 bg-blue-50 dark:bg-blue-400/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                  <strong>Next step:</strong> we've just emailed your account credentials and setup link to your
                  personal email — check your inbox (and spam folder) to finish setting up your account.
                </div>
              )}
              {setupEmailSent === false && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  Your documents are signed, but we couldn't send your account setup email automatically.
                  Please contact HR to have your invite re-sent.
                </div>
              )}
              <p className="text-sm text-foreground/70 mb-2">Download your signed copies below for your records.</p>
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.downloadUrl || doc.viewUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <TbFileText size={16} /> {CATEGORY_LABEL[doc.category] ?? doc.title}
                  </span>
                  <TbDownload size={16} className="text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
