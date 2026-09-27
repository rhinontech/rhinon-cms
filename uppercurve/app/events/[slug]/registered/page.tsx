import type { Metadata } from "next";
import Link from "next/link";
import { Award, CalendarPlus, CheckCircle2, Hourglass, MessageSquareText, MessagesSquare, XCircle } from "lucide-react";
import { getGuestPage } from "@/services/eventService";
import { GuestCard, GuestShell, InvalidLink, primaryButton, secondaryButton } from "@/components/Pages/Events/Guest/GuestShell";
import CopyLink from "@/components/Pages/Events/Guest/CopyLink";

export const dynamic = "force-dynamic";
// Personal pages: never indexed, and the token never leaks via Referer.
export const metadata: Metadata = { title: "Your registration — UpperCurve", robots: { index: false, follow: false }, referrer: "no-referrer" };

function calendarLink(e: { title: string; startDate: string; startTime: string | null; endTime: string | null; location: string | null }) {
  const toMinutes = (t: string | null) => {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t || "");
    if (!m) return null;
    return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
  };
  const day = (e.startDate || "").slice(0, 10).replace(/-/g, "");
  if (!day) return null;
  const at = (mins: number | null) => (mins === null ? day : `${day}T${String(Math.floor(mins / 60)).padStart(2, "0")}${String(mins % 60).padStart(2, "0")}00`);
  const start = toMinutes(e.startTime);
  const params = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${at(start)}/${at(toMinutes(e.endTime) ?? start)}`, ctz: "Asia/Kolkata", location: e.location || "" });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ slug }, { token }] = await Promise.all([params, searchParams]);
  if (!token) return <InvalidLink message="This page needs the personal link from your email." />;
  const data = await getGuestPage(slug, token);
  if ("error" in data) return <InvalidLink message={data.error} />;

  const { guest, event } = data;
  const team = ["Hackathon", "Teardown"].includes(event.type);
  const status = guest.guestType;
  const firstName = guest.name.split(" ")[0];
  const calendar = status === "Approved" ? calendarLink(event) : null;
  const feedbackHref = `/events/${slug}/feedback?token=${encodeURIComponent(token)}`;

  return (
    <GuestShell event={event} eyebrow="Your registration">
      <GuestCard>
        <div className="flex items-start gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${status === "Approved" ? "bg-[#ECFDF3] text-[#16A34A]" : status === "Waitlist" ? "bg-[#FFF7ED] text-[#D97706]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
            {status === "Approved" ? <CheckCircle2 className="size-6" /> : status === "Waitlist" ? <Hourglass className="size-6" /> : <XCircle className="size-6" />}
          </span>
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight">
              {status === "Approved" ? `You're in, ${firstName}` : status === "Waitlist" ? `You're on the waitlist, ${firstName}` : "We couldn't offer you a place this time"}
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#475569]">
              {status === "Approved"
                ? "Your place is confirmed. Joining details are in your confirmation email — add the session to your calendar so you don't miss it."
                : status === "Waitlist"
                  ? "We review every registration and confirm places as they open up. You'll get an email the moment you're approved — nothing else to do until then."
                  : "This one filled up. We run sessions like it regularly — there's a good chance of a place at the next one."}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {calendar ? (
            <a href={calendar} target="_blank" rel="noopener noreferrer" className={primaryButton}><CalendarPlus className="size-4" /> Add to calendar</a>
          ) : null}
          {event.whatsappLink ? (
            <a href={event.whatsappLink} target="_blank" rel="noopener noreferrer" className={secondaryButton}><MessagesSquare className="size-4" /> Join the group</a>
          ) : null}
          {status === "Declined" ? <Link href="/events" className={primaryButton}>See upcoming events</Link> : null}
        </div>
        <p className="mt-5 text-[12.5px] text-[#94A3B8]">Registered as {guest.email} · {new Date(guest.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      </GuestCard>

      {status === "Approved" && (event.acceptingFeedback || guest.feedbackSubmitted) ? (
        <GuestCard>
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#EBF3FF] text-[#0052FF]"><MessageSquareText className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-extrabold tracking-tight">
                {guest.feedbackSubmitted ? (team ? "Submission received" : "Thanks for your feedback") : team ? "Submit your team's work" : "How was it?"}
              </h3>
              <p className="mt-1 text-[14.5px] text-[#475569]">
                {guest.feedbackSubmitted
                  ? "We've got it. Certificates are issued once responses are reviewed."
                  : team
                    ? "One submission per team — the teammate you name gets it on their record too."
                    : "Two minutes. It shapes the next session, and your certificate is issued from it."}
              </p>
              {!guest.feedbackSubmitted ? <Link href={feedbackHref} className={`${primaryButton} mt-5`}>{team ? "Submit" : "Give feedback"}</Link> : null}
            </div>
          </div>
        </GuestCard>
      ) : null}

      {guest.certificateId || guest.certificateApproved ? (
        <GuestCard>
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#F3EEFF] text-[#6D28D9]"><Award className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-extrabold tracking-tight">{guest.certificateId ? "Your certificate is ready" : "Your certificate is being prepared"}</h3>
              <p className="mt-1 text-[14.5px] text-[#475569]">
                {guest.certificateId ? "It carries a unique ID anyone can verify, and it's ready to add to LinkedIn." : "It's approved — we'll email it to you as soon as it's issued."}
              </p>
              {guest.certificateId ? <Link href={`/certificates/${guest.certificateId}`} className={`${primaryButton} mt-5`}>View certificate</Link> : null}
            </div>
          </div>
        </GuestCard>
      ) : null}

      {guest.ownReferralCode ? (
        <GuestCard>
          <h3 className="text-[18px] font-extrabold tracking-tight">Bring a friend</h3>
          <p className="mt-1 mb-4 text-[14.5px] text-[#475569]">Share your link — registrations through it are credited to you.</p>
          <CopyLink path={`/events/${slug}?ref=${guest.ownReferralCode}`} />
        </GuestCard>
      ) : null}
    </GuestShell>
  );
}
