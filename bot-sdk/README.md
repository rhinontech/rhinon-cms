# @rhinon/chat

The Rhinon website chat: an AI assistant trained on your own website and documents, that captures leads and hands visitors to your team for live chat.

You get your **app id** (and the install code for your stack, filled in) in **Rhinon → Chatbot → Overview**.

## Install

### Script tag (any website)

One line before `</body>`. Always serves the latest version.

```html
<script async src="https://api.rhinontech.in/widget/rhinon-chat.js" data-app-id="YOUR_APP_ID"></script>
```

### npm

```bash
npm install @rhinon/chat
```

```js
import RhinonChat from "@rhinon/chat";

RhinonChat({ app_id: "YOUR_APP_ID" });
```

Call it once, in the browser (not during server rendering). Examples:

**React**

```jsx
import { useEffect } from "react";
import RhinonChat from "@rhinon/chat";

export default function App() {
  useEffect(() => {
    RhinonChat({ app_id: "YOUR_APP_ID" });
  }, []);
  return null;
}
```

**Next.js** (client component, rendered once in `app/layout.tsx`)

```tsx
"use client";
import { useEffect } from "react";

export default function RhinonChatLoader() {
  useEffect(() => {
    import("@rhinon/chat").then(({ default: RhinonChat }) => RhinonChat({ app_id: "YOUR_APP_ID" }));
  }, []);
  return null;
}
```

**Vue**

```vue
<script setup>
import { onMounted } from "vue";
import RhinonChat from "@rhinon/chat";
onMounted(() => RhinonChat({ app_id: "YOUR_APP_ID" }));
</script>
```

Nuxt, Angular, SvelteKit, Ember, NestJS, WordPress, Shopify, Webflow, Framer, Wix, Squarespace and Google Tag Manager: see the install guide in the Rhinon admin.

## Options

| Option | Type | Description |
|---|---|---|
| `app_id` | `string` | **Required.** Your bot's id. |
| `api_url` | `string` | Backend for the bot. Defaults to `https://api.rhinontech.in/widget`. The admin's install guide fills it in for you. |
| `container` | `HTMLElement` | Mount inside this element instead of `document.body`. |

Appearance, greeting, forms and training are managed in the Rhinon admin. Changes reach your site on the next page load, with no code change.

## Upgrading from `@rhinon/botsdk`

`@rhinon/chat` replaces `@rhinon/botsdk`. Swap the package; existing code keeps working:

```bash
npm uninstall @rhinon/botsdk && npm install @rhinon/chat
```

```js
import Rhinontech from "@rhinon/chat"; // default export, same call
import { initRhinontech } from "@rhinon/chat"; // old name, still exported
```

Types: `RhinonChatConfig` (also exported as `RhinontechConfig`).

## License

MIT
