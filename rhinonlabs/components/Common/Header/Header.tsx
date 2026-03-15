"use client";
import Link from "next/link";
import React from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

const menuItems = [
  { name: "Home", href: "#hero" },
  { name: "Services", href: "#services" },
  { name: "Process", href: "#process" },
  { name: "Projects", href: "#projects" },
  { name: "FAQs", href: "#faqs" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const router = useRouter()

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMenuState(false);
      }
    }
  };

  return (
    <header>
      {/* "Shadow from top" - a gradient to ensure visibility if needed, or just the shadow on the nav itself. 
          Interpreting "shadow from top" as a drop shadow on the navbar + consistent fixed positioning. */}
      <nav
        data-state={menuState && "active"}
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 transition-all duration-300 bg-gradient-to-b from-black/50 to-transparent"
      >
        <div
          className={cn(
            "w-full max-w-5xl px-2 py-2",
          )}
        >
          <div className="relative flex items-center justify-between gap-6 md:px-6 py-3">
            {/* Logo + Mobile Menu Button */}

            <div className="flex items-center gap-10">
              <div className="flex shrink-0 items-center">
                <Link
                  href="/"
                  aria-label="home"
                  className="flex items-center space-x-2"
                >
                  <Image
                    src="/assets/Logo_Rhinon_Web_Full.png"
                    alt="Rhinon Tech Logo"
                    width={110}
                    height={110}
                    className="object-contain h-9 w-auto"
                  />
                </Link>
              </div>

              {/* Desktop Menu - Centered using absolute positioning trick or just flex-1 justify-center */}
              <div className="hidden md:flex">
                <ul className="flex gap-8 text-sm font-medium text-white/80">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="hover:text-white hover:scale-105 transition-all duration-200"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

            </div>


            {/* Buttons + Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 block cursor-pointer lg:hidden text-white"
              >
                {menuState ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <div className="hidden lg:block">
                <Button className="hover:bg-white bg-transparent rounded-none text-white hover:text-black p-5 backdrop-blur-xl bg-white/4 border-[1px] border-white/30" onClick={() => window.open('https://calendly.com/rhinonweb', '_blank')}>
                  Book a Free Discovery Call
                </Button>
              </div>
            </div>

            {/* Mobile Menu Dropdown (Outside the relative container flow to avoid width constraints if needed, but here simple is better) */}
            <div
              className={cn(
                "absolute top-full left-0 mt-4 w-full flex-col gap-4 rounded-2xl border border-white/10 bg-black/95 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 lg:hidden",
                menuState ? "flex opacity-100 scale-100" : "hidden opacity-0 scale-95"
              )}
            >
              <ul className="flex flex-col gap-4 text-left">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="block text-lg font-medium text-white/80 hover:text-white"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 mt-4">
                <Button onClick={() => window.open('https://calendly.com/rhinonweb', '_blank')} className="hover:bg-white bg-transparent rounded-none text-white hover:text-black p-5 backdrop-blur-xl bg-white/4 border-[1px] border-white/30">
                  Book a Free Discovery Call
                </Button>
              </div>
            </div>

          </div>
        </div>
      </nav>
    </header>
  );
};
