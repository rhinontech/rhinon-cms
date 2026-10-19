"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  siteConfig,
  events,
  ICONS,
  CAT_LABELS,
  HAND_ICON,
  BOLT_ICON,
} from "@/lib/data";

/* ── Helpers ─────────────────────────────────────────────────────────── */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, "0");

/* ══════════════════════════════════════════════════════════════════════
   HomepageClient
   Runs once after mount. Migrates the vanilla main.js logic into a
   single useEffect so that all DOM-dependent setup (IntersectionObserver,
   scroll listeners, Lenis, text splitting, etc.) fires client-side only.
   ════════════════════════════════════════════════════════════════════ */
export default function HomepageClient() {
  const initialized = useRef(false);

  const boot = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── 1. Content wiring ───────────────────────────────────────── */
    $$("[data-book]").forEach((a) => (a.href = siteConfig.bookCall));
    $$("[data-phone]").forEach((a) => {
      a.href = siteConfig.phoneHref;
      if (!a.textContent.trim()) a.textContent = `Call ${siteConfig.phone}`;
    });
    $$("[data-phone-btn]").forEach((a) => (a.href = siteConfig.phoneHref));
    $$("[data-whatsapp]").forEach((a) => (a.href = siteConfig.whatsapp));
    $$("[data-mail]").forEach((a) => {
      a.href = `mailto:${siteConfig.email}`;
      if (!a.textContent.trim()) a.textContent = siteConfig.email;
    });
    $$("[data-site]").forEach(
      (a) => (a.href = siteConfig.site + a.dataset.site)
    );
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ── 2. Text splitting ───────────────────────────────────────── */
    function splitWords(el, mask) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      const words = [];
      for (const t of texts) {
        const frag = document.createDocumentFragment();
        for (const part of t.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(" ");
            continue;
          }
          const inner = document.createElement("span");
          inner.className = mask ? "wi" : "fw";
          inner.textContent = part;
          inner.style.setProperty("--i", words.length);
          words.push(inner);
          if (mask) {
            const outer = document.createElement("span");
            outer.className = "w";
            outer.append(inner);
            frag.append(outer);
          } else frag.append(inner);
        }
        t.replaceWith(frag);
      }
      return words;
    }

    function splitLetters(el) {
      const text = el.textContent;
      el.setAttribute("aria-label", text);
      const wrap = document.createElement("span");
      wrap.className = "letters";
      wrap.setAttribute("aria-hidden", "true");
      [...text].forEach((c, i) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.style.setProperty("--i", i);
        s.textContent = c;
        wrap.append(s);
      });
      el.textContent = "";
      el.append(wrap);
    }

    $$("[data-split]").forEach((el) => splitWords(el, true));
    const fillEl = $("[data-fill]");
    const fillWords = fillEl ? splitWords(fillEl, false) : [];
    $$("[data-letters]").forEach(splitLetters);

    /* Footer mark letter-split */
    const mark = $("#mark");
    if (mark) {
      const markText = mark.textContent.trim();
      mark.innerHTML = [...markText]
        .map(
          (c, i) =>
            `<span class="mk"><span class="mk__in" style="--i:${i}">${
              c === " " ? "&nbsp;" : c
            }</span></span>`
        )
        .join("");
    }

    /* ── 3. Smooth scroll (Lenis) ────────────────────────────────── */
    let lenis = null;
    import("lenis").then(({ default: Lenis }) => {
      if (reduce) return;
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      const raf = (t) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    });

    const scrollToTarget = (t) => {
      if (lenis)
        lenis.scrollTo(t, { offset: t === 0 ? 0 : -20, duration: 1.4 });
      else if (t === 0)
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    };

    /* ── 4. Menu ─────────────────────────────────────────────────── */
    const menu = $("#menu");
    const menuBtn = $("#menuBtn");
    const setMenu = (open) => {
      menu.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenu(!menu.classList.contains("is-open"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (menu.classList.contains("is-open") && !menu.contains(e.target))
        setMenu(false);
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id === "#") return;
      const target = id === "#top" ? 0 : $(id);
      if (target == null) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(target);
    });

    /* ── 5. Reveals ──────────────────────────────────────────────── */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    $$("[data-split], [data-reveal], .foot__markwrap").forEach((el) =>
      io.observe(el)
    );

    const counter = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          counter.unobserve(e.target);
          const el = e.target;
          const to = Number(el.dataset.count);
          if (reduce) {
            el.textContent = to;
            continue;
          }
          const t0 = performance.now();
          const run = (now) => {
            const k = clamp((now - t0) / 1600, 0, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
            if (k < 1) requestAnimationFrame(run);
          };
          requestAnimationFrame(run);
        }
      },
      { threshold: 0.6 }
    );
    $$("[data-count]").forEach((el) => counter.observe(el));

    /* ── 6. Hero: load sequence, clock, live log ─────────────────── */
    const start = () =>
      requestAnimationFrame(() =>
        document.documentElement.classList.add("is-loaded")
      );
    Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((r) => setTimeout(r, 3000)),
    ]).then(start);

    const clock = $("#clock");
    const hm = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });
    const hms = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tick = () => {
      if (clock) clock.textContent = hm.format(new Date());
    };
    tick();
    setInterval(tick, 10000);

    const log = $("#log");
    let evIndex = 0;
    const pushEvent = () => {
      if (!log) return;
      const [name, ...steps] = events[evIndex++ % events.length];
      const li = document.createElement("li");
      li.innerHTML = `<time>${hms.format(
        new Date()
      )}</time><span><b>${name}</b> → ${steps.join(" → ")}</span>`;
      log.append(li);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => li.classList.add("in"))
      );
      while (log.children.length > 3) log.firstElementChild.remove();
    };
    if (reduce) {
      pushEvent();
      $(".system__map")?.pauseAnimations?.();
    } else {
      setTimeout(pushEvent, 900);
      setTimeout(pushEvent, 1600);
      setInterval(pushEvent, 2600);
    }

    /* ── 7. Before / after ───────────────────────────────────────── */
    const ba = $("#before-after");
    let baTouched = false;
    const setMode = (mode) => {
      ba.classList.toggle("is-auto", mode === "auto");
      $$(".switch button", ba).forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.mode === mode))
      );
    };
    $$(".switch button", ba).forEach((b) =>
      b.addEventListener("click", () => {
        baTouched = true;
        setMode(b.dataset.mode);
      })
    );
    new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        setTimeout(() => {
          if (!baTouched) setMode("auto");
        }, 1800);
      },
      { threshold: 0.5 }
    ).observe($(".flow", ba));

    /* ── 8. Systems filter (FLIP) ────────────────────────────────── */
    const tabs = $$("#tabs .tab");
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        tabs.forEach((t) =>
          t.setAttribute("aria-selected", String(t === tab))
        );
        const cat = tab.dataset.filter;
        const cards = $$(".sys");
        const before = new Map(
          cards.map((c) => [c, c.getBoundingClientRect()])
        );
        cards.forEach(
          (c) =>
            (c.hidden = !(cat === "all" || c.dataset.cat === cat))
        );
        if (reduce) return;
        cards.forEach((c) => {
          if (c.hidden) return;
          const a = before.get(c);
          const b = c.getBoundingClientRect();
          if (!a.width) {
            c.animate(
              [
                { opacity: 0, transform: "scale(.96)" },
                { opacity: 1, transform: "none" },
              ],
              { duration: 500, easing: "cubic-bezier(.16,1,.3,1)" }
            );
            return;
          }
          const dx = a.left - b.left,
            dy = a.top - b.top;
          if (dx || dy)
            c.animate(
              [
                { transform: `translate(${dx}px, ${dy}px)` },
                { transform: "none" },
              ],
              { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" }
            );
        });
      })
    );

    /* ── 9. Calculator ───────────────────────────────────────────── */
    const cP = $("#cPeople"),
      cH = $("#cHours"),
      cR = $("#cRate");
    const total = $("#cTotal"),
      weeksOut = $("#cWeeks"),
      cells = $$("#weeks i");
    const inr = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
    let shown = 0,
      tween = 0,
      calcStarted = false;
    const fillTrack = (input) =>
      input.style.setProperty(
        "--p",
        `${((input.value - input.min) / (input.max - input.min)) * 100}%`
      );
    const calc = () => {
      [cP, cH, cR].forEach(fillTrack);
      $("#oPeople").textContent = cP.value;
      $("#oHours").textContent = cH.value;
      $("#oRate").textContent = inr(cR.value);
      const hours = cP.value * cH.value * 48;
      const cost = hours * cR.value;
      const weeks = hours / 40;
      weeksOut.textContent = Math.round(weeks).toLocaleString("en-IN");
      const filled = Math.min(52, Math.round(weeks));
      cells.forEach((c, i) => c.classList.toggle("on", i < filled));
      if (reduce) {
        total.textContent = inr(cost);
        return;
      }
      const from = shown,
        t0 = performance.now();
      cancelAnimationFrame(tween);
      const step = (now) => {
        const k = clamp((now - t0) / 600, 0, 1);
        shown = from + (cost - from) * (1 - Math.pow(1 - k, 3));
        total.textContent = inr(shown);
        if (k < 1) tween = requestAnimationFrame(step);
      };
      tween = requestAnimationFrame(step);
    };
    [cP, cH, cR].forEach((input) =>
      input.addEventListener("input", () => {
        calcStarted = true;
        calc();
      })
    );
    [cP, cH, cR].forEach(fillTrack);
    new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting || calcStarted) return;
        obs.disconnect();
        calcStarted = true;
        calc();
      },
      { threshold: 0.4 }
    ).observe($(".calc__out"));

    /* ── 10. FAQ ─────────────────────────────────────────────────── */
    $("#faqs").addEventListener("click", (e) => {
      const btn = e.target.closest(".qa__q");
      if (!btn) return;
      const qa = btn.closest(".qa");
      const open = !qa.classList.contains("is-open");
      $$(".qa").forEach((x) => {
        x.classList.remove("is-open");
        $(".qa__q", x).setAttribute("aria-expanded", "false");
      });
      if (open) {
        qa.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });

    /* ── 11. Scroll-linked effects ───────────────────────────────── */
    const hdr = $("#hdr");
    const themed = $$("[data-theme]");
    const proc = $("#process"),
      track = $("#track"),
      rail = $("#railFill");
    const ticks2 = $$("#railTicks li"),
      steps = $$(".step"),
      wcards = $$(".wcard");
    const desktop = window.matchMedia("(min-width: 1101px)");
    let procOverflow = 0,
      pinned = false,
      cardTops = [];

    function measure() {
      pinned = desktop.matches && !reduce;
      proc.classList.toggle("is-pinned", pinned);
      track.style.transform = "";
      if (pinned) {
        procOverflow = Math.max(0, track.scrollWidth - window.innerWidth);
        proc.style.height = `${window.innerHeight + procOverflow}px`;
      } else {
        procOverflow = 0;
        proc.style.height = "";
      }
      cardTops = wcards.map(
        (c) => parseFloat(getComputedStyle(c).top) || 0
      );
    }

    function update() {
      const vh = window.innerHeight;
      let theme = "light";
      for (const s of themed) {
        const r = s.getBoundingClientRect();
        if (r.top <= 34 && r.bottom > 34) {
          theme = s.dataset.theme;
          break;
        }
      }
      hdr.classList.toggle("is-dark", theme === "dark");
      hdr.classList.toggle("is-scrolled", window.scrollY > 40);

      if (fillEl) {
        const r = fillEl.getBoundingClientRect();
        if (r.bottom > -vh && r.top < vh * 1.5) {
          const p = clamp(
            (vh * 0.85 - r.top) / (r.height + vh * 0.55),
            0,
            1
          );
          const head = p * (fillWords.length + 5);
          fillWords.forEach((w, j) =>
            w.style.setProperty(
              "--o",
              (0.14 + 0.86 * clamp((head - j) / 5, 0, 1)).toFixed(3)
            )
          );
        }
      }

      const pr = proc.getBoundingClientRect();
      let active;
      if (pinned) {
        const span = proc.offsetHeight - vh;
        const p = span > 0 ? clamp(-pr.top / span, 0, 1) : 0;
        track.style.transform = `translate3d(${(
          -p * procOverflow
        ).toFixed(1)}px,0,0)`;
        rail.style.setProperty("--p", p.toFixed(4));
        active = Math.round(p * (steps.length - 1));
      } else {
        active = 0;
        steps.forEach((s, i) => {
          if (s.getBoundingClientRect().top < vh * 0.6) active = i;
        });
        rail.style.setProperty(
          "--p",
          (active / (steps.length - 1)).toFixed(4)
        );
      }
      steps.forEach((s, i) =>
        s.classList.toggle("is-active", i === active)
      );
      ticks2.forEach((t, i) => t.classList.toggle("on", i <= active));

      for (let i = 0; i < wcards.length - 1; i++) {
        const next = wcards[i + 1].getBoundingClientRect();
        const q = clamp(
          1 - (next.top - cardTops[i]) / (vh * 0.9),
          0,
          1
        );
        wcards[i].style.setProperty("--s", (1 - q * 0.05).toFixed(4));
        wcards[i].style.setProperty("--dim", (q * 0.5).toFixed(3));
      }
    }

    function fitMark() {
      const wrap = $(".foot__markwrap");
      if (!mark || !wrap) return;
      mark.style.fontSize = "200px";
      const w = mark.getBoundingClientRect().width;
      if (w > 0)
        mark.style.fontSize = `${(
          (200 * wrap.clientWidth) /
          w
        ).toFixed(2)}px`;
    }

    let queued = false;
    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          update();
        });
      },
      { passive: true }
    );
    const relayout = () => {
      measure();
      fitMark();
      update();
    };
    window.addEventListener("resize", relayout);
    window.addEventListener("load", relayout);
    if (document.fonts) document.fonts.ready.then(relayout);
    relayout();
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  return null; // no DOM output — this component is purely side-effects
}
