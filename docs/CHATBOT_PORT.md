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
| Out of scope | Voice (Gemini Live, WebRTC calls) and SEO tracking (`/seo/*`). Both are switched off in the widget. |
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
| `tickets` | phase 2, likely reusing `InboxConversation` (already has status and priority) |
| `folders` + `articles` (help center) | phase 2 |
| `chatbot_campaigns` | phase 3 |
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
| `/seo/*`, `/gcs/realtime/*` | **removed** | — |

## Admin (new "Chatbot" module, per brand, like Inbox/CRM)

1. **Overview & install**: snippet, installed status, plan usage
2. **Training**: websites (with sitemap discovery), files (PDF/DOCX/PPTX/TXT), articles, per-source status, live progress
3. **Live chats**: conversation list, transcript, take over from the bot, close, visitor info sidebar
4. **Appearance**: colors, logos, greeting, background, with a live preview using the widget itself
5. **Forms**: pre-chat, post-chat and ticket
6. Later: Tickets, Help center, Campaigns, Integrations

## Status

- **Phase 1 — done (2026-10-22), on `beta`.** Backend (`routes/widget.ts`, `routes/chatbots.ts`, `services/chatbot/*`), admin module (`components/Admin/Chatbot`), widget at `/bot-sdk`. Verified locally: 31-check API/socket e2e, real widget on a foreign origin, every admin screen.
- Interim: widget tickets land in Live chats as `meta.ticket` conversations until phase 2.
- Releasing the widget: `cd bot-sdk && npm run release`, commit `rhinontech/backend/public/widget/rhinonbot.js`, deploy the backend. One build serves prod, beta and local: it finds its backend from its own script URL.

## Phases

1. **Core**: pgvector, models, plan limits, `/widget` core endpoints, authenticated Socket.IO, training pipeline (rate-limited fetch and parse), RAG chat with lead capture and hand-off tools, the admin screens above, widget moved and rebranded (Saleszium URLs and assets), built and served from the backend.
2. Tickets + help center
3. Chatbot campaigns
4. Integrations (Google, Microsoft, LinkedIn accounts; WhatsApp)

## Open items

- Widget branding: the widget code hard-codes `saleszium.com` assets (for example the notification sound) and the `Saleszium(...)` global. Rename to Rhinon and self-host the assets.
- Where the built widget is served from (backend static route vs S3/CloudFront). Backend static is enough while traffic is low.
- Deploy: nginx must allow WebSocket upgrade on the API host for Socket.IO.
