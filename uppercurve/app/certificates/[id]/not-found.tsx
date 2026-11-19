import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { GuestCard, GuestShell, primaryButton } from "@/components/Pages/Events/Guest/GuestShell";

export default function CertificateNotFound() {
  return (
    <GuestShell eyebrow="Certificate check">
      <GuestCard className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FEF2F2] text-[#DC2626]">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
          We couldn&apos;t verify this certificate
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-[#475569]">
          No certificate with this ID has been issued. Check the ID on the certificate, including the dashes.
        </p>
        <Link href="/events" className={`${primaryButton} mt-6`}>
          Browse events
        </Link>
      </GuestCard>
    </GuestShell>
  );
}

