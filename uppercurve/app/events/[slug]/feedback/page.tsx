import type { Metadata } from "next";
import Link from "next/link";
import { getGuestPage } from "@/services/eventService";
import { GuestCard, GuestShell, InvalidLink, primaryButton } from "@/components/Pages/Events/Guest/GuestShell";
import FeedbackForm from "@/components/Pages/Events/Guest/FeedbackForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Feedback — UpperCurve", robots: { index: false, follow: false }, referrer: "no-referrer" };

function Notice({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <GuestCard className="text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-[#475569]">{body}</p>
      <Link href={href} className={`${primaryButton} mt-6`}>Your registration</Link>
    </GuestCard>
  );
}

/**
 * The states mirror Product Space's feedback flow: NotRegistered (a bad link),
 * NotApproved, FeedbackAlreadySubmitted and a closed event, before the form.
 */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ slug }, { token }] = await Promise.all([params, searchParams]);
  if (!token) return <InvalidLink message="Feedback needs the personal link from your email." />;
  const data = await getGuestPage(slug, token);
  if ("error" in data) return <InvalidLink message={data.error} />;

  const { guest, event } = data;
  const team = ["Hackathon", "Teardown"].includes(event.type);
  const registrationHref = `/events/${slug}/registered?token=${encodeURIComponent(token)}`;

  return (
    <GuestShell event={event} eyebrow={team ? "Submission" : "Feedback"}>
      {guest.guestType !== "Approved" ? (
        <Notice title="Feedback is for confirmed guests" body="Your registration wasn't confirmed for this session, so there's nothing to review — we'd love to see you at the next one." href={registrationHref} />
      ) : guest.feedbackSubmitted ? (
        <Notice title={team ? "Your team has already submitted" : "You've already sent feedback"} body="Only one response per guest. If something needs correcting, reply to any of our emails." href={registrationHref} />
      ) : !event.acceptingFeedback ? (
        <Notice title={team ? "Submissions aren't open" : "Feedback isn't open yet"} body="The host opens responses around the end of the session. We'll email you the moment they do." href={registrationHref} />
      ) : (
        <FeedbackForm slug={slug} token={token} eventType={event.type} guest={{ name: guest.name, email: guest.email }} registrationHref={registrationHref} />
      )}
    </GuestShell>
  );
}
