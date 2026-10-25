# Platform cleanup — to-do

Collected on 2026-10-23 from a sweep of the backend, admin panel and widget, plus
loose ends left over from the Hyderabad move and the email-identity work. Each item
says **why** it matters, **where** the code is, and **when it's done**. Pick items in
section order: real bugs first, then dead code, then merging split features, then
refactors.

Paths are relative to the repo root.

---

## 0. Loose ends from 2026-10-23 (do first, mostly clicks)

- [x] **Delete the old Mumbai setup.** *(Done 2026-10-23: server, disk, RDS, its firewall, the manual RDS snapshots and the Mumbai key pair deleted; the two automated RDS backups expire on their own.)* Everything is stopped (not deleted) and still
  costs ~$5/month in storage. **RDS starts itself again 7 days after a stop.**
  - EC2 `i-00e5504f742b5c0c9` (t2.micro) and its volume `vol-07a4efa033e3250fc`
  - RDS `rhinontech-db` and snapshot `rhinontech-db-final-2026-10-23`
  - Security group `rhinontech-rds-sg` (`sg-02123090a86d15281`)
  - Done when: none of these appear in the ap-south-1 console. All data is already in
    the new server's Postgres and in `s3://rhinontech-assets/db-backups/`.
- [ ] **Allow calendar access on the OAuth apps** (needed for Meetings on Google/Outlook):
  - Google project `897192716876-…` → OAuth consent screen → Data access → add
    `https://www.googleapis.com/auth/calendar.events`; enable the Google Calendar API.
  - Azure app `bfe1061a-…` → API permissions → Microsoft Graph → Delegated →
    `Calendars.ReadWrite`.
  - Register the callback URLs if not done:
    `https://api.rhinontech.in/integrations/accounts/google/callback` and
    `…/microsoft/callback`.
  - Done when: connecting Google/Microsoft in Settings → Accounts shows no
    "Reconnect for calendar" warning.
- [ ] **Add `MAIL_GOOGLE_CLIENT_ID/SECRET` and `MICROSOFT_CLIENT_ID/SECRET` to the server
  `.env`** (`~/rhinon-cms/rhinontech/backend/.env`), then `pm2 restart rhinontech-backend --update-env`.
  Today Settings → Accounts on prod shows Google/Microsoft as "Not set up".
- [ ] **Remove the leftover npm tag**: `npm dist-tag rm @rhinon/chat ci-check`
  (approve in the browser when asked).
- [ ] **Fix the npm account email**: npmjs.com → Account → change
  `prabhat@rhinontech.com` (dead domain, no mail) to `prabhat@rhinontech.in`.
- [ ] **Check whether the TURN server was abused** while it was an open relay
  (2026-10-23, ~13:40–17:22 IST). Compare outbound traffic for those hours in
  CloudWatch → EC2 `i-0c3af5118d9f4bacb` → NetworkOut against a normal day.
- [ ] **Delete `/etc/turnserver.conf.old` on the server** once calls are confirmed
  working (it holds the old static TURN password; root-only today).
- [ ] **Rotate the npm token** if the current one was created without the IP range
  `16.112.50.215/32` (it was pasted into a chat).
- [ ] **Local `.env` points at the prod database.** Swap the two `DATABASE_URL` lines in
  `rhinontech/backend/.env` so day-to-day work uses `rhinontech-beta`.

---

## 1. Real problems (bugs / broken UI)

- [ ] **Voice calls end when you leave the Chatbot section.**
  `CallProvider` and `GlobalCallWidget` are mounted in
  `rhinontech/admin-panel/app/[role]/chatbot/layout.tsx`, so navigating to Inbox or CRM
  unmounts them and drops the call.
  - Move both into the app-wide role layout (`app/[role]/layout.tsx` or the dashboard
    shell) so a call survives navigation.
  - Keep `CallContext.tsx` / `GlobalCallWidget.tsx` where they are or move them to
    `components/Admin/Calls/`.
  - Done when: start a call, open Inbox, then CRM — audio and the floating call card stay.
- [ ] **Deploy screen shows targets that can't work.**
  `rhinontech/backend/src/config/deployTargets.ts`
  - Remove `furrcircle` (containers stopped, image not ARM-checked) and `beta`
    (process stopped; all work is on `main`).
  - `widget`: npm has staged publishing on `@rhinon/chat`, so a direct publish always
    fails (404/403). Either remove the target, or change
    `rhinontech/backend/scripts/deploy-widget.sh` to stage the release and show
    "Staged — approve on npmjs.com" with a link.
  - Done when: every card on Settings → Deploy succeeds when pressed.

---

## 2. Dead code (safe deletes, ~2,300 lines)

- [ ] `rhinontech/backend/src/services/inboundRecipient.ts` — older copy of
  `inboundRouting.ts`; imported nowhere.
- [ ] Widget voice screen (voice was disabled; real calls use `components/Call/CallPanel.tsx`):
  - `bot-sdk/src/screens/VoiceScreen/` (incl. `openai.Voice.tsx`, 509 lines)
  - `bot-sdk/src/hooks/useWebRTC.ts` and its export in `bot-sdk/src/hooks/index.ts`
  - `LazyVoiceScreen` in `bot-sdk/src/screens/lazy.ts`, `VoiceScreen` export in
    `bot-sdk/src/screens/index.ts`, `VoiceScreenProps` in `bot-sdk/src/types/screen.types.ts`
  - The `'voice'` member of `ActiveScreen` (`bot-sdk/src/types/chat.types.ts`) and the
    `'voice'` branch in `bot-sdk/src/components/Messenger/BottomNav.tsx`
  - The `Voice` lazy import and the "filter out Voice" nav logic in
    `bot-sdk/src/Messenger/Messenger.tsx`
- [ ] **375 commented-out lines** in `bot-sdk/src/screens/ChatScreen/ChatScreen.tsx`
  (an old copy of the call code).
- [ ] Done when: `npx tsc --noEmit` passes in `bot-sdk` and `rhinontech/backend`, the
  widget rebuilds (`npm run release`), and the chat, help and call screens still work.

---

## 3. Same feature in two places (consolidate)

- [ ] **One Google OAuth app instead of two.**
  The workspace calendar uses `GOOGLE_CLIENT_ID` (`services/googleCalendar.ts`);
  Settings → Accounts uses `MAIL_GOOGLE_CLIENT_ID` (`services/connectedAccounts.ts`).
  Pick one app, add both redirect URIs to it, and read a single pair of env vars.
  Existing workspace-calendar connections need one reconnect.
- [ ] **One Accounts page for every connection.**
  - Fold Settings → Workspace calendar
    (`rhinontech/admin-panel/components/Admin/Settings/GoogleCalendarSettings.tsx`) into
    Settings → Accounts as an admin-only "Workspace calendar" card; remove the nav item
    in `components/Admin/Common/SettingsSubNav/SettingsSubNav.tsx`.
  - LinkedIn is connected from Outreach → Publishing (`LinkedInConnectCard.tsx`) and
    also shown in Accounts. Keep it in Accounts only; Publishing links there.
- [ ] **Interviews and public booking on personal calendars.**
  `routes/hiring.ts` and `routes/scheduleCall.ts` still use the shared workspace
  calendar. Route them through `services/meetingCalendar.ts` (`calendarFor(userId)`)
  — the recruiter's calendar for interviews; a chosen "booking owner" for the public page.
- [ ] **Every email through one identity function.**
  Inbox, Campaigns and Tickets use `services/emailIdentity.ts` (`sendAs`). These still
  pick a sender on their own: `services/workflowEngine.ts` (Automation),
  `routes/hiring.ts`, `services/eventEmail.ts`, `routes/payroll.ts`,
  `routes/documentSigning.ts`, `services/meetingInvite.ts`, plus account mail
  (`routes/auth.ts`, `services/emailVerification.ts`, `services/workspaceLifecycle.ts`).
  - Move the user-facing ones (Automation, hiring, events) onto `sendAs` with their
    own module key, and add them to Settings → Accounts → "Use for".
  - System mail (verification, password reset, payroll) stays on the platform address
    but should go through one `sendSystemEmail()` so the sender rule lives in one place.
- [ ] **Confusing template module names.**
  `services/emailTemplate.ts` (the branded HTML wrapper for campaigns/workflows) and
  `services/emailTemplates.ts` (account-email branding). Rename to e.g.
  `emailLayout.ts` and `accountEmails.ts`; update imports.

---

## 4. Split oversized files (no behaviour change)

Large files make every change riskier. Split by responsibility; keep exports stable.

- [ ] `rhinontech/admin-panel/components/Admin/People/PeopleDirectory.tsx` — 1,887 lines.
  Split list, filters, profile drawer and dialogs into separate components.
- [ ] `bot-sdk/src/Messenger/Messenger.tsx` — 1,162 lines. Move the call logic
  (sockets, peer connection, ringtone, timer) into a `useVoiceCall` hook next to
  `components/Call/CallPanel.tsx`.
- [ ] `bot-sdk/src/screens/ChatScreen/ChatComponents.tsx` — 1,530 lines; and
  `useChatLogic.tsx` — 994 lines.
- [ ] `rhinontech/backend/src/routes/campaigns.ts` — 1,084 lines. Move the sending
  engine (`dispatchLeadEmail`, `runEmailSend`, the cron loop) into
  `services/campaignSender.ts`; the route file keeps HTTP handlers only.
- [ ] `rhinontech/backend/src/routes/public.ts` — 1,041 lines. Split by area
  (lead capture, tracking, content).
- [ ] Also worth a look: `routes/leads.ts` (933), `routes/chatbots.ts` (835),
  `routes/payroll.ts` (804), `routes/eventOperations.ts` (796),
  `services/workflowEngine.ts` (787).

---

## 5. Repo clutter

- [ ] `rhinon/` — legacy app ("superseded, do not develop" per AGENTS.md), 1.1 GB on
  disk. Archive it to its own repo or a tag, then remove the folder.
- [ ] `saleszium_app/` — reference copy for the chatbot port (gitignored). Move it
  outside the repo folder once nothing else needs porting.
- [ ] `docs/CHATBOT_PORT.md` — mark integrations (Google/Microsoft accounts, calls,
  tickets, help center) as done and move the remaining open items here.

---

## Notes

- The production server is `i-0c3af5118d9f4bacb` (t4g.medium, Hyderabad,
  `16.112.50.215`). SSH: `ssh -i ~/.ssh/rhinontech.pem ubuntu@16.112.50.215`.
- All work happens on `main`; deploy the backend from Settings → Deploy → Production,
  the admin deploys itself on Vercel.
