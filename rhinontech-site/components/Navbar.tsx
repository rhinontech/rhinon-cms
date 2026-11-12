"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { GROUPS, PRODUCTS, byGroup } from "@/content/products";
import { links } from "@/components/site";
import { IconTile, Logo } from "@/components/ui";

const NAV = [
  { href: "/ai", label: "Rhinon AI" },
  { href: "/integrations", label: "Integrations" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const open = useCallback(() => {
    clearTimeout(closeTimer.current);
    setMega(true);
  }, []);
  const closeSoon = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 140);
  }, []);

  useEffect(() => {
    setMega(false);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMega(false);
        setMobile(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  return (
    <>
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${scrolled || mega || mobile ? "border-line bg-white/85" : "border-transparent bg-white/55"}`}>
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5">
        <Link href="/" aria-label="Rhinon Tech home" className="shrink-0">
          <Logo height={42} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div className="relative" onPointerEnter={open} onPointerLeave={closeSoon} onFocus={open}>
            <button
              type="button"
              aria-expanded={mega}
              aria-haspopup="true"
              onClick={() => setMega((m) => !m)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors hover:bg-soft ${pathname.startsWith("/product") ? "text-violet" : "text-ink"}`}
            >
              Product
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${mega ? "rotate-180" : ""}`} />
            </button>
          </div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors hover:bg-soft ${pathname === n.href ? "text-violet" : "text-ink"}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a href={links.login} className="rounded-lg px-3.5 py-2 text-[15px] font-medium hover:bg-soft">Log in</a>
          <a href={links.signup} className="btn btn-primary !h-10 !rounded-[10px] !px-5 !text-[14px]">Get started free</a>
        </div>

        <button type="button" aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile} onClick={() => setMobile((m) => !m)} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-soft lg:hidden">
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mega menu */}
      <div
        onPointerEnter={open}
        onPointerLeave={closeSoon}
        className={`absolute inset-x-0 top-full hidden px-5 transition-all duration-300 lg:block ${mega ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}
      >
        <div className="mx-auto mt-2 grid max-w-[1120px] grid-cols-[1fr_1fr_1fr_300px] gap-2 rounded-[28px] border border-line bg-white p-3 shadow-[0_40px_90px_-30px_rgb(40_30_140_/_0.45)]">
          {GROUPS.map((g) => (
            <div key={g.name} className="p-3">
              <p className="px-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{g.name}</p>
              <p className="mb-2 px-2 text-[12.5px] text-muted">{g.line}</p>
              <ul>
                {byGroup(g.name).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} tabIndex={mega ? 0 : -1} className="group flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-soft">
                      <IconTile icon={p.icon} tone={p.tone} size={36} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[14.5px] font-semibold">
                          {p.name}
                          {p.premium && <span className="rounded-full bg-pink/15 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-pink">Premium</span>}
                        </span>
                        <span className="block text-[12.5px] leading-[18px] text-muted">{p.short}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link href="/ai" tabIndex={mega ? 0 : -1} className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-night p-6 text-white">
            <span aria-hidden className="blob -right-10 -top-10 h-48 w-48" style={{ background: "#7c5cff", opacity: 0.6 }} />
            <span aria-hidden className="blob -bottom-16 -left-10 h-44 w-44 [animation-delay:-9s]" style={{ background: "#ff5fb0", opacity: 0.4 }} />
            <span className="relative">
              <span className="font-display block text-[24px] font-semibold leading-[1.1]">Rhinon AI, built into every module.</span>
              <span className="mt-2 block text-[13px] leading-5 text-white/65">Research, draft, answer and rewrite without leaving your work.</span>
            </span>
            {/* The mascot, in its own blue, on a soft glow of the same colour */}
            <span className="relative my-4 flex flex-1 items-center justify-center">
              <span aria-hidden className="absolute h-40 w-40 rounded-full bg-[#2f6bff]/45 blur-[46px] transition-opacity duration-500 group-hover:bg-[#2f6bff]/60" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mascot.webp" alt="" aria-hidden width={420} height={560} className="relative h-[150px] w-auto drop-shadow-[0_10px_20px_rgb(0_0_0_/_0.5)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-2deg]" />
            </span>
            <span className="relative flex items-center gap-1.5 text-[14px] font-semibold">See how it works <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </div>

    </header>

      {/* Mobile sheet. Outside the header: its backdrop blur would otherwise become the containing block for `fixed`. */}
      {mobile && (
        <div className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white px-5 pb-10 pt-4 lg:hidden">
          <p className="px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Product</p>
          <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {PRODUCTS.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-soft">
                  <IconTile icon={p.icon} tone={p.tone} size={34} />
                  <span className="text-[15px] font-semibold">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-5 border-t border-line pt-3">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="block rounded-xl px-2.5 py-3 text-[17px] font-medium hover:bg-soft">{n.label}</Link></li>
            ))}
          </ul>
          <div className="mt-5 grid gap-3">
            <a href={links.signup} className="btn btn-primary">Get started free</a>
            <a href={links.login} className="btn btn-ghost">Log in</a>
          </div>
        </div>
      )}
    </>
  );
}
