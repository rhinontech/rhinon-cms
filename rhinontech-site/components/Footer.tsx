import Link from "next/link";
import { links } from "@/components/site";
import { SOCIAL_LINKS } from "@/components/schema";
import { GROUPS, byGroup } from "@/content/products";
import { Logo } from "@/components/ui";

const COMPANY = [
  { label: "Rhinon AI", href: "/ai" },
  { label: "Integrations", href: "/integrations" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

const LINK = "block text-ink-soft transition-colors hover:text-ink";
const LABEL = "font-mono text-[11px] uppercase tracking-[0.2em] text-muted";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-white text-ink">
      <div aria-hidden className="lt-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2.2fr]">
          <div>
            <Logo height={44} />
            <p className="font-display mt-8 max-w-[400px] text-[34px] font-semibold leading-[1.08]">
              The business software that <span className="text-aurora">just makes sense.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={links.signup} className="btn btn-primary">Get started free</a>
              <a href={links.login} className="btn btn-soft">Log in</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[14.5px] sm:grid-cols-4">
            {GROUPS.map((g) => (
              <div key={g.name} className="space-y-3">
                <p className={LABEL}>{g.name}</p>
                {byGroup(g.name).map((p) => (
                  <Link key={p.slug} href={`/product/${p.slug}`} className={LINK}>{p.name}</Link>
                ))}
              </div>
            ))}
            <div className="space-y-3">
              <p className={LABEL}>Company</p>
              {COMPANY.map((c) => (
                <Link key={c.href} href={c.href} className={LINK}>{c.label}</Link>
              ))}
              <a href={links.labs} className={LINK}>Rhinon Labs</a>
              <Link href="/demo" className={LINK}>Book a demo</Link>
              <Link href="/contact" className={LINK}>Contact</Link>
              <Link href={links.privacy} className={LINK}>Privacy & terms</Link>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:items-center">
          <span>{`© ${year} Rhinon Labs. All rights reserved.`}</span>
          <div className="flex flex-wrap items-center gap-5">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ink"
              >
                {s.label}
              </a>
            ))}
            <span aria-hidden className="text-line">|</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
