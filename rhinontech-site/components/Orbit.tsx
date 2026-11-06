import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/content/products";
import { IconTile } from "@/components/ui";

/**
 * Every module around one workspace, joined by lines with light travelling
 * along them. The ring turns slowly; labels stay upright. Hover pauses it.
 */
export function Orbit() {
  const count = PRODUCTS.length;
  const nodes = PRODUCTS.map((p, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { p, x: 50 + Math.cos(angle) * 40, y: 50 + Math.sin(angle) * 40 };
  });

  return (
    <div className="orbit-wrap relative mx-auto aspect-square w-full max-w-[640px]">
      <div aria-hidden className="absolute inset-[16%] rounded-full border border-dashed border-line" />
      <div aria-hidden className="absolute inset-[4%] rounded-full border border-line/70" />

      <div className="orbit-spin absolute inset-0">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            {nodes.map(({ p }, i) => (
              <linearGradient key={p.slug} id={`orbit-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={p.tone[0]} />
                <stop offset="1" stopColor={p.tone[1]} />
              </linearGradient>
            ))}
          </defs>
          {nodes.map(({ p, x, y }, i) => (
            <line key={p.slug} x1="50" y1="50" x2={x} y2={y} stroke={`url(#orbit-${i})`} strokeWidth="0.35" className="flow" strokeLinecap="round" />
          ))}
        </svg>
        {nodes.map(({ p, x, y }) => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={p.name}
          >
            <span className="orbit-node flex flex-col items-center gap-1.5">
              <span className="transition-transform duration-300 group-hover:scale-125">
                <IconTile icon={p.icon} tone={p.tone} size={46} />
              </span>
              <span className="hidden rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-line sm:block">{p.name}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <span aria-hidden className="ping-soft absolute inset-0 rounded-full bg-violet/20" />
        <span className="relative flex h-full w-full items-center justify-center rounded-full bg-night shadow-[0_30px_60px_-20px_rgb(60_50_200_/_0.7)] ring-8 ring-white">
          <Image src="/brand/mark-white.png" alt="Rhinon workspace" width={72} height={72} className="h-[52%] w-[52%]" />
        </span>
      </div>
    </div>
  );
}
