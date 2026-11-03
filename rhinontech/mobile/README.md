# Rhinon Mobile

The Rhinon CMS admin panel's essentials as a native app: Expo SDK 58, Expo Router, NativeWind v4.
It uses the same backend as `rhinontech/admin-panel`, and its design tokens match the panel's.

| Tab | What it does | Backend | Permission |
|-----|--------------|---------|------------|
| Home | Greeting, today's attendance, unread badges, team/CRM stats, tasks, celebrations, new joiners | `GET /dashboard/stats`, `/inbox/counts`, `/team-chat/unread` | — |
| Inbox | Folders (Inbox / Starred / Sent / Archive), search, thread view, reply, star / archive / trash | `/inbox` | `inbox:read`, `inbox:write` |
| Chat | Conversations (DMs, channels, groups), unread filter, message thread, send | `/team-chat` | `chat:read`, `chat:write` |
| CRM | Pipeline board by stage, leads list with status filters and search, lead detail | `/deals/board`, `/leads` | `crm:read` or `outreach:read` |
| Settings | Profile, light / dark / system theme, workspace, 2-step status, sign out | `/auth/me`, `/auth/2fa/status` | — |

A tab the user has no permission for is hidden. The API still enforces every permission.

## Run it

```bash
cd rhinontech/mobile
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL
npx expo start            # then press i / a, or scan with Expo Go / a dev build
```

On a real phone, `localhost` is the phone itself. In development, point `EXPO_PUBLIC_API_URL` at your
machine's LAN IP, for example `http://192.168.0.2:5000`.

Checks: `npm run typecheck`, `npx expo export --platform android`.

## Layout

```
src/
  app/                    Expo Router routes (every file is a screen)
    _layout.tsx           fonts, providers, auth gate (Stack.Protected)
    login.tsx             email + password, then TOTP if the account has 2FA
    (app)/(tabs)/         Home, Inbox, Chat, CRM, Settings + floating tab bar
    (app)/inbox/[id].tsx  email thread + reply
    (app)/chat/[id].tsx   conversation
    (app)/crm/lead/[id].tsx
  components/ui/          Text, Card, Button, Input, Avatar, Badge, Segmented, Chips, states…
  lib/                    api client, auth, theme, formatting, types
  global.css              design tokens (light + dark)
```

## Decisions worth knowing

- **Token in the keychain.** The JWT is stored with `expo-secure-store`, not AsyncStorage. A 401 signs the user out.
- **Email is shown as plain text.** Inbound mail HTML comes from outside senders, so it is converted to text rather
  than rendered in a WebView. Replies are escaped and sent as minimal HTML.
- **Collaborators are refused.** Guest accounts belong in the web portal, so sign-in rejects them with a message.
- **Polling, not sockets (for now).** Chat polls every 4 s while a conversation is open, the chat list every 10 s,
  and the inbox every 45 s. Moving to Socket.IO (as the web chat does) is the natural next step.
- **Theme.** `darkMode: "class"` lets Settings override the device theme. Colors are RGB channels of the admin
  panel's oklch tokens, and `src/lib/theme.ts` has hex copies for icons and other non-className props.
- **`.npmrc` has `legacy-peer-deps=true`.** expo-router's web deps pull a `react-dom` that wants a newer React
  patch than SDK 58 pins.

## Not in this first cut

Push notifications, attachments (upload or download), composing new emails, editing leads and deals, chat threads
and reactions (shown, not editable), app icons and splash artwork (Expo defaults are still in `assets/`), and EAS
build config.
