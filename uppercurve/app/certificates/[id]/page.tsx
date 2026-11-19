import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Download, Linkedin } from "lucide-react";
import { verifyCertificate } from "@/services/eventService";
import { GuestCard, GuestShell, primaryButton, secondaryButton } from "@/components/Pages/Events/Guest/GuestShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cert = await verifyCertificate(id);
  return cert.valid
    ? {
        title: `${cert.name} — ${cert.certificateName} | UpperCurve`,
        description: `Verified UpperCurve certificate for ${cert.event?.title}.`,
        alternates: {
          canonical: `/certificates/${id}`,
        },
        robots: {
          index: false,
          follow: false,
        },
      }
    : { title: "Certificate not found | UpperCurve", robots: { index: false, follow: false} };
}

/** Public: anyone holding a certificate ID can confirm it's genuine. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await verifyCertificate(id);

  if (!cert.valid) {
    notFound();
  }

  const issued = cert.issuedAt ? new Date(cert.issuedAt) : null;
  const linkedIn = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${cert.certificateName} — ${cert.event?.title}`,
    organizationName: "UpperCurve",
    ...(issued ? { issueYear: String(issued.getFullYear()), issueMonth: String(issued.getMonth() + 1) } : {}),
    certId: cert.certificateId || id,
  });

  return (
    <GuestShell eyebrow="Verified certificate">
      <GuestCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-[12.5px] font-semibold text-[#15803D]">
              <BadgeCheck className="size-4" /> Genuine · issued by UpperCurve
            </p>
            <h1 className="mt-4 text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-tight">{cert.name}</h1>
            <p className="mt-1 text-[15px] text-[#475569]">
              {cert.certificateName} ·{" "}
              {cert.event ? <Link href={`/events/${cert.event.slug}`} className="font-semibold text-[#0B1B3D] hover:text-[#0052FF]">{cert.event.title}</Link> : null}
            </p>
          </div>
          <dl className="text-right text-[13px]">
            <dt className="text-[#94A3B8]">Certificate ID</dt>
            <dd className="font-mono font-semibold">{cert.certificateId}</dd>
            <dt className="mt-2 text-[#94A3B8]">Issued</dt>
            <dd className="font-semibold">{issued ? issued.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "—"}</dd>
          </dl>
        </div>
        {cert.imageUrl ? (
          // A signed, short-lived S3 URL: plain <img> rather than next/image, so it isn't cached past expiry.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cert.imageUrl} alt={`Certificate for ${cert.name}`} className="mt-7 w-full rounded-2xl border border-[#E6EAF2] shadow-[0_30px_60px_-30px_rgba(11,27,61,0.35)]" />
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={`https://www.linkedin.com/profile/add?${linkedIn}`} target="_blank" rel="noopener noreferrer" className={primaryButton}>
            <Linkedin className="size-4" /> Add to LinkedIn
          </a>
          {cert.imageUrl ? (
            <a href={cert.imageUrl} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
              <Download className="size-4" /> Download
            </a>
          ) : null}
        </div>
      </GuestCard>
    </GuestShell>
  );
}
