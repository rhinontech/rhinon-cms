/**
 * Fills one chatbot with realistic demo conversations, for demos and UI work.
 *
 *   npx ts-node --transpile-only src/scripts/seedChatbotDemo.ts <publicId>
 *
 * Writes to whatever DATABASE_URL points at — check it first. Every row it makes
 * is tagged meta.demo = true, and a rerun deletes those (and their messages)
 * before writing fresh ones, so it never piles up and never touches real chats.
 * Leads go through findOrMergeLead with @example.com addresses.
 */
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import "../models";
import { Chatbot } from "../models/Chatbot";
import { Site } from "../models/Site";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { ChatConversation } from "../models/ChatConversation";
import { ChatMessage } from "../models/ChatMessage";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { runForSite } from "../services/siteContext";
import { findOrMergeLead } from "../services/leadCapture";
import { newPublicKey } from "../services/chatbot/chatStore";

type Line = [role: "user" | "bot" | "support", text: string, minutesAfterStart: number];

interface DemoChat {
  name: string | null;
  email: string | null;
  phone?: string;
  hoursAgo: number;
  mode: "bot" | "human";
  status: "open" | "closed";
  unread?: number;
  pinned?: boolean;
  meta?: Record<string, unknown>;
  review?: Record<string, string>;
  lines: Line[];
  /** Lines from this index on are the human part of the chat. */
  humanFrom?: number;
}

const CHATS: DemoChat[] = [
  {
    name: "Ananya Sharma", email: "ananya.sharma@example.com", phone: "+91 98201 44120", hoursAgo: 0.2, mode: "human", status: "open", unread: 2, pinned: true,
    meta: { city: "Mumbai", country: "India", pageUrl: "https://rhinonlabs.com/pricing", handoffRequestedAt: new Date().toISOString(), handoffReason: "Wants a quote for a fintech MVP" },
    humanFrom: 6,
    lines: [
      ["user", "Hi! How much does it cost to build an MVP with you?", 0],
      ["bot", "A typical MVP engagement starts at INR 4,00,000 and takes 6 to 8 weeks, depending on scope.", 0.2],
      ["user", "It's a lending app — KYC, loan applications and an admin dashboard.", 1],
      ["bot", "That's a common fintech scope. KYC and an admin panel usually fit in the standard MVP timeline. Can I get your name and email so the team can send a proper quote?", 1.2],
      ["user", "Ananya, ananya.sharma@example.com", 2],
      ["bot", "Thanks, Ananya! I've passed this to the team — someone will reach out shortly.", 2.2],
      ["support", "Hi Ananya, Prabhat here from Rhinon Labs. Happy to help with the lending app — do you already have designs, or should we include UX?", 6],
      ["user", "We have rough wireframes in Figma.", 8],
      ["user", "Also, can you integrate with Setu for account aggregation?", 8.5],
    ],
  },
  {
    name: null, email: null, hoursAgo: 0.6, mode: "bot", status: "open",
    meta: { city: "Bengaluru", country: "India", pageUrl: "https://rhinonlabs.com/services/ai-automation" },
    lines: [
      ["user", "Do you build AI agents for customer support?", 0],
      ["bot", "Yes — we design and build AI workflows and assistants that plug into your existing tools, like your helpdesk or CRM, to cut manual work.", 0.2],
      ["user", "Which LLMs do you use?", 1.5],
      ["bot", "We pick the model per use case — Gemini, GPT or Claude are typical — based on cost, latency and data-privacy needs.", 1.7],
    ],
  },
  {
    name: "Rahul Verma", email: "rahul.v@example.com", hoursAgo: 3, mode: "human", status: "open",
    meta: { city: "Delhi", country: "India", pageUrl: "https://rhinonlabs.com/case-studies" },
    humanFrom: 4,
    lines: [
      ["user", "Can I see examples of dashboards you've built?", 0],
      ["bot", "Sure! Our case studies page covers internal dashboards and automation projects. Would you like the team to walk you through a relevant one?", 0.2],
      ["user", "Yes please, something for logistics.", 1],
      ["bot", "Got it — could you share your email so the team can follow up?", 1.2],
      ["support", "Hi Rahul, we've built a fleet-tracking dashboard for a logistics client — I'll email you the case study now.", 30],
      ["user", "Great, thanks!", 34],
    ],
  },
  {
    name: "Sophie Turner", email: "sophie.t@example.com", hoursAgo: 9, mode: "human", status: "closed",
    meta: { city: "London", country: "United Kingdom", pageUrl: "https://rhinonlabs.com/" },
    review: { rating: "5", comment: "Super quick and helpful, thank you!" },
    humanFrom: 2,
    lines: [
      ["user", "Do you work with clients in the UK?", 0],
      ["bot", "Yes, we work with teams worldwide and overlap with UK hours for calls.", 0.2],
      ["support", "Hi Sophie — yes, about a third of our clients are in the UK and EU. Would a call on Thursday work?", 5],
      ["user", "Thursday 3pm GMT works.", 7],
      ["support", "Booked! You'll get a calendar invite shortly.", 8],
    ],
  },
  {
    name: "Karan Mehta", email: "karan.mehta@example.com", hoursAgo: 20, mode: "bot", status: "closed",
    meta: { city: "Pune", country: "India", pageUrl: "https://rhinonlabs.com/services/mvp-development" },
    review: { rating: "4" },
    lines: [
      ["user", "How long does an MVP take?", 0],
      ["bot", "A typical MVP engagement takes 6 to 8 weeks.", 0.2],
      ["user", "And who owns the code?", 1],
      ["bot", "You do — full IP and source code are handed over to you.", 1.2],
    ],
  },
  {
    name: "Neha Gupta", email: "neha.gupta@example.com", hoursAgo: 30, mode: "human", status: "open",
    meta: { ticket: true, subject: "Invoice copy for September", city: "Hyderabad", country: "India" },
    lines: [["user", "Ticket: Invoice copy for September\n\nDetails: Please resend the September invoice with our GSTIN added.", 0]],
  },
  {
    name: null, email: "james.lee@example.com", hoursAgo: 48, mode: "bot", status: "open",
    meta: { city: "Singapore", country: "Singapore", pageUrl: "https://rhinonlabs.com/blogs" },
    lines: [
      ["user", "Do you offer ongoing support after launch?", 0],
      ["bot", "Yes — support plans start at INR 40,000 per month and cover fixes, monitoring and small improvements.", 0.2],
    ],
  },
  {
    name: "Arjun Nair", email: "arjun.nair@example.com", hoursAgo: 72, mode: "human", status: "closed",
    meta: { city: "Kochi", country: "India" },
    review: { rating: "5", comment: "Got everything I needed." },
    humanFrom: 2,
    lines: [
      ["user", "Can you migrate our app from Firebase to AWS?", 0],
      ["bot", "We do migrations like that. I'll connect you with the team for specifics.", 0.2],
      ["support", "Hi Arjun — yes, we've done several Firebase → AWS moves. Sending a short questionnaire to your email.", 15],
    ],
  },
  {
    name: null, email: null, hoursAgo: 120, mode: "bot", status: "closed",
    meta: { city: "New York", country: "United States", pageUrl: "https://rhinonlabs.com/" },
    lines: [
      ["user", "hello", 0],
      ["bot", "Hi! How can I help you today?", 0.1],
    ],
  },
  {
    name: "Meera Iyer", email: "meera.iyer@example.com", hoursAgo: 160, mode: "bot", status: "closed",
    meta: { city: "Chennai", country: "India", pageUrl: "https://rhinonlabs.com/pricing" },
    lines: [
      ["user", "Is there a discount for early-stage startups?", 0],
      ["bot", "I don't have details on discounts — the team can tell you about current offers. Want me to pass on your email?", 0.2],
      ["user", "Sure, meera.iyer@example.com", 1],
      ["bot", "Thanks, Meera! The team will reach out shortly.", 1.2],
    ],
  },
];

async function main() {
  const publicId = process.argv[2];
  if (!publicId) throw new Error("Usage: seedChatbotDemo.ts <publicId>");

  const bot = await runAsSystem("demo:find-bot", () => Chatbot.unscoped().findOne({ where: { publicId } }));
  if (!bot) throw new Error(`No chatbot ${publicId}`);
  const organizationId = (bot as any).organizationId as string;
  const site = bot.siteId ? await runAsSystem("demo:site", () => Site.unscoped().findByPk(bot.siteId!)) : null;

  await runForOrg(organizationId, () =>
    runForSite(site ? { id: site.id, slug: site.slug } : null, true, async () => {
      // Agent replies come from the workspace's superadmin.
      const agent = await User.findOne({ include: [{ model: Role, as: "role", where: { slug: "superadmin" } }], order: [["createdAt", "ASC"]] });

      const old = await ChatConversation.findAll({ where: { chatbotId: bot.id, meta: { demo: true } } as any, attributes: ["id"] });
      if (old.length) {
        await ChatMessage.destroy({ where: { conversationId: { [Op.in]: old.map((c) => c.id) } } });
        await ChatConversation.destroy({ where: { id: { [Op.in]: old.map((c) => c.id) } } });
      }

      for (const [i, chat] of CHATS.entries()) {
        const start = new Date(Date.now() - chat.hoursAgo * 3600_000);
        const lead = chat.email
          ? await findOrMergeLead({ name: chat.name || chat.email.split("@")[0], email: chat.email, phone: chat.phone ?? null, source: "Website chatbot", summary: "Demo conversation from the website chatbot." })
          : null;
        const last = chat.lines[chat.lines.length - 1];
        const conv = await ChatConversation.create({
          chatbotId: bot.id,
          publicKey: newPublicKey(),
          // Tickets use the same visitor id the widget's "Your tickets" list looks up.
          visitorId: chat.meta?.ticket && chat.email ? `ticket:${chat.email}` : `demo-visitor-${i + 1}`,
          visitorName: chat.name,
          visitorEmail: chat.email,
          visitorPhone: chat.phone ?? null,
          title: (chat.meta?.subject as string) || chat.lines[0][1].slice(0, 80),
          mode: chat.mode,
          status: chat.status,
          assignedUserId: chat.mode === "human" && agent ? agent.id : null,
          unreadCount: chat.unread ?? 0,
          isPinned: !!chat.pinned,
          review: chat.review ? { ...chat.review, submittedAt: new Date(start.getTime() + 60 * 60_000).toISOString() } : null,
          leadId: lead?.id ?? null,
          meta: { demo: true, ...chat.meta },
          lastMessagePreview: last[1].replace(/\s+/g, " ").slice(0, 280),
          closedAt: chat.status === "closed" ? new Date(start.getTime() + (last[2] + 5) * 60_000) : null,
        });

        for (const [j, [role, text, minutes]] of chat.lines.entries()) {
          const at = new Date(start.getTime() + minutes * 60_000);
          const msg = await ChatMessage.create({
            conversationId: conv.id,
            role,
            phase: chat.humanFrom !== undefined && j >= chat.humanFrom ? "human" : chat.meta?.ticket ? "human" : "bot",
            text,
            agentUserId: role === "support" ? agent?.id ?? null : null,
            agentName: role === "support" ? agent?.fullName ?? "Team" : null,
          });
          await sequelize.query(`UPDATE chat_messages SET "createdAt" = :at, "updatedAt" = :at WHERE id = :id`, { replacements: { at, id: msg.id }, type: QueryTypes.UPDATE });
        }
        const lastAt = new Date(start.getTime() + last[2] * 60_000);
        await sequelize.query(
          `UPDATE chat_conversations SET "createdAt" = :start, "lastMessageAt" = :last, "updatedAt" = :last WHERE id = :id`,
          { replacements: { start, last: lastAt, id: conv.id }, type: QueryTypes.UPDATE }
        );
      }
      console.log(`Seeded ${CHATS.length} demo conversations on ${publicId}${old.length ? ` (replaced ${old.length})` : ""}.`);
    })
  , { label: "demo:seed-chatbot" });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
