"use client";

import { useState } from "react";
import { TbCode } from "react-icons/tb";
import {
  SiAngular, SiEmberdotjs, SiFramer, SiGoogletagmanager, SiHtml5, SiNestjs, SiNextdotjs, SiNuxtdotjs, SiReact,
  SiShopify, SiSquarespace, SiSvelte, SiVuedotjs, SiWebflow, SiWix, SiWordpress,
} from "react-icons/si";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/Admin/Settings/parts";

/**
 * Per-framework install instructions, as Saleszium's Messenger settings had.
 *
 * JavaScript frameworks install the @rhinon/chat package (with api_url, so a
 * beta bot talks to beta). Plain HTML and site builders paste the hosted
 * script tag, which reads data-app-id from itself and always serves the
 * latest release.
 */

interface Step {
  title: string;
  file?: string;
  code?: string;
}

interface Framework {
  id: string;
  label: string;
  icon: React.ReactNode;
  steps: (src: string, appId: string, apiUrl: string) => Step[];
}

const ICON = "size-4";
const INSTALL = "npm install @rhinon/chat";

const FRAMEWORKS: Framework[] = [
  {
    id: "html",
    label: "HTML",
    icon: <SiHtml5 className={ICON} />,
    steps: (src, id) => [
      { title: "Paste just before </body> on every page (or in a shared footer include).", file: "index.html", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "react",
    label: "React",
    icon: <SiReact className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Start it once, from your root component.",
        file: "src/App.tsx",
        code: `import { useEffect } from "react";
import RhinonChat from "@rhinon/chat";

export default function App() {
  useEffect(() => {
    RhinonChat({ app_id: "${id}", api_url: "${api}" });
  }, []);

  return <>{/* …your app… */}</>;
}`,
      },
    ],
  },
  {
    id: "nextjs",
    label: "Next.js",
    icon: <SiNextdotjs className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Create a client component that starts the chat in the browser.",
        file: "components/RhinonChat.tsx",
        code: `"use client";

import { useEffect } from "react";

export default function RhinonChatLoader() {
  useEffect(() => {
    // Imported here so it never runs during server rendering.
    import("@rhinon/chat").then(({ default: RhinonChat }) => {
      RhinonChat({ app_id: "${id}", api_url: "${api}" });
    });
  }, []);

  return null;
}`,
      },
      {
        title: "Render it once in the root layout (App Router) — or in pages/_app.tsx with the Pages Router.",
        file: "app/layout.tsx",
        code: `import RhinonChatLoader from "@/components/RhinonChat";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <RhinonChatLoader />
      </body>
    </html>
  );
}`,
      },
    ],
  },
  {
    id: "nuxt",
    label: "Nuxt",
    icon: <SiNuxtdotjs className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Add a client-only plugin. Nuxt loads files ending in .client automatically.",
        file: "plugins/rhinon-chat.client.ts",
        code: `import RhinonChat from "@rhinon/chat";

export default defineNuxtPlugin(() => {
  RhinonChat({ app_id: "${id}", api_url: "${api}" });
});`,
      },
    ],
  },
  {
    id: "vue",
    label: "Vue",
    icon: <SiVuedotjs className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Start it once when the root component mounts.",
        file: "src/App.vue",
        code: `<template>
  <router-view />
</template>

<script setup>
import { onMounted } from "vue";
import RhinonChat from "@rhinon/chat";

onMounted(() => {
  RhinonChat({ app_id: "${id}", api_url: "${api}" });
});
</script>`,
      },
    ],
  },
  {
    id: "angular",
    label: "Angular",
    icon: <SiAngular className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Start it from the root component, in the browser only (safe with SSR).",
        file: "src/app/app.component.ts",
        code: `import { AfterViewInit, Component, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Component({ selector: "app-root", standalone: true, template: "<router-outlet />" })
export class AppComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    import("@rhinon/chat").then(({ default: RhinonChat }) => {
      RhinonChat({ app_id: "${id}", api_url: "${api}" });
    });
  }
}`,
      },
    ],
  },
  {
    id: "svelte",
    label: "SvelteKit",
    icon: <SiSvelte className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Start it from the root layout once the page is in the browser.",
        file: "src/routes/+layout.svelte",
        code: `<script>
  import { onMount } from "svelte";

  onMount(async () => {
    const { default: RhinonChat } = await import("@rhinon/chat");
    RhinonChat({ app_id: "${id}", api_url: "${api}" });
  });
</script>

<slot />`,
      },
    ],
  },
  {
    id: "ember",
    label: "Ember",
    icon: <SiEmberdotjs className={ICON} />,
    steps: (src, id, api) => [
      { title: "Install the package.", file: "Terminal", code: INSTALL },
      {
        title: "Add an instance initializer — it never runs under FastBoot.",
        file: "app/instance-initializers/rhinon-chat.js",
        code: `export async function initialize() {
  if (typeof FastBoot !== "undefined") return;
  const { default: RhinonChat } = await import("@rhinon/chat");
  RhinonChat({ app_id: "${id}", api_url: "${api}" });
}

export default { initialize };`,
      },
    ],
  },
  {
    id: "nestjs",
    label: "NestJS",
    icon: <SiNestjs className={ICON} />,
    steps: (src, id) => [
      {
        title: "NestJS is server-side: add the tag to the HTML it serves (a static page or your view layout).",
        file: "public/index.html  ·  or views/layout.hbs",
        code: `<!-- before </body> -->
<script async src="${src}" data-app-id="${id}"></script>`,
      },
      {
        title: "Serving static files? Make sure the public folder is exposed.",
        file: "src/main.ts",
        code: `import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, "..", "public"));
  await app.listen(3000);
}
bootstrap();`,
      },
    ],
  },
  {
    id: "wordpress",
    label: "WordPress",
    icon: <SiWordpress className={ICON} />,
    steps: (src, id) => [
      { title: "Easiest: install a header/footer code plugin (e.g. WPCode), and add this to the site-wide footer." , code: `<script async src="${src}" data-app-id="${id}"></script>` },
      {
        title: "Or in your (child) theme, so it survives plugin changes.",
        file: "functions.php",
        code: `add_action('wp_footer', function () {
    echo '<script async src="${src}" data-app-id="${id}"></script>';
});`,
      },
    ],
  },
  {
    id: "shopify",
    label: "Shopify",
    icon: <SiShopify className={ICON} />,
    steps: (src, id) => [
      { title: "Online Store → Themes → ⋯ → Edit code → layout/theme.liquid. Paste before </body> and save.", file: "layout/theme.liquid", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "webflow",
    label: "Webflow",
    icon: <SiWebflow className={ICON} />,
    steps: (src, id) => [
      { title: "Site settings → Custom code → Footer code. Paste, save, then publish the site.", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "framer",
    label: "Framer",
    icon: <SiFramer className={ICON} />,
    steps: (src, id) => [
      { title: "Site settings → General → Custom code → End of <body> tag. Paste, then publish.", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "wix",
    label: "Wix",
    icon: <SiWix className={ICON} />,
    steps: (src, id) => [
      { title: "Settings → Custom code → Add custom code. Paste, choose \"All pages\", place it in Body – end, then publish.", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "squarespace",
    label: "Squarespace",
    icon: <SiSquarespace className={ICON} />,
    steps: (src, id) => [
      { title: "Settings → Advanced → Code injection → Footer. Paste and save.", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "gtm",
    label: "Tag Manager",
    icon: <SiGoogletagmanager className={ICON} />,
    steps: (src, id) => [
      {
        title: "New tag → Custom HTML → paste this → trigger \"All Pages\" → Submit/publish the container.",
        code: `<script>
  (function () {
    var s = document.createElement("script");
    s.src = "${src}";
    s.async = true;
    s.setAttribute("data-app-id", "${id}");
    document.body.appendChild(s);
  })();
</script>`,
      },
    ],
  },
];

export function InstallGuide({ src, appId, apiUrl }: { src: string; appId: string; apiUrl: string }) {
  const [selected, setSelected] = useState(FRAMEWORKS[0].id);
  const framework = FRAMEWORKS.find((f) => f.id === selected) ?? FRAMEWORKS[0];
  const steps = framework.steps(src, appId, apiUrl);

  return (
    <div data-testid="install-guide">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Your website platform">
        {FRAMEWORKS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === selected}
            data-testid={`fw-${f.id}`}
            onClick={() => setSelected(f.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              f.id === selected ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      <ol className="mt-4 flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{step.title}</p>
              {step.code && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                    <span className="inline-flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground">
                      <TbCode size={13} />
                      {step.file ?? "Snippet"}
                    </span>
                    <CopyButton text={step.code} label="Copy" testId={`copy-${framework.id}-${i}`} className="bg-card" />
                  </div>
                  <pre className="overflow-x-auto p-3 text-xs leading-relaxed"><code>{step.code}</code></pre>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">
        Script-tag installs always get the latest widget. Package installs update with <code className="font-mono">npm update @rhinon/chat</code>. Either way, the status above turns green the first time a page with it loads.
      </p>
    </div>
  );
}
