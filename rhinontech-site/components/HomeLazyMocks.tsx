"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ProductMock = dynamic(() => import("./ProductMocks").then((m) => m.ProductMock), { ssr: false });
const Orbit = dynamic(() => import("./Orbit").then((m) => m.Orbit), { ssr: false });

function useNearViewport<T extends Element = HTMLDivElement>(rootMargin = "350px") {
  const ref = useRef<T>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || ready) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, rootMargin]);

  return [ref, ready] as const;
}

/** Lazily loads the below-the-fold CRM preview thumbnail when scrolled near view. */
export function LazyCrmPreview() {
  const [ref, ready] = useNearViewport<HTMLSpanElement>();
  return (
    <span ref={ref} className="block min-h-[240px] w-[112%] origin-top-left scale-[0.89]">
      {ready ? <ProductMock k="crm" /> : null}
    </span>
  );
}

/** Lazily loads the below-the-fold Orbit graphic while preserving exact aspect dimensions (zero CLS). */
export function LazyOrbit() {
  const [ref, ready] = useNearViewport<HTMLDivElement>();
  return (
    <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[640px]">
      {ready ? <Orbit /> : null}
    </div>
  );
}

