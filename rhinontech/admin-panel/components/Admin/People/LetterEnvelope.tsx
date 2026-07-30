"use client";

import Image from "next/image";
import adminImages from "@/constants/admin/images";

// Static, non-editable wrapper matching the fixed parts of the real PDF
// (letterhead, date/salutation, party block, signature lines) that
// generateOfferLetterPdf/generateNdaPdf still render in services/letters.ts —
// only the body sections became DB-backed LetterBlocks (see LetterBlocksView).
// Without this wrapper the preview looked stripped of the logo/envelope even
// though nothing was actually removed from the generated document.
export function LetterEnvelope({
  type,
  tokens,
  children,
}: {
  type: "offer" | "nda";
  tokens?: Record<string, string>;
  children: React.ReactNode;
}) {
  const t = (key: string, placeholder: string) => tokens?.[key] ?? placeholder;

  return (
    <div className="mx-auto max-w-3xl bg-white text-[13px] text-stone-800">
      <div className="px-6 pt-8 pb-3">
        <Image src={adminImages.Logo_Rhinon_Tech_Dark} alt="Rhinon Tech" className="h-14 w-auto object-contain" />
      </div>

      {type === "offer" ? (
        <div className="px-6">
          <p className="mb-3 text-center font-bold text-[#005085]">PRIVATE &amp; CONFIDENTIAL</p>
          <p>{t("dates.todayLong", "[Today's date]")}</p>
          <p className="font-bold">{t("employee.legalName", "[Employee name]")}</p>
          <p className="mb-3">{t("employee.workLocationShort", "[Location]")}</p>
          <p className="mb-2">Dear {t("employee.firstName", "[First name]")},</p>
        </div>
      ) : (
        <div className="px-6">
          <p className="mb-3 text-center font-bold text-[#005085]">NON-DISCLOSURE &amp; CONFIDENTIALITY AGREEMENT</p>
          <p className="mb-2">
            This Non-Disclosure and Confidentiality Agreement (the &quot;Agreement&quot;) is dated this {t("dates.todayLong", "[today]")}.
          </p>
          <p>BETWEEN:</p>
          <p>
            <span className="font-bold">Rhinon Tech Private Limited</span> (the &quot;Employer&quot;)
          </p>
          <p className="mb-1">OF THE FIRST PART</p>
          <p>- AND -</p>
          <p>
            <span className="font-bold">{t("employee.legalName", "[Employee name]")}</span> of {t("employee.workLocationOrIndia", "[Location]")} (the &quot;Employee&quot;)
          </p>
          <p className="mb-3">OF THE SECOND PART</p>
        </div>
      )}

      {children}

      <div className="px-6 pb-10">
        {type === "offer" ? (
          <>
            <p className="mt-4">Best regards,</p>
            <p className="mt-2 font-[cursive] text-lg italic">Prabhat Patra</p>
            <p className="font-bold">Prabhat Patra (Founder)</p>
            <p className="mt-6 text-[11px] text-stone-400">
              (Followed by a signature/acknowledgment page — not shown in this preview.)
            </p>
          </>
        ) : (
          <>
            <p className="mt-4">
              IN WITNESS WHEREOF Rhinon Tech and {t("employee.legalName", "[Employee name]")} have duly affixed their signatures.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p>For Rhinon Tech,</p>
                <p className="mt-4 font-[cursive] text-lg italic">Prabhat Patra</p>
                <p className="mt-1 font-bold">Authorized Signatory</p>
              </div>
              <div>
                <p>Accepted &amp; Agreed By:</p>
                <p className="mt-4 font-bold">{t("employee.legalName", "[Employee name]")}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
