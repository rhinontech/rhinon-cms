# Effica (effica.framer.ai): UI and motion analysis

Reference teardown of a commercial Framer template ("Effica® Template", sold on the Framer marketplace). It documents **design patterns, components and animation techniques** for inspiration. It is not a spec for copying the site: the template's design, text and images belong to its author.

- **Analysed:** 17–18 Oct 2026
- **Method:** headless Chrome via DevTools Protocol at 1440×900 (desktop) and 390×844 (mobile)
  - Every Web Animations API call was logged by hooking `Element.prototype.animate` before page scripts ran, so keyframes, durations, easings and delays are exact
  - Computed styles were sampled for type, colour, radius and shadow
  - Screenshots were taken per viewport and per animation frame
  - Hover and click states were driven with real mouse events
  - Lighthouse was run for performance

---

## 1. Summary

| | |
|---|---|
| Built with | Framer (React runtime, SSR) + **Lenis** smooth scroll |
| Page height | 21,240px desktop (~24 screens), 23,103px mobile |
| Animations fired | **411** desktop, **452** mobile (Web Animations API) |
| Elements that start hidden | ~575, with `opacity: 0.001` plus a translateY offset |
| Fonts | Sora, Geist, Inter, IBM Plex Mono |
| Imagery | Black-and-white photography; colour only via one gradient |
| Lighthouse | Desktop 86 · **Mobile 49** (LCP 13.3s, CLS 0.265) · weight 2.0–2.7MB |

**Overall feel:** editorial and "technical drawing". Huge uppercase headings, tiny mono labels, greyscale surfaces, visible grid lines, and motion that is mostly masked reveals plus scroll-linked text.

---

## 2. Design system

### 2.1 Colour

| Token | Value | Use |
|---|---|---|
| Page | `#E8E8E8` | Body background |
| Panel | `#F5F5F5` | Cards, light sections |
| Ink | `#171717` | Text, dark sections |
| Ink deep | `#0E0E0E` | Darkest sections |
| Text secondary | `rgba(23,23,23,.6)` / `rgba(245,245,245,.6)` | Body copy on light / dark |
| White | `#FFFFFF` | Cards |
| **Accent gradient** | `linear-gradient(90deg, #A31BB6, #59BBD5 27%, #C9C5C7 51%, #E86167 74%, #F54510)` | 1–2px underlines under links and photos; blurred glows |

The site is greyscale except for this one gradient. It appears only as thin lines or soft blurs, never as large fills.

### 2.2 Typography

| Role | Font | Size / weight | Line-height | Tracking | Case |
|---|---|---|---|---|---|
| H1 | Sora | ~109px / 800 | 0.85 | −5% (−5.4px) | UPPER |
| H2 | Sora | 96px / 700 | 0.90 | −5% (−4.8px) | UPPER |
| Lead / body | Geist | 24px / 500 | 1.35 | −3% | Sentence, 60% opacity |
| Labels / meta | IBM Plex Mono | 11px / 500 | 1.4 | −2% | UPPER |
| Buttons | Sora | 15px / 700 | 0.9 | −3% | UPPER |

**Patterns**
- **Two-tone headings:** the first part of a heading is grey (dim) and the rest is ink, or the reverse.
- **Mono everywhere small:** eyebrows (`● 02 SERVICES`), descriptions, list items, form labels, stat captions and checklist items all use mono.
- **Numbering:** `/01`, `01/` and `/45`-style prefixes are a recurring motif.

### 2.3 Shape, depth, texture

- **Radius:**
  - 50px pills: buttons and stat badges
  - `0 50px 50px 0` half-pills
  - 10px cards
  - 34px large cards
- **Shadows:** layered and soft, e.g. `0 3px 6px rgba(0,0,0,.1), 0 11px 11px rgba(0,0,0,.09), 0 24px 14px rgba(0,0,0,.05)`.
- **Column grid lines:** faint 1px vertical lines run through the light sections, as if drawn on a page grid.
- **Crosshairs:** small `+` marks at grid intersections and section corners.
- **Film grain:** a full-page noise PNG at **2.7% opacity**, jittered continuously by changing `transform`. It's a 5760×84959px absolutely positioned div, which is expensive.
- **Effects:** `backdrop-filter: blur(5px)`, `mix-blend-mode: difference` on the hero headline, `mask-image` on the logo ticker edges.

---

## 3. Page structure (desktop, top to bottom)

| # | Section | Key components |
|---|---|---|
| 0 | **Header** (fixed) | Logo · "+ MENU" toggle · mono micro-copy · avatar · round "+" button |
| 1 | **Hero** | Rating badge (avatars + stars) · two-part headline · B&W portrait with RGB glitch · lead text · two full-width pill CTAs · logo ticker |
| 2 | **Who we are** (dark) | Small video card (play button, duration) · giant **scroll-fill** statement · person signature |
| 3 | **Services** (dark) | Numbered rows `/01–/04`: title · photo · mono description · hashtags; "About us" pill |
| 4 | **Why us** | Two-tone headline · numbered advantages list · stats card (3 metrics) with phone-in-hand image and gradient glow |
| 5 | **How we do it** | 2×2 numbered steps card · "% saved" stat with pie icon |
| 6 | **Cost of delay** | Rows with a black **% pill positioned along each bar** (bar-chart-like) |
| 7 | **Case study** | Meta grid (date, industry, challenge) · dark stat tiles · large quote over B&W photo (scroll-fill) |
| 8 | **More projects** | Text list of client names with superscript years; **expands inline on hover** |
| 9 | **CTA band** | Full-bleed B&W portrait + headline + short copy |
| 10 | **Team** | 4 portraits at staggered heights · role labels · gradient underline · "barcode" skill meters (~1,080 tick elements) |
| 11 | **Start your project** | Link with gradient underline over a large blurred gradient swoosh |
| 12 | **Stats** | Big `/NN` numbers with mono captions |
| 13 | **Pricing** (dark) | Centred title · monthly/annual toggle · 3 plan cards; the featured card is offset and has a gradient glow |
| 14 | **Founder quote** | Portrait · large quote mark · giant uppercase quote (scroll-fill) |
| 15 | **Timeline** | 4 year columns in a staircase layout, gradient line on top of each |
| 16 | **News** | 4 article cards at staggered heights, B&W art, mono dates, "All articles ↗" |
| 17 | **Newsletter** (black band) | Title · mono description · underline input · arrow link |
| 18 | **FAQ** | Numbered accordion with +/− icons · "Still unsure?" contact block |
| 19 | **Contact** | Large title · underline inputs with mono labels · side nav links |

**Section rhythm:** light and dark sections alternate. Each section has a mono eyebrow with a number (`● 07 WHO WE ARE`), a very large heading, then the content.

---

## 4. Animation catalogue (measured)

### 4.1 Hero entrance (first ~2.8s)

| t (ms) | Element | Animation |
|---|---|---|
| 0–250 | Page | Empty canvas with only the header |
| 100 | Headline line 1 | translateY **+250px → 0**, spring (sampled as `linear()` keyframes), 800ms, **masked** (rises through a clip) |
| 100 | Headline line 2 | translateY **−90px → 0**, spring, 680ms. **The two halves converge from opposite directions** |
| 200 | Rating badge | translateY +40px → 0 + fade, spring 590ms |
| 0–1600 | Hero image | `scale(1.4) → none` + fade, **1600ms, `cubic-bezier(0.68, 0, 0, 1)`** (slow zoom settle) |
| 600 | CTA buttons | translateY +20px → 0 + fade, spring 770ms |
| 200–420+ | Lead text | **Per-character** fade 0.001 → 1, 400ms, `cubic-bezier(0.44, 0, 0.13, 0.96)`, groups staggered ~110ms |

**Signature effect:** the headline is white with `mix-blend-mode: difference`, so it reads **dark on the grey page and inverts where it crosses the photo**.

### 4.2 Scroll-triggered reveals

- **Trigger:** IntersectionObserver-style, fired once per element.
- **Starting state:** `opacity: 0.001` with translateY **14px** (433 elements), **30px** (65) or **50px** (77), plus a few `scale(1.4)` and `translateY(20/40px)`.
- **Headings:** split into one span per character; each fades in over 400ms with the easing above. **331** per-character animations fired on scroll.
- **Rhythm:** each big heading animates in as its section enters the screen. Sections between headings fire nothing.

### 4.3 Scroll-linked text fill

- **Used on:** the large statements (who-we-are paragraph, case-study quote, founder quote).
- **Behaviour:** the opacity of each letter is tied to **scroll position**, not time:
  - 97 → 125 → 154 → 182 → 211 letters at full opacity as scroll goes 600 → 1400px
  - **Soft edge:** about 6 letters sit at in-between opacities (0.99, 0.93, 0.83, 0.70, 0.50…), so it reads as a wave rather than a hard cut
  - Unfilled text stays at about 60% opacity of the base colour

### 4.4 Continuous motion

| Element | Behaviour |
|---|---|
| Film grain | Noise layer at 2.7% opacity, transform jumps every frame |
| Logo ticker | Infinite horizontal marquee, edges faded with a mask |
| Smooth scroll | Lenis (`html.lenis`); the page glides after the wheel stops |

### 4.5 Hover and click interactions

| Component | Interaction | Detail |
|---|---|---|
| Pill buttons | **Text roll** | Label duplicated in the DOM. On hover the visible copy slides up and out while the copy below slides in, clipped by the pill. Mid-roll at ~60ms, done by ~140–150ms. No colour change |
| Menu links | **Per-letter roll** | Every letter is doubled (DOM text reads "HHoommee") so letters roll individually with a stagger |
| Menu | Toggle | "+" rotates into "×"; a **compact black panel** (not full-screen) drops from the trigger. Contents: mono links, large email, phone, socials |
| "More projects" list | **Inline expand** | Hovering a name opens a description and image card in place; the items below slide down |
| Services rows | None | Static |
| FAQ | Accordion | Height animates via JS (no CSS transition) |
| Pricing | Toggle | Monthly / annual switch with a "save %" note |
| Links with gradient underline | Static underline | The gradient line is the visual cue |

### 4.6 Easing vocabulary

| Purpose | Curve |
|---|---|
| Text fades | `cubic-bezier(0.44, 0, 0.13, 0.96)` |
| Image settle / big moves | `cubic-bezier(0.68, 0, 0, 1)` (strong in-out) |
| Element entrances | Springs (exported as `linear()` sampled keyframes), 590–800ms |

---

## 5. Mobile (390px)

- Same content, stacked; 23,103px tall (31 screens).
- Headings drop to ~40px but stay uppercase and tight.
- The two CTAs become stacked full-width pills.
- The hero headline still overlaps the portrait, with the blend inversion intact.
- Cost-of-delay rows, team photos and pricing cards stack full-width; the % pills stay right-aligned.
- **Performance is the weak point:** LCP 13.3s and a layout shift of 0.265 (poor).

---

## 6. Performance

| | Desktop | Mobile |
|---|---|---|
| Performance | 86 | **49** |
| LCP | 2.3s | **13.3s** |
| CLS | 0.064 | **0.265** |
| TBT | 0ms | 90ms |
| Transfer | 2.0MB | 2.7MB |

**Causes:**
- About 2MB of HTML: Framer SSR plus 1,080 skill-bar elements and duplicated per-letter spans.
- Hundreds of per-character animations.
- A giant grain layer.
- 155 JPGs.
- The Framer runtime itself.

---

## 7. Takeaways: what's worth adopting (as techniques, not copies)

| Technique | Worth it? | Cheaper way to build it |
|---|---|---|
| Two-tone giant uppercase headings + mono labels | ✅ Strong identity | Pure CSS |
| Numbered section eyebrows, grid lines, crosshairs | ✅ | One fixed overlay + pseudo-elements |
| Masked line reveals for headings | ✅ | Split by **word/line**, not by character |
| Scroll-linked text fill | ✅ Use once or twice per page | Per-word spans + one scroll handler |
| Text-roll hover on buttons | ✅ | CSS only (`::after` copy + translateY) |
| Per-letter roll on links | ✅ | One span per letter with a `text-shadow` copy (no duplicated DOM text) |
| Blend-difference headline over an image | ✅ Signature moment | `color:#fff; mix-blend-mode:difference` |
| Film grain | ✅ Subtle | Small SVG-noise tile on a fixed layer ≤140% of the viewport |
| Hover-expand list | ✅ | CSS grid-rows transition |
| Per-character reveals everywhere | ❌ Main cause of the bloat | Word-level splits |
| 1,000-element barcode meters | ❌ | Canvas, SVG pattern or a repeating gradient |

These techniques were implemented originally, with Rhinon Labs' own content and design, in `rhinonlabs-concept/` (static) and `rhinonlabs-concept-nextjs/`. Lighthouse: desktop 96–99, mobile 84–87, CLS 0.
