import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import {
  CalendarNotConnectedError,
  createEvent,
  deleteEvent,
  getConnectionStatus,
  getEvent,
  listEvents,
  updateEvent,
  type MeetingEvent,
} from "../services/googleCalendar";
import { sendMeetingInvite, type InviteKind } from "../services/meetingInvite";

const router = Router();

// Google is told not to email anyone (sendUpdates: "none") so the invite comes from the
// teammate who made the change, over SES, with our own .ics. A failed send must not undo a
// calendar change that already succeeded — report it instead and let the UI warn.
async function notifyAttendees(event: MeetingEvent, kind: InviteKind, req: AuthRequest): Promise<boolean> {
  const email = req.user?.companyEmail;
  if (!email) {
    console.warn(`No companyEmail for user ${req.user?.userId} — skipping ${kind} invite for event ${event.id}`);
    return false;
  }
  try {
    return await sendMeetingInvite(event, kind, { email, name: req.user!.fullName });
  } catch (err: any) {
    console.error(`Failed to send meeting ${kind} invite for ${event.id}:`, err.message);
    return false;
  }
}

// The shared support@rhinon.tech calendar isn't connected yet — surface that as a clean 409
// the UI can turn into "ask an admin to connect it", not a 500.
function handleError(error: any, res: Response, fallback: string) {
  if (error instanceof CalendarNotConnectedError) {
    res.status(409).json({ code: "CALENDAR_NOT_CONNECTED", message: error.message });
    return;
  }
  console.error(`${fallback}:`, error.response?.data?.error?.message || error.message);
  res.status(500).json({ message: error.response?.data?.error?.message || fallback });
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function str(v: unknown, max = 2000): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s.slice(0, max);
}

// GET /meetings/status — lets the Meetings tab show a "not connected yet" state.
router.get("/status", authenticate, authorize("meetings:read"), async (_req: AuthRequest, res: Response) => {
  try {
    const status = await getConnectionStatus();
    res.json({ connected: status.connected, connectedEmail: status.connectedEmail });
  } catch (error: any) {
    handleError(error, res, "Failed to read calendar status");
  }
});

// GET /meetings?from=ISO&to=ISO — events on the shared calendar for a window.
router.get("/", authenticate, authorize("meetings:read"), async (req: AuthRequest, res: Response) => {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (!from || !to) {
      res.status(400).json({ message: "`from` and `to` ISO timestamps are required" });
      return;
    }
    if (to <= from) {
      res.status(400).json({ message: "`to` must be after `from`" });
      return;
    }
    res.json(await listEvents(from, to));
  } catch (error: any) {
    handleError(error, res, "Failed to fetch meetings");
  }
});

// POST /meetings — create an event (optionally with a Google Meet link + attendees).
router.post("/", authenticate, authorize("meetings:write"), async (req: AuthRequest, res: Response) => {
  try {
    const summary = str(req.body?.summary, 300);
    const startTime = parseDate(req.body?.startTime);
    const endTime = parseDate(req.body?.endTime);

    if (!summary) {
      res.status(400).json({ message: "Title is required" });
      return;
    }
    if (!startTime || !endTime) {
      res.status(400).json({ message: "Valid start and end times are required" });
      return;
    }
    if (endTime <= startTime) {
      res.status(400).json({ message: "End time must be after the start time" });
      return;
    }

    const attendees = Array.isArray(req.body?.attendees)
      ? (req.body.attendees as unknown[])
          .map((a) => str(a, 320))
          .filter((a): a is string => Boolean(a && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)))
      : [];

    const event = await createEvent({
      summary,
      description: str(req.body?.description, 5000),
      location: str(req.body?.location, 500),
      startTime,
      endTime,
      attendees,
      addMeet: Boolean(req.body?.addMeet),
    });

    const invited = await notifyAttendees(event, "request", req);
    res.status(201).json({ ...event, inviteSent: invited });
  } catch (error: any) {
    handleError(error, res, "Failed to create meeting");
  }
});

// PATCH /meetings/:id — edit or reschedule (a reschedule is just a time-only patch).
router.patch("/:id", authenticate, authorize("meetings:write"), async (req: AuthRequest, res: Response) => {
  try {
    const startTime = parseDate(req.body?.startTime);
    const endTime = parseDate(req.body?.endTime);

    if ((req.body?.startTime && !startTime) || (req.body?.endTime && !endTime)) {
      res.status(400).json({ message: "Start and end times must be valid timestamps" });
      return;
    }
    if (startTime && endTime && endTime <= startTime) {
      res.status(400).json({ message: "End time must be after the start time" });
      return;
    }

    const patch: Parameters<typeof updateEvent>[1] = {};
    if (req.body?.summary !== undefined) {
      const summary = str(req.body.summary, 300);
      if (!summary) {
        res.status(400).json({ message: "Title cannot be empty" });
        return;
      }
      patch.summary = summary;
    }
    if (req.body?.description !== undefined) patch.description = str(req.body.description, 5000);
    if (req.body?.location !== undefined) patch.location = str(req.body.location, 500);
    if (startTime) patch.startTime = startTime;
    if (endTime) patch.endTime = endTime;
    if (Array.isArray(req.body?.attendees)) {
      patch.attendees = (req.body.attendees as unknown[])
        .map((a) => str(a, 320))
        .filter((a): a is string => Boolean(a && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)));
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ message: "Nothing to update" });
      return;
    }

    const event = await updateEvent(req.params.id, patch);
    // Same UID with a bumped SEQUENCE, so clients update the existing entry in place
    // rather than showing a second copy of the meeting.
    const invited = await notifyAttendees(event, "request", req);
    res.json({ ...event, inviteSent: invited });
  } catch (error: any) {
    if (error.code === 404 || error.response?.status === 404) {
      res.status(404).json({ message: "That meeting no longer exists on the calendar" });
      return;
    }
    handleError(error, res, "Failed to update meeting");
  }
});

// DELETE /meetings/:id
router.delete("/:id", authenticate, authorize("meetings:write"), async (req: AuthRequest, res: Response) => {
  try {
    // Read it first — once it's deleted we can't recover the attendee list or the iCalUID
    // that the CANCEL notice has to reference.
    let existing: MeetingEvent | null = null;
    try {
      existing = await getEvent(req.params.id);
    } catch (err: any) {
      if (!(err instanceof CalendarNotConnectedError)) {
        console.warn(`Couldn't read event ${req.params.id} before delete:`, err.message);
      } else {
        throw err;
      }
    }

    await deleteEvent(req.params.id);

    const invited = existing ? await notifyAttendees(existing, "cancel", req) : false;
    res.json({ ok: true, inviteSent: invited });
    return;
  } catch (error: any) {
    // Already gone on Google's side — treat as success so the UI converges.
    if (error.code === 404 || error.code === 410 || error.response?.status === 404 || error.response?.status === 410) {
      res.json({ ok: true, alreadyDeleted: true });
      return;
    }
    handleError(error, res, "Failed to delete meeting");
  }
});

export default router;
