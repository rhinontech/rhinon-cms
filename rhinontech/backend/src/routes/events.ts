import { Router, Response } from "express";
import { Op } from "sequelize";
import multer from "multer";
import { AuthRequest, authenticate, authorize } from "../middleware/authenticate";
import { Event, EventGuest, User } from "../models";
import { uploadBuffer, publicUrl } from "../services/storage";
import { runAsSystem } from "../services/tenantContext";

const router = Router();

// Automatically authenticate if token is supplied, or run in system context for public requests
router.use((req: AuthRequest, res: Response, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  return runAsSystem("events", next);
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper for slug generation / sanitization
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/* ----------------------------- EVENT CRUD & ACTIONS ----------------------------- */

// GET /events — list all events (both upcoming and past)
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const events = await Event.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ result: "SUCCESS", events });
  } catch (error: any) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ result: "ERROR", message: error.message || "Internal server error" });
  }
});

// GET /events/published — list only published events (for public website / UpperCurve)
router.get("/published", async (_req: AuthRequest, res: Response) => {
  try {
    const events = await Event.findAll({
      where: {
        [Op.or]: [{ isPublished: true }, { status: "Published" }],
      },
      order: [["eventStartDate", "ASC"], ["createdAt", "DESC"]],
    });

    res.status(200).json({ result: "SUCCESS", events });
  } catch (error: any) {
    console.error("Error fetching published events:", error);
    res.status(500).json({ result: "ERROR", message: error.message || "Internal server error" });
  }
});

// GET /events/past-events
router.get("/past-events", async (_req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const events = await Event.findAll({
      where: {
        eventEndDate: { [Op.lt]: today },
      },
      order: [["eventEndDate", "DESC"]],
    });

    res.status(200).json({ result: "SUCCESS", events });
  } catch (error: any) {
    console.error("Error fetching past events:", error);
    res.status(500).json({ result: "ERROR", message: error.message || "Internal server error" });
  }
});

// GET /events/slug-availability?slug=xyz
router.get("/slug-availability", async (req: AuthRequest, res: Response) => {
  try {
    const rawSlug = (req.query.slug as string)?.trim();
    if (!rawSlug) {
      return res.status(400).json({ result: "ERROR", error: "Slug is required" });
    }

    const slug = toSlug(rawSlug);
    const existing = await Event.findOne({
      where: { eventSlug: slug },
    });

    if (existing) {
      return res.status(200).json({
        result: "SUCCESS",
        available: false,
        slug,
        message: "URL already taken",
      });
    }

    return res.status(200).json({
      result: "SUCCESS",
      available: true,
      slug,
      message: "URL is available",
    });
  } catch (error: any) {
    console.error("Error checking slug availability:", error);
    return res.status(500).json({ result: "ERROR", available: false, message: error.message });
  }
});

// GET /events/slug/:slug — fetch event by slug
router.get("/slug/:slug", async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({
      where: { eventSlug: slug },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({ result: "SUCCESS", event });
  } catch (error: any) {
    console.error("Error fetching event by slug:", error);
    return res.status(500).json({ result: "ERROR", message: error.message });
  }
});

let legacyCleaned = false;
async function cleanLegacyEventColumns() {
  if (legacyCleaned) return;
  try {
    await Event.sequelize?.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
          FOR r IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'events' 
              AND is_nullable = 'NO' 
              AND column_name NOT IN ('id', 'createdAt', 'updatedAt')
          LOOP
            EXECUTE 'ALTER TABLE public.events ALTER COLUMN "' || r.column_name || '" DROP NOT NULL;';
          END LOOP;
        END IF;
      END $$;
    `);
    legacyCleaned = true;
  } catch (err) {
    console.warn("Failed to drop NOT NULL from legacy event columns:", err);
  }
}

// POST /events/create or POST /events — create a new event
const createEventHandler = async (req: AuthRequest, res: Response) => {
  try {
    await cleanLegacyEventColumns();
    const b = req.body || {};
    const {
      eventTitle,
      eventSubtitle,
      eventStartDate,
      eventEndDate,
      eventStartTime,
      eventEndTime,
      eventType = "Workshop",
      ctaType = "Join Waitlist",
      speakers = [],
      numberOfAttendees = 0,
      eventCreativeUrl,
      tags = [],
      location,
      locationType,
      isPublished = false,
      eventDetails = {},
      eventSlug,
      eventCategory = "Normal",
      canAcceptResponse = false,
    } = b;

    if (!eventTitle || !eventStartDate || !eventEndDate || !eventType || !eventSlug) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cleanSlug = toSlug(eventSlug);
    const existing = await Event.findOne({
      where: { eventSlug: cleanSlug },
    });

    if (existing) {
      return res.status(409).json({
        error: "Event slug already in use. Please choose a different one.",
      });
    }

    const newEvent = await Event.create({
      eventTitle,
      title: eventTitle,
      eventSubtitle,
      excerpt: eventSubtitle || "",
      content: "",
      eventStartDate,
      eventEndDate,
      eventStartTime,
      eventEndTime,
      eventType,
      ctaType,
      speakers,
      numberOfAttendees,
      eventCreativeUrl,
      tags,
      location,
      locationType,
      isPublished,
      status: isPublished ? "Published" : "Draft",
      eventDetails,
      eventSlug: cleanSlug,
      slug: cleanSlug,
      eventCategory,
      canAcceptResponse,
      createdById: req.user?.userId || null,
    });

    return res.status(201).json({
      result: "SUCCESS",
      newEvent,
    });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

router.post("/create", createEventHandler);
router.post("/", createEventHandler);

// GET /events/:id — fetch single event
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({ result: "SUCCESS", event });
  } catch (error: any) {
    console.error("Error fetching event by ID:", error);
    return res.status(500).json({ result: "ERROR", message: error.message });
  }
});

// PUT /events/:id — update event
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.createdById;

    if (updates.eventSlug && updates.eventSlug !== event.eventSlug) {
      const cleanSlug = toSlug(updates.eventSlug);
      const conflict = await Event.findOne({
        where: { eventSlug: cleanSlug, id: { [Op.ne]: event.id } },
      });
      if (conflict) {
        return res.status(409).json({ error: "Event URL already in use." });
      }
      updates.eventSlug = cleanSlug;
    }

    await event.update(updates);

    return res.status(200).json({
      result: "SUCCESS",
      message: "Event updated successfully",
      updatedEvent: event,
      event,
    });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /events/:id — delete event
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await event.destroy();

    return res.status(200).json({
      result: "SUCCESS",
      message: "Event deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /events/:id/publish — toggle publication status
router.post("/:id/publish", async (req: AuthRequest, res: Response) => {
  try {
    const { isPublished } = req.body;
    if (typeof isPublished !== "boolean") {
      return res.status(400).json({ error: "'isPublished' must be a boolean value" });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    event.isPublished = isPublished;
    await event.save();

    return res.status(200).json({
      result: "SUCCESS",
      message: `Event ${isPublished ? "published" : "unpublished"} successfully`,
      event,
    });
  } catch (error: any) {
    console.error("Error updating publish status:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /events/:id/duplicate — duplicate event
router.post("/:id/duplicate", async (req: AuthRequest, res: Response) => {
  try {
    await cleanLegacyEventColumns();
    const sourceEvent = await Event.findByPk(req.params.id);
    if (!sourceEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const {
      eventTitle,
      eventSlug,
      eventStartDate,
      eventEndDate,
      eventStartTime,
      eventEndTime,
      isPublished = false,
    } = req.body;

    const targetSlug = toSlug(eventSlug || `${sourceEvent.eventSlug}-copy`);
    const existing = await Event.findOne({ where: { eventSlug: targetSlug } });
    if (existing) {
      return res.status(409).json({ error: "Event URL already exists" });
    }

    const resolvedTitle = eventTitle || `${sourceEvent.eventTitle} (Copy)`;
    const newEvent = await Event.create({
      eventTitle: resolvedTitle,
      title: resolvedTitle,
      eventSubtitle: sourceEvent.eventSubtitle,
      excerpt: sourceEvent.eventSubtitle || "",
      content: "",
      eventStartDate: eventStartDate || sourceEvent.eventStartDate,
      eventEndDate: eventEndDate || sourceEvent.eventEndDate,
      eventStartTime: eventStartTime || sourceEvent.eventStartTime,
      eventEndTime: eventEndTime || sourceEvent.eventEndTime,
      eventType: sourceEvent.eventType,
      ctaType: sourceEvent.ctaType,
      speakers: sourceEvent.speakers,
      numberOfAttendees: sourceEvent.numberOfAttendees,
      eventCreativeUrl: sourceEvent.eventCreativeUrl,
      tags: sourceEvent.tags,
      location: sourceEvent.location,
      locationType: sourceEvent.locationType,
      isPublished,
      status: isPublished ? "Published" : "Draft",
      eventDetails: sourceEvent.eventDetails,
      eventSlug: targetSlug,
      slug: targetSlug,
      eventCategory: sourceEvent.eventCategory,
      canAcceptResponse: false,
      createdById: req.user?.userId || null,
    });

    return res.status(201).json({
      result: "SUCCESS",
      message: "Event duplicated successfully",
      newEvent,
    });
  } catch (error: any) {
    console.error("Error duplicating event:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PATCH /events/:id/toggle-response — toggle accept response
router.patch("/:id/toggle-response", async (req: AuthRequest, res: Response) => {
  try {
    const { canAcceptResponse } = req.body;
    if (typeof canAcceptResponse !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "canAcceptResponse must be a boolean value",
      });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.canAcceptResponse = canAcceptResponse;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Response acceptance ${canAcceptResponse ? "enabled" : "disabled"} successfully`,
      data: {
        eventId: event.id,
        canAcceptResponse: event.canAcceptResponse,
      },
    });
  } catch (error: any) {
    console.error("Error toggling accept response:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ----------------------------- GUESTS & ATTENDEES ----------------------------- */

// POST /events/register or POST /events/guests — register a guest for an event
export const registerEventHandler = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    const {
      eventId,
      eventSlug,
      name,
      fullName,
      email,
      phone,
      linkedin,
      referralCode,
      role,
      userType,
      graduationYear,
      collegeName,
      expectation,
      additionalData,
    } = b;

    const guestName = (name || fullName || "").trim();
    const guestEmail = (email || "").trim().toLowerCase();

    if (!guestName || !guestEmail) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Resolve event by id or slug
    let event: Event | null = null;
    if (eventId) {
      event = await Event.findByPk(eventId);
    }
    if (!event && eventSlug) {
      event = await Event.findOne({
        where: {
          [Op.or]: [{ eventSlug }, { slug: eventSlug }],
        },
      });
    }
    if (!event) {
      // Pick latest published event if not specified
      event = await Event.findOne({
        where: { [Op.or]: [{ isPublished: true }, { status: "Published" }] },
        order: [["createdAt", "DESC"]],
      });
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check duplicate
    const existing = await EventGuest.findOne({
      where: {
        eventId: event.id,
        email: guestEmail,
      },
    });

    if (existing) {
      return res.status(200).json({
        result: "SUCCESS",
        alreadyRegistered: true,
        message: "You are already registered for this event!",
        guest: existing,
      });
    }

    // Auto-approve logic:
    // If canAcceptResponse is true or Teardown/Hackathon event, approve; otherwise Waitlist
    const isAutoApproved =
      event.canAcceptResponse ||
      ["Teardown", "Hackathon"].includes(event.eventType);
    const guestType = isAutoApproved ? "Approved" : "Waitlist";

    const guest = await EventGuest.create({
      eventId: event.id,
      name: guestName,
      email: guestEmail,
      phone: phone ? phone.trim() : null,
      linkedin: linkedin ? linkedin.trim() : null,
      referralCode: referralCode ? referralCode.trim() : null,
      role: role || null,
      userType: userType || "Professional",
      graduationYear: graduationYear || null,
      collegeName: collegeName || null,
      eventType: event.eventType,
      eventName: event.eventTitle,
      guestType,
      additionalData: {
        ...(additionalData || {}),
        ...(expectation ? { expectation } : {}),
      },
      siteId: event.siteId || null,
      organizationId: event.organizationId || null,
    });

    // Increment attendees counter
    try {
      await event.increment("numberOfAttendees", { by: 1 });
    } catch {
      // Non-fatal
    }

    return res.status(201).json({
      result: "SUCCESS",
      message: guestType === "Approved" ? "Registration confirmed!" : "Added to waitlist!",
      guest,
    });
  } catch (error: any) {
    console.error("Error registering event guest:", error);
    return res.status(500).json({ result: "ERROR", message: error.message || "Failed to register" });
  }
};

router.post("/register", registerEventHandler);
router.post("/guests", registerEventHandler);

// POST /events/guests/by-id — list registrations for an event
router.post("/guests/by-id", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    const registrations = await EventGuest.findAll({
      where: { eventId },
      include: [
        {
          model: User.unscoped(),
          as: "user",
          attributes: ["id", "fullName", "companyEmail", "personalEmail", "avatarKey"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const mappedRegistrations = registrations.map((r: any) => {
      const plain = typeof r.toJSON === "function" ? r.toJSON() : r;
      if (plain.user) {
        plain.user.email = plain.user.companyEmail || plain.user.personalEmail || "";
        plain.user.avatarUrl = plain.user.avatarKey ? publicUrl(plain.user.avatarKey) : null;
      }
      return plain;
    });

    return res.status(200).json({
      result: "SUCCESS",
      registrations: mappedRegistrations,
    });
  } catch (error: any) {
    console.error("Error fetching guests by eventId:", error);
    return res.status(500).json({ result: "ERROR", message: error.message });
  }
});

// POST /events/approve-guests — bulk approve/decline guests
router.post("/approve-guests", async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, status, eventId } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !eventId) {
      return res.status(400).json({ error: "userIds (array) and eventId are required" });
    }

    const [updatedCount] = await EventGuest.update(
      { guestType: status },
      {
        where: {
          [Op.or]: [
            { id: { [Op.in]: userIds } },
            { userId: { [Op.in]: userIds } },
          ],
          eventId,
        },
      }
    );

    return res.status(200).json({
      result: "SUCCESS",
      message: `${updatedCount} guest(s) updated`,
    });
  } catch (error: any) {
    console.error("Error approving guests:", error);
    return res.status(500).json({ result: "ERROR", message: error.message });
  }
});

// GET /events/referrals/with-referees
router.get("/referrals/with-referees", async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.query.eventId as string;
    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    const guests = await EventGuest.findAll({
      where: { eventId, referralCode: { [Op.ne]: null } },
    });

    const summaryMap: Record<string, any> = {};
    for (const g of guests) {
      const code = g.referralCode!;
      if (!summaryMap[code]) {
        summaryMap[code] = {
          id: g.id,
          name: g.name,
          email: g.email || "",
          phone: g.phone || "",
          referralCode: code,
          memberCount: 0,
          type: g.userType || "General",
        };
      }
      summaryMap[code].memberCount += 1;
    }

    return res.status(200).json({
      result: "SUCCESS",
      data: Object.values(summaryMap),
    });
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    return res.status(500).json({ result: "ERROR", message: error.message });
  }
});

// POST /events/referrals/by-code
router.post("/referrals/by-code", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, referralCode } = req.body;
    if (!eventId || !referralCode) {
      return res.status(400).json({ error: "eventId and referralCode are required" });
    }

    const referrals = await EventGuest.findAll({
      where: { eventId, referralCode },
    });

    const referredMembers = referrals.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email || "",
      phone: r.phone || "",
    }));

    return res.status(200).json({
      referralId: referralCode,
      referralCode,
      referredMembers,
    });
  } catch (error: any) {
    console.error("Error fetching referees by code:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /events/send-notification
router.post("/send-notification", async (_req: AuthRequest, res: Response) => {
  return res.status(200).json({ result: "SUCCESS", message: "Notification queued" });
});

// GET /events/feedback/:eventId
router.get("/feedback/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await EventGuest.findAll({
      where: {
        eventId,
        feedbackSubmittedAt: { [Op.ne]: null },
      },
      order: [["feedbackSubmittedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /events/upload (or banner upload)
router.post("/upload", upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const key = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      "content",
      req.file.mimetype
    );
    const fileUrl = publicUrl(key);
    return res.status(200).json({ fileUrl, url: fileUrl });
  } catch (error: any) {
    console.error("Event image upload failed:", error);
    return res.status(500).json({ message: error.message || "Upload failed" });
  }
});

export default router;
