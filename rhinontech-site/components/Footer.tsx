import Link from "next/link";
import { links } from "@/components/site";
import { GROUPS, byGroup } from "@/content/products";
import { Logo } from "@/components/ui";

const COMPANY = [
  { label: "Rhinon AI", href: "/ai" },
  { label: "Integrations", href: "/integrations" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-night text-white">
      <div aria-hidden className="grid-lines-dark absolute inset-0 opacity-60" />
      <span aria-hidden className="blob -left-20 top-0 h-[420px] w-[420px]" style={{ background: "#2f5bff", opacity: 0.25 }} />
      <span aria-hidden className="blob -right-20 bottom-0 h-[420px] w-[420px] [animation-delay:-10s]" style={{ background: "#ff5fb0", opacity: 0.18 }} />
      <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2.2fr]">
          <div>
            <Logo light height={44} />
            <p className="font-display mt-8 max-w-[380px] text-[32px] font-semibold leading-[1.1]">
              The business software that <span className="text-aurora-soft">just makes sense.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={links.signup} className="btn btn-primary">Get started free</a>
              <a href={links.login} className="btn btn-glass">Log in</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[14.5px] sm:grid-cols-4">
            {GROUPS.map((g) => (
              <div key={g.name} className="space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">{g.name}</p>
                {byGroup(g.name).map((p) => (
                  <Link key={p.slug} href={`/product/${p.slug}`} className="block text-white/70 transition-colors hover:text-white">{p.name}</Link>
                ))}
              </div>
            ))}
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Company</p>
              {COMPANY.map((c) => (
                <Link key={c.href} href={c.href} className="block text-white/70 transition-colors hover:text-white">{c.label}</Link>
              ))}
              <a href={links.labs} className="block text-white/70 transition-colors hover:text-white">Rhinon Labs</a>
              <Link href="/demo" className="block text-white/70 transition-colors hover:text-white">Book a demo</Link>
              <Link href="/contact" className="block text-white/70 transition-colors hover:text-white">Contact</Link>
              <a href={links.privacy} className="block text-white/70 transition-colors hover:text-white">Privacy & terms</a>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-[13px] text-white/45 sm:flex-row">
          <span>{`© ${year} Rhinon Labs. All rights reserved.`}</span>
          <span>Made in India</span>
        </div>
      </div>
    </footer>
  );
}
