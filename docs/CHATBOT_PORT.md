# Chatbot port: Saleszium → rhinon-cms

Bring Saleszium's AI chatbot (website widget, training, AI answers, live human chat, forms, tickets, help center, campaigns, integrations) into the org-based admin. The source is the gitignored copy at `saleszium_app/`.

## Decisions

| Topic | Decision |
|---|---|
| Unit | One bot per **brand (Site)**. How many brands may run a bot is a plan limit (`config/plans.ts`). The platform workspace is unlimited. |
| AI runtime | Ported to TypeScript inside `rhinontech/backend`. **No Python service.** A second always-on process risks running out of memory on a t2.micro (1 GB). |
| Answer model | Gemini 2.5 Flash, the same as Saleszium's `/gcs/standard/chat` and our existing `services/gemini.ts`. |
| Embeddings | Gemini embeddings (768 dimensions) into pgvector, so we use one AI provider instead of Saleszium's OpenAI + Gemini mix. Nothing is migrated, so there's nothing to re-embed. |
| Widget | `saleszium_app/bot-sdk` moves to `rhinon-cms/bot-sdk` mostly as-is. Our backend serves its endpoint paths under `/widget/*`, so most of its code is untouched. |
| Out of scope | Gemini Live voice and SEO tracking (`/seo/*`). Agent→visitor **WebRTC calls** were added later (2026-10-23): signaling in `services/chatbot/callSignaling.ts`, TURN via coturn on the API host. |
| Usage | Bot replies get their own daily allowance per plan. They do not draw from `aiPerDay`, which allows only 20 a day on free. |

## What Saleszium had, and where it lands

| Saleszium | Here |
|---|---|
| `chatbots` (one per org, `chatbot_config` JSON) | `chatbots`: tenant + site scoped, public 6-character `publicId`, `config` JSON, `forms` JSON |
| `automations.training_url/pdf/article` JSON arrays | `chatbot_sources`: one row per source, with its own status, error and chunk count |
| `training_chunks` (pgvector 1536, OpenAI) | `chatbot_chunks`: pgvector 768 with an `organizationId` column, created by raw SQL at boot |
| `bot_conversations` + `support_conversations` (two copies of one chat) | `chat_conversations` (mode `bot` or `human`) + `chat_messages`, a single record of the chat |
| `live_visitors` | in-memory presence plus `chat_conversations.lastSeenAt`; no table churn on a t2.micro |
| `forms` (pre-chat, post-chat, ticket) | `chatbots.forms` JSON |
| `customers` + `rhinontech_crm` pipeline push | **our** `Lead` (CRM), created on pre-chat submit or hand-off |
| `tickets` | `chatbot_tickets` + `chatbot_ticket_messages` (customer / agent / internal note); 8-character public `code`; agent replies are emailed from the brand address or the agent's own connected mailbox |
| `folders` + `articles` (help center) | `help_folders` + `help_articles` (draft/published, sanitised HTML, views/likes/dislikes) |
| `chatbot_campaigns` | `chatbot_campaigns` (content + targeting in the widget's own shapes, cleaned by `services/chatbot/campaigns.ts`) |
| Settings → Accounts (Google, Microsoft/Outlook, LinkedIn) + WhatsApp | phase 4: "Saleszium-style" integrations hub |

## Security fixes (do not port these as-is)

- **Socket.IO had no auth.** Anyone with a public `chatbot_id` could join `dashboard:<id>` and read every visitor's messages. Agent sockets must present our JWT, and rooms are keyed by organization and conversation. Visitors only ever join their own conversation room.
- **Org-wide events were broadcast to every socket** (`io.emit("training:progress:<org>")`). Emit to the org room only.
- **`/aws/presigned-url?key=`** signed any key in the bucket. Only sign keys under the conversation's own upload prefix.
- **`/chatbot/customer-phone`** looked visitors up by email with no bot ID, across tenants. The widget must send `chatbot_id` (a small widget change).
- **`/conversations/delete-chats/:id`, `/articles/:id` DELETE and the training webhook** had no auth. Training runs in-process here, so there's no webhook at all.
- Public endpoints are rate-limited per IP, the same as `/collect`.

## Widget → backend contract (`/widget/*`)

| Widget call | Purpose | Phase |
|---|---|---|
| `GET /chatbot/chatbot?chatbot_id` | config + plan + installed flag | 1 |
| `POST /chatbot/set-installed?chatbot_id` | marks the snippet as live | 1 |
| `GET /forms/chatbot-forms?chatbot_id` | pre-chat, post-chat and ticket forms | 1 |
| `POST /forms/save-prechat-forms-values` | visitor details → CRM lead | 1 |
| `POST /gcs/standard/chat` | SSE stream: `thread_created`, `token`, `end`, `error` | 1 |
| `POST /chat_history`, `POST /conversation_by_user_id` | visitor's past chats | 1 |
| `GET /conversations/socketConversation`, `POST …/close`, `POST /conversations/submit-review` | live chat + post-chat rating | 1 |
| socket `join_conversation`, `message`, `conversation:closed`, `open_chat` | live chat | 1 |
| `POST /aws/fileUploadForConversation`, `GET /aws/presigned-url` | attachments (scoped) | 1 |
| `GET /chatbot/whatsapp-config`, `GET/POST /chatbot/customer-phone` | WhatsApp hand-off | 4 |
| `/tickets/*` | tickets from the widget | 2 |
| `/folders/chatbot-structure`, `/articles/*` | help center | 2 |
| `/campaigns/chatbot/all` | pop-up campaigns | 3 |
| `/standard/set_user_assistant` | old re-train trigger: becomes a no-op | 1 |
| `users_accounts` (Google/Microsoft tokens, exchanged in the browser) | `connected_accounts`: per person, OAuth done server-side, tokens encrypted (`services/connectedAccounts.ts`) |
| `/seo/*`, `/gcs/realtime/*` | **removed** |

## Admin (new "Chatbot" module, per brand, like Inbox/CRM)

1. **Overview & install**: snippet, installed status, plan usage
2. **Training**: websites (with sitemap discovery), files (PDF/DOCX/PPTX/TXT), articles, per-source status, live progress
3. **Live chats**: conversation list, transcript, take over from the bot, close, visitor info sidebar
4. **Appearance**: colors, logos, greeting, background, with a live preview using the widget itself
5. **Forms**: pre-chat, post-chat and ticket
6. **Tickets**: inbox, reply by email or internal note, status, priority, assignee, tags
7. **Help center**: collections and articles with a rich-text editor
8. **Campaigns**: template picker, editor with live card preview, targeting, schedule, stats
9. **Settings → Accounts** (workspace settings, per person): Google and Microsoft mailboxes, LinkedIn

## Status

All phases shipped and are on `main` and prod (`7b747fb`, 2026-10-23).

1. **Core** (2026-10-22): pgvector, models, plan limits, `/widget` core endpoints, authenticated Socket.IO, training pipeline, RAG chat with lead capture and hand-off, admin screens, widget moved and rebranded as `@rhinon/chat`.
2. **Live visitors + redesign**: IP geolocation and map, the new widget look (`bot-sdk/src/styles/redesign.scss`), full Saleszium appearance parity (secondary colour, default images, crop, preview page switching, launcher icon in the original launcher shape).
3. **Campaigns** (phase 4 in the original plan).
4. **Tickets + help center** (phase 5). Run `src/scripts/migrateInterimTickets.ts` (dry run, then `--apply`) wherever widget tickets were raised before it; prod had none on 2026-10-23.
5. **Accounts** (phase 6): Google and Microsoft. WhatsApp is deferred. Each OAuth app must list `${PUBLIC_API_URL}/integrations/accounts/<provider>/callback`. Credentials: `MAIL_GOOGLE_CLIENT_ID/SECRET` and `MICROSOFT_CLIENT_ID/SECRET` (for now the Saleszium apps).
6. **WebRTC calls** (2026-10-23, outside the original plan).

- Releasing the widget: `cd bot-sdk && npm run release`, commit `rhinontech/backend/public/widget/rhinon-chat.js` and `.gz`, deploy the backend. One build serves every environment: it finds its backend from its own script URL; npm users pass `api_url`.
- Demo data: `src/scripts/seedChatbotDemo.ts <publicId>` (chats) and `src/scripts/seedSupportDemo.ts <publicId>` (tickets + help). Both are rerunnable and touch only rows they tagged.

## Open items

- TURN credentials are static and shipped in the public widget (`iceConfig.ts`). Replace them with short-lived credentials minted by the backend (coturn `use-auth-secret`), then rotate the password.
- Ticket emails go out, but replies to them don't come back into the ticket (no inbound routing yet).
- Where the built widget is served from (backend static route vs S3/CloudFront). Backend static is enough while traffic is low.
