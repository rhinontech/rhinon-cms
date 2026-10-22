/**
 * Moves the interim tickets (widget tickets stored as `ticket:<email>`
 * conversations, before the Tickets module existed) into chatbot_tickets.
 *
 *   npx ts-node --transpile-only src/scripts/migrateInterimTickets.ts [--apply]
 *
 * Dry run by default. Each conversation becomes one ticket with its messages;
 * the conversation is tagged meta.migratedToTicket and closed, never deleted,
 * so a rerun skips it. Writes to whatever DATABASE_URL points at.
 */
import { Op } from "sequelize";
import { sequelize } from "../config/database";
import "../models";
import { Chatbot } from "../models/Chatbot";
import { ChatConversation } from "../models/ChatConversation";
import { ChatMessage } from "../models/ChatMessage";
import { ChatbotTicket } from "../models/ChatbotTicket";
import { ChatbotTicketMessage } from "../models/ChatbotTicketMessage";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { runForSite } from "../services/siteContext";
import { newTicketCode } from "../services/chatbot/support";

const apply = process.argv.includes("--apply");

async function main() {
  const convs = await runAsSystem("tickets:find", () =>
    ChatConversation.unscoped().findAll({ where: { visitorId: { [Op.like]: "ticket:%" } }, order: [["createdAt", "ASC"]] })
  );
  const pending = convs.filter((c) => !(c.meta as any)?.migratedToTicket);
  console.log(`${convs.length} interim ticket conversation(s), ${pending.length} to migrate${apply ? "" : " (dry run — pass --apply)"}`);

  for (const conv of pending) {
    const orgId = (conv as any).organizationId as string;
    const bot = await runAsSystem("tickets:bot", () => Chatbot.unscoped().findByPk(conv.chatbotId));
    if (!bot) {
      console.log(`  skip ${conv.id}: bot gone`);
      continue;
    }
    const email = conv.visitorId.slice("ticket:".length);
    const subject = (conv.title || (conv.meta as any)?.subject || "Ticket").slice(0, 200);
    console.log(`  ${conv.publicKey.slice(0, 8)} → ${email} · ${subject}`);
    if (!apply) continue;

    await runForOrg(orgId, () =>
      runForSite(bot.siteId ? { id: bot.siteId, slug: "" } : null, true, async () => {
        const messages = await ChatMessage.findAll({ where: { conversationId: conv.id }, order: [["createdAt", "ASC"]] });
        const rating = Number((conv.review as any)?.rating) || null;
        const ticket = await ChatbotTicket.create({
          chatbotId: bot.id,
          code: await newTicketCode(),
          subject,
          customerEmail: email,
          customData: {},
          status: conv.status === "closed" ? "resolved" : "open",
          assignedUserId: conv.assignedUserId ?? null,
          rating: rating && rating >= 1 && rating <= 5 ? rating : null,
          leadId: conv.leadId ?? null,
          isNew: conv.status !== "closed",
          lastActivityAt: conv.lastMessageAt ?? conv.createdAt,
        });
        for (const m of messages) {
          const row = await ChatbotTicketMessage.create({
            ticketId: ticket.id,
            role: m.role === "user" ? "customer" : "agent",
            authorUserId: m.agentUserId ?? null,
            text: m.text || "",
          });
          await sequelize.query(`UPDATE chatbot_ticket_messages SET "createdAt" = :at WHERE id = :id`, { replacements: { at: m.createdAt, id: row.id } });
        }
        await sequelize.query(`UPDATE chatbot_tickets SET "createdAt" = :at WHERE id = :id`, { replacements: { at: conv.createdAt, id: ticket.id } });
        await conv.update({ status: "closed", meta: { ...(conv.meta ?? {}), migratedToTicket: ticket.id } });
      })
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
