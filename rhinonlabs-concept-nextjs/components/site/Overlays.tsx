/** Fixed texture and structure layers: animated film grain and the 4-column grid lines. */
export default function Overlays() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -inset-[20%] z-120 h-[140%] w-[140%] animate-grain bg-size-[180px_180px] opacity-6 motion-reduce:hidden"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Column lines that read on both paper and ink */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 mix-blend-difference">
        <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[repeat(4,1fr)] px-(--gutter) max-[1100px]:grid-cols-[repeat(3,1fr)] max-sm:grid-cols-[repeat(2,1fr)]">
          {[0, 1, 2, 3].map((i) => (
            <i
              key={i}
              className="border-l border-white/7.5 last:border-r max-[1100px]:nth-4:hidden max-sm:nth-[n+3]:hidden"
            />
          ))}
        </div>
      </div>
    </>
  );
}
