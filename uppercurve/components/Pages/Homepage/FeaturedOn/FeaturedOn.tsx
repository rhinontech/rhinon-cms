import { AnimateWrapper } from "@/components/Animations";
import React from "react";

export function FeaturedOn() {
  const brands = [
    { logo: "📚", name: "Learn" },
    { logo: "🛠️", name: "Build" },
    { logo: "🤝", name: "Connect" },
    { logo: "📈", name: "Grow" },
  ];

  return (
    <section className=" pt-10 pb-16 text-center overflow-hidden">
      <AnimateWrapper as="h4" className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
        The UpperCurve way
      </AnimateWrapper>

      {/* Infinite Left Moving Brands Marquee with Edge Gradient Masks */}
      <div className="relative w-full mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max gap-6 md:gap-8 animate-marquee-reverse py-2">
          {[...Array(4)].flatMap(() => brands).map((brand, i) => (
            <div
              key={i}
              className="bg-gray-100/90 hover:bg-gray-200/90 px-7 py-4 rounded-2xl flex items-center gap-3 text-gray-800 font-bold text-sm tracking-tight transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            >
              <span className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-xs shadow-sm text-gray-900 border border-gray-200/60">
                {brand.logo}
              </span>
              <span className="text-gray-900 font-bold">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedOn;
