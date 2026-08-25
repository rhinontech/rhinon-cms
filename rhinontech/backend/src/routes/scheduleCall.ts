import { Router, Request, Response } from "express";
import { CalendarNotConnectedError, createEvent, getBusyIntervals } from "../services/googleCalendar";
import { sendMeetingInvite } from "../services/meetingInvite";
import { findOrMergeLead, str } from "../services/leadCapture";
import { enrollRealtimeLead } from "../services/workflowEngine";
import { notifyNewLead } from "./public";
import {
  BUSINESS_END_HOUR,
  BUSINESS_START_HOUR,
  SLOT_DURATION_MINUTES,
  findBookableSlot,
  generateDaySlots,
  isBookable,
  isValidDateStr,
  isWithinBookingWindow,
} from "../services/scheduling";

const router = Router();

const BUSINESS_TIMEZONE = "Asia/Kolkata";
const SOURCE = "Scheduler";

// Public bookings aren't made by a signed-in teammate, so the invite goes out from the
// company SES address. The .ics organizer is still Rhinon Labs (support@rhinon.tech).
function publicSender() {
  return { email: process.env.AWS_SES_FROM_EMAIL || "hello@rhinontech.in", name: "Rhinon Labs" };
}

// GET /public/schedule-call/availability?date=YYYY-MM-DD
// Slots already taken on the shared calendar come back available:false — including meetings
// booked from the admin Meetings tab, since that's the same calendar.
router.get("/schedule-call/availability", async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || "";
    if (!isValidDateStr(date) || !isWithinBookingWindow(date)) {
      res.status(400).json({ message: "Please provide a valid, bookable date." });
      return;
    }

    const slots = generateDaySlots(date);
    if (slots.length === 0) {
      res.json({ date, timezone: BUSINESS_TIMEZONE, slots: [] });
      return;
    }

    const busy = await getBusyIntervals(slots[0].startTime, slots[slots.length - 1].endTime);

    res.json({
      date,
      timezone: BUSINESS_TIMEZONE,
      businessHours: { start: BUSINESS_START_HOUR, end: BUSINESS_END_HOUR },
      slots: slots.map((s) => ({
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        available: isBookable(s, busy),
      })),
    });
  } catch (error: any) {
    if (error instanceof CalendarNotConnectedError) {
      // Don't advertise slots we can't actually book.
      res.status(503).json({ code: "CALENDAR_UNAVAILABLE", message: "Booking is temporarily unavailable." });
      return;
    }
    console.error("Failed to compute schedule-call availability:", error.message);
    res.status(500).json({ message: "Could not load available times." });
  }
});

// POST /public/schedule-call — book a slot on the shared calendar and email the visitor an invite.
router.post("/schedule-call", async (req: Request, res: Response) => {
  try {
    const b = req.body || {};

    const name = str(b.name, 200);
    const emailRaw = str(b.email, 320);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    if (!name || !email) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    const startTime = new Date(b.startTime);
    if (isNaN(startTime.getTime())) {
      res.status(400).json({ code: "INVALID_SLOT", message: "Please pick a time slot." });
      return;
    }

    const phone = str(b.phone, 40);
    const website = str(b.website, 300);
    const institutionType = str(b.institutionType, 200);
    const annualLeadVolume = str(b.annualLeadVolume, 100);
    const teamSize = str(b.teamSize, 100);
    const message = str(b.message, 5000);
    const visitorTimezone = str(b.timezone, 100) || BUSINESS_TIMEZONE;

    let company = str(b.company, 200);
    if (!company && website) {
      try {
        company = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
      } catch {
        /* unparseable website — fall through to the generic label */
      }
    }
    company = company || "Platform Lead";

    // Never trust the client's slot: re-derive it from the grid and re-check the calendar.
    // There's still a narrow window between this check and the insert below — acceptable at
    // this booking volume, and a double-booking surfaces on the shared calendar either way.
    const dayEnd = new Date(startTime.getTime() + 24 * 60 * 60_000);
    const busy = await getBusyIntervals(new Date(startTime.getTime() - 24 * 60 * 60_000), dayEnd);
    const slot = findBookableSlot(startTime, busy);
    if (!slot) {
      res.status(409).json({ code: "SLOT_TAKEN", message: "That time was just taken. Please pick another slot." });
      return;
    }

    const summary = [
      institutionType && `Institution: ${institutionType}`,
      teamSize && `Team size: ${teamSize}`,
      annualLeadVolume && `Annual lead volume: ${annualLeadVolume}`,
      message && `Message: ${message}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const raw = {
      institutionType,
      annualLeadVolume,
      teamSize,
      message,
      bookedFor: slot.startTime.toISOString(),
      visitorTimezone,
      submittedAt: new Date().toISOString(),
    };

    // Capture the lead first so a calendar hiccup can never lose the enquiry.
    const lead = await findOrMergeLead({
      name,
      email,
      company,
      phone,
      website,
      industry: institutionType,
      source: SOURCE,
      summary,
      raw,
    });

    let meetLink: string | null = null;
    let booked = false;
    let inviteSent = false;

    try {
      const event = await createEvent({
        summary: `Discovery Call: ${name}${company !== "Platform Lead" ? ` (${company})` : ""}`,
        description: summary || "Booked via rhinonlabs.com/schedule-call",
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendees: [email],
        addMeet: true,
      });
      booked = true;
      meetLink = event.meetLink;

      try {
        inviteSent = await sendMeetingInvite(event, "request", publicSender());
      } catch (err: any) {
        console.error("Failed to email schedule-call invite:", err.message);
      }
    } catch (err: any) {
      // The lead is safe and ops gets pinged below; tell the visitor we'll confirm by email
      // rather than claiming a booking that doesn't exist.
      console.error("Failed to create schedule-call calendar event:", err.message);
    }

    res.status(201).json({
      ok: true,
      booked,
      inviteSent,
      booking: { startTime: slot.startTime.toISOString(), endTime: slot.endTime.toISOString(), meetLink },
    });

    // Best-effort, after the response — never blocks or fails the request.
    void enrollRealtimeLead(lead, "Schedule a Call Form");
    void notifyNewLead(
      { name, email, whatsapp: phone, message, company },
      {
        originLabel: booked ? "Scheduler" : "Scheduler (CALENDAR FAILED — book manually)",
        extra: [
          ["Requested slot", `${slot.startTime.toISOString()} (visitor tz: ${visitorTimezone})`],
          ["On calendar", booked ? "yes" : "NO — needs manual booking"],
          ["Website", website],
          ["Institution Type", institutionType],
          ["Team Size", teamSize],
          ["Annual Lead Volume", annualLeadVolume],
        ],
      }
    );
  } catch (error: any) {
    console.error("Failed to book schedule-call:", error);
    res.status(500).json({ message: "Could not book that time. Please try again." });
  }
});

export default router;
