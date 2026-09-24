"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ArrowRight, Check, Link2 } from "lucide-react";
import EventRegistrationModal from "./EventRegistrationModal";

interface RegistrationTarget {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
}

const RegistrationContext = createContext<{ open: () => void } | null>(null);

/**
 * One registration modal per page. The hero, the sticky card, the mobile bar
 * and the closing panel all open the same one, so there is a single form state
 * and a single place registrations are sent from.
 */
export function RegistrationProvider({
  event,
  children,
}: {
  event: RegistrationTarget;
  children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <RegistrationContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <EventRegistrationModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        eventTitle={event.title}
        eventDate={event.dateLabel}
        eventTime={event.timeLabel}
        eventId={event.id}
        eventSlug={event.slug}
      />
    </RegistrationContext.Provider>
  );
}

const VARIANTS = {
  primary:
    "bg-[#0052FF] hover:bg-[#0043CC] text-white shadow-[0_8px_20px_-8px_rgba(0,82,255,0.55)]",
  light: "bg-white hover:bg-[#EBF3FF] text-[#0B1B3D]",
} as const;

export function RegisterButton({
  label,
  disabled = false,
  disabledLabel = "Registrations closed",
  variant = "primary",
  className = "",
}: {
  label: string;
  disabled?: boolean;
  disabledLabel?: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const registration = useContext(RegistrationContext);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => registration?.open()}
      className={`inline-flex items-center justify-center gap-2 font-bold text-xs sm:text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-[4px] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#64748B] disabled:shadow-none ${VARIANTS[variant]} ${className}`}
    >
      {disabled ? disabledLabel : label}
      {disabled ? null : <ArrowRight className="w-4 h-4" aria-hidden />}
    </button>
  );
}

/** Copies the page URL; falls back to the native share sheet on phones. */
export function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The user dismissed the share sheet, or clipboard access was refused —
      // nothing to recover, and nothing worth an error message.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-[#0B1B3D] hover:text-[#0052FF] transition-colors ${className}`}
    >
      {copied ? <Check className="w-4 h-4 text-[#16A34A]" aria-hidden /> : <Link2 className="w-4 h-4" aria-hidden />}
      {copied ? "Link copied" : "Share event"}
    </button>
  );
}
