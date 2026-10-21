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
 * Saleszium's versions installed an npm package; ours all load the one hosted
 * script, so a widget release reaches every site without anyone redeploying.
 * The widget reads data-app-id from its own tag, so every variant is just
 * "get that tag onto every page, client side".
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
  steps: (src: string, appId: string) => Step[];
}

const ICON = "size-4";

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
    steps: (src, id) => [
      {
        title: "Create a component that adds the script once.",
        file: "src/components/Chatbot.tsx",
        code: `import { useEffect } from "react";

export default function Chatbot() {
  useEffect(() => {
    if (document.querySelector('script[data-app-id="${id}"]')) return;
    const script = document.createElement("script");
    script.src = "${src}";
    script.async = true;
    script.dataset.appId = "${id}";
    document.body.appendChild(script);
  }, []);

  return null;
}`,
      },
      {
        title: "Render it once, in your root component.",
        file: "src/App.tsx",
        code: `import Chatbot from "./components/Chatbot";

export default function App() {
  return (
    <>
      {/* …your app… */}
      <Chatbot />
    </>
  );
}`,
      },
    ],
  },
  {
    id: "nextjs",
    label: "Next.js",
    icon: <SiNextdotjs className={ICON} />,
    steps: (src, id) => [
      {
        title: "App Router: add it to the root layout with next/script.",
        file: "app/layout.tsx",
        code: `import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="${src}" data-app-id="${id}" strategy="afterInteractive" />
      </body>
    </html>
  );
}`,
      },
      {
        title: "Pages Router instead? Put the same tag in _app.",
        file: "pages/_app.tsx",
        code: `import Script from "next/script";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Script src="${src}" data-app-id="${id}" strategy="afterInteractive" />
    </>
  );
}`,
      },
    ],
  },
  {
    id: "nuxt",
    label: "Nuxt",
    icon: <SiNuxtdotjs className={ICON} />,
    steps: (src, id) => [
      {
        title: "Add it to every page from the Nuxt config.",
        file: "nuxt.config.ts",
        code: `export default defineNuxtConfig({
  app: {
    head: {
      script: [
        { src: "${src}", async: true, "data-app-id": "${id}", tagPosition: "bodyClose" },
      ],
    },
  },
});`,
      },
    ],
  },
  {
    id: "vue",
    label: "Vue",
    icon: <SiVuedotjs className={ICON} />,
    steps: (src, id) => [
      {
        title: "Load it once when the root component mounts.",
        file: "src/App.vue",
        code: `<template>
  <router-view />
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  if (document.querySelector('script[data-app-id="${id}"]')) return;
  const script = document.createElement("script");
  script.src = "${src}";
  script.async = true;
  script.dataset.appId = "${id}";
  document.body.appendChild(script);
});
</script>`,
      },
      { title: "Or, simpler: paste the tag before </body> in index.html.", file: "index.html", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "angular",
    label: "Angular",
    icon: <SiAngular className={ICON} />,
    steps: (src, id) => [
      { title: "Paste the tag before </body> — it runs in the browser only, so SSR is unaffected.", file: "src/index.html", code: `<script async src="${src}" data-app-id="${id}"></script>` },
      {
        title: "Prefer code? Load it from the root component, browser-side only.",
        file: "src/app/app.component.ts",
        code: `import { AfterViewInit, Component, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Component({ selector: "app-root", standalone: true, template: "<router-outlet />" })
export class AppComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.querySelector('script[data-app-id="${id}"]')) return;
    const script = document.createElement("script");
    script.src = "${src}";
    script.async = true;
    script.dataset["appId"] = "${id}";
    document.body.appendChild(script);
  }
}`,
      },
    ],
  },
  {
    id: "svelte",
    label: "SvelteKit",
    icon: <SiSvelte className={ICON} />,
    steps: (src, id) => [
      { title: "Paste the tag inside <body> of the app shell.", file: "src/app.html", code: `<script async src="${src}" data-app-id="${id}"></script>` },
    ],
  },
  {
    id: "ember",
    label: "Ember",
    icon: <SiEmberdotjs className={ICON} />,
    steps: (src, id) => [
      { title: "Paste the tag before </body>. FastBoot never runs it on the server.", file: "app/index.html", code: `<script async src="${src}" data-app-id="${id}"></script>` },
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

export function InstallGuide({ src, appId }: { src: string; appId: string }) {
  const [selected, setSelected] = useState(FRAMEWORKS[0].id);
  const framework = FRAMEWORKS.find((f) => f.id === selected) ?? FRAMEWORKS[0];
  const steps = framework.steps(src, appId);

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
        Every option loads the same script, so updates to the bot reach your site without you changing anything. The status above turns green the first time a page with it loads.
      </p>
    </div>
  );
}
