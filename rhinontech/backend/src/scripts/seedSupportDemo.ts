/**
 * Demo tickets and help-center articles for one chatbot, for demos and UI work.
 *
 *   npx ts-node --transpile-only src/scripts/seedSupportDemo.ts <publicId>
 *
 * Writes to whatever DATABASE_URL points at — check it first. Demo tickets
 * carry the "demo" tag and @example.com addresses; a rerun deletes them first.
 * Help articles are only added when the bot has no collections yet, so a
 * real help center is never touched.
 */
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import "../models";
import { Chatbot } from "../models/Chatbot";
import { Site } from "../models/Site";
import { User } from "../models/User";
import { ChatbotTicket, type TicketPriority, type TicketStatus } from "../models/ChatbotTicket";
import { ChatbotTicketMessage } from "../models/ChatbotTicketMessage";
import { HelpFolder } from "../models/HelpFolder";
import { HelpArticle } from "../models/HelpArticle";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { runForSite } from "../services/siteContext";
import { newTicketCode } from "../services/chatbot/support";

type Msg = [role: "customer" | "agent" | "note", text: string, hoursAfterOpen: number];

const TICKETS: {
  name: string; email: string; subject: string; status: TicketStatus; priority: TicketPriority;
  hoursAgo: number; assign?: boolean; rating?: number; tags?: string[]; data: Record<string, string>; thread: Msg[];
}[] = [
  {
    name: "Rohan Mehta", email: "rohan.mehta@example.com", subject: "Charged twice for the March invoice", status: "open", priority: "urgent", hoursAgo: 1.5, tags: ["billing"],
    data: { phone: "+91 98111 20456", details: "My card was charged twice for invoice INV-2031. Please refund one of them." },
    thread: [["customer", "My card was charged twice for invoice INV-2031. Please refund one of them.", 0]],
  },
  {
    name: "Sara Thomas", email: "sara.thomas@example.com", subject: "Can't log in to the client dashboard", status: "open", priority: "high", hoursAgo: 4, assign: true, tags: ["access"],
    data: { details: "The password reset link says it has expired, every time I try." },
    thread: [
      ["customer", "The password reset link says it has expired, every time I try.", 0],
      ["note", "Reset links expire after 30 min — she may be opening an old email. Checking logs.", 0.5],
    ],
  },
  {
    name: "Vikram Iyer", email: "vikram.iyer@example.com", subject: "Need an NDA before sharing our requirements", status: "pending", priority: "medium", hoursAgo: 26, assign: true, tags: ["sales"],
    data: { company: "Iyer Logistics", details: "We want to discuss a fleet tracking app but need an NDA in place first." },
    thread: [
      ["customer", "We want to discuss a fleet tracking app but need an NDA in place first.", 0],
      ["agent", "Hi Vikram, happy to. I've attached our standard mutual NDA — sign it and send it back, or share yours and we'll review it within a day.", 2],
    ],
  },
  {
    name: "Neha Kapoor", email: "neha.kapoor@example.com", subject: "Change the delivery date for milestone 2", status: "pending", priority: "low", hoursAgo: 50,
    data: { details: "Our launch moved by two weeks. Can milestone 2 move to the 28th?" },
    thread: [
      ["customer", "Our launch moved by two weeks. Can milestone 2 move to the 28th?", 0],
      ["agent", "That works for us. I've updated the plan — you'll get a revised timeline by email shortly.", 5],
    ],
  },
  {
    name: "Arjun Nair", email: "arjun.nair@example.com", subject: "App crashes when uploading photos on Android 14", status: "resolved", priority: "high", hoursAgo: 96, assign: true, rating: 5, tags: ["bug", "mobile"],
    data: { device: "Pixel 7, Android 14", details: "Picking more than 5 photos closes the app." },
    thread: [
      ["customer", "Picking more than 5 photos closes the app. Pixel 7, Android 14.", 0],
      ["agent", "Thanks Arjun — we reproduced it. A fix is in build 2.4.1, rolling out today.", 3],
      ["customer", "Updated and it works now. Thank you!", 30],
      ["agent", "Great to hear. Closing this one — reply any time if it comes back.", 31],
    ],
  },
  {
    name: "Meera Joshi", email: "meera.joshi@example.com", subject: "GST number missing on invoices", status: "resolved", priority: "medium", hoursAgo: 170, rating: 4, tags: ["billing"],
    data: { gstin: "27AAPFU0939F1ZV", details: "Please add our GSTIN to past and future invoices." },
    thread: [
      ["customer", "Please add our GSTIN 27AAPFU0939F1ZV to past and future invoices.", 0],
      ["agent", "Done — reissued invoices are on their way, and new ones will include it.", 6],
    ],
  },
];

const HELP: { name: string; description: string; articles: { title: string; content: string; draft?: boolean }[] }[] = [
  {
    name: "Getting started",
    description: "How working with us begins",
    articles: [
      { title: "How does a project start?", content: "<p>Every project starts with a free 30-minute discovery call. We learn what you're building, who it's for and what success looks like.</p><h2>After the call</h2><ol><li>We send a written proposal with scope, timeline and cost within 3 working days.</li><li>Once you approve it, we sign an agreement and an NDA.</li><li>Your project manager schedules the kickoff.</li></ol>" },
      { title: "What do you need from me?", content: "<p>To start quickly, have these ready:</p><ul><li>A short description of the product and its users</li><li>Any designs, documents or competitors you like</li><li>Who on your side makes decisions</li></ul><p>Nothing is finished? That's fine — the discovery call is for exactly that.</p>" },
      { title: "How long does an MVP take?", content: "<p>Most MVPs take <strong>6 to 10 weeks</strong>, depending on scope. We ship a working build every two weeks so you can see progress and change direction early.</p>" },
    ],
  },
  {
    name: "Billing and payments",
    description: "Invoices, payment terms and refunds",
    articles: [
      { title: "How are payments split?", content: "<p>Fixed-price projects are billed in milestones: usually <strong>30% upfront</strong>, then the rest across delivery milestones. Monthly retainers are billed at the start of each month.</p>" },
      { title: "Which payment methods do you accept?", content: "<p>Bank transfer (NEFT/RTGS/IMPS), UPI and international wire transfers. Card payments are available on request.</p>" },
      { title: "How do refunds work?", content: "<p>If you were charged in error, raise a ticket from this chat and we'll refund it within <strong>5 working days</strong>.</p>" },
      { title: "Adding a GST number to invoices", content: "<p>Send us your GSTIN and we'll add it to all future invoices and reissue past ones.</p>", draft: true },
    ],
  },
  {
    name: "Support and maintenance",
    description: "What happens after launch",
    articles: [
      { title: "What support do I get after launch?", content: "<p>Every project includes <strong>30 days of free bug fixes</strong> after launch. After that, choose a maintenance plan or pay as you go.</p>" },
      { title: "How fast do you respond?", content: "<p>Tickets are answered within one working day. Urgent production issues on a maintenance plan get a response within 2 hours.</p>" },
    ],
  },
];

async function main() {
  const publicId = process.argv[2];
  if (!publicId) throw new Error("Usage: seedSupportDemo.ts <publicId>");
  const bot = await runAsSystem("demo:find-bot", () => Chatbot.unscoped().findOne({ where: { publicId } }));
  if (!bot) throw new Error(`No chatbot ${publicId}`);
  const organizationId = (bot as any).organizationId as string;
  const site = bot.siteId ? await runAsSystem("demo:site", () => Site.unscoped().findByPk(bot.siteId!)) : null;

  await runForOrg(organizationId, () =>
    runForSite(site ? { id: site.id, slug: site.slug } : null, true, async () => {
      const agent = await User.findOne({ order: [["createdAt", "ASC"]] });
      const old = await ChatbotTicket.findAll({ where: { chatbotId: bot.id, tags: { [Op.contains]: ["demo"] } } });
      if (old.length) {
        await ChatbotTicketMessage.destroy({ where: { ticketId: old.map((t) => t.id) } });
        await ChatbotTicket.destroy({ where: { id: old.map((t) => t.id) } });
      }
      const now = Date.now();
      for (const t of TICKETS) {
        const opened = new Date(now - t.hoursAgo * 3600_000);
        const last = new Date(opened.getTime() + Math.max(...t.thread.map((m) => m[2])) * 3600_000);
        const ticket = await ChatbotTicket.create({
          chatbotId: bot.id,
          code: await newTicketCode(),
          subject: t.subject,
          customerEmail: t.email,
          customerName: t.name,
          customData: t.data,
          status: t.status,
          priority: t.priority,
          tags: ["demo", ...(t.tags ?? [])],
          assignedUserId: t.assign || t.thread.some((m) => m[0] !== "customer") ? agent?.id ?? null : null,
          rating: t.rating ?? null,
          isNew: t.status === "open" && !t.assign,
          lastActivityAt: last,
        });
        await sequelize.query(`UPDATE chatbot_tickets SET "createdAt" = :at WHERE id = :id`, { replacements: { at: opened, id: ticket.id }, type: QueryTypes.UPDATE });
        for (const [role, text, h] of t.thread) {
          const m = await ChatbotTicketMessage.create({ ticketId: ticket.id, role, text, authorUserId: role === "customer" ? null : agent?.id ?? null, emailed: role === "agent" ? true : null });
          await sequelize.query(`UPDATE chatbot_ticket_messages SET "createdAt" = :at WHERE id = :id`, {
            replacements: { at: new Date(opened.getTime() + h * 3600_000), id: m.id },
            type: QueryTypes.UPDATE,
          });
        }
      }
      console.log(`${TICKETS.length} demo tickets`);

      if (await HelpFolder.count({ where: { chatbotId: bot.id } })) {
        console.log("Help center already has collections — left as is");
        return;
      }
      let articles = 0;
      for (const [fi, f] of HELP.entries()) {
        const folder = await HelpFolder.create({ chatbotId: bot.id, name: f.name, description: f.description, position: fi });
        for (const [ai, a] of f.articles.entries()) {
          await HelpArticle.create({
            chatbotId: bot.id,
            folderId: folder.id,
            title: a.title,
            content: a.content,
            status: a.draft ? "draft" : "published",
            position: ai,
            views: a.draft ? 0 : 12 + ((fi * 7 + ai * 13) % 60),
            likes: a.draft ? 0 : 2 + ((fi + ai * 3) % 9),
            dislikes: a.draft ? 0 : (fi + ai) % 3,
          });
          articles++;
        }
      }
      console.log(`${HELP.length} collections, ${articles} articles`);
    })
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
