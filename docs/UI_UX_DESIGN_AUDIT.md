# Rhinon Tech admin panel: UI/UX design audit

| | |
|---|---|
| Date | 25 November 2026 |
| Scope | `rhinontech/admin-panel` at `07e2e41` (beta), light and dark mode, desktop (1440px) and phone width (520px) |
| Benchmark | Linear, Stripe Dashboard, Notion, Attio, HubSpot, Vercel: the products buyers will compare against |
| Method | 11 screens captured from a beta-data build (screenshots in `docs/ux-audit/`), plus a measured audit of all 503 UI files |

---

## 1. Verdict

The foundation is better than most early SaaS products. The theme uses OKLCH colour tokens, a radius scale and Geist type, and has a real dark mode. The Inbox and the new Home are close to world-class. What separates Rhinon from Linear or Stripe is not missing features. It is **discipline**: the product has a design system on paper, and about a third of the screens don't use it.

Five problems account for most of the gap, in order of impact:

1. **Too many navigation panes.** Sidebar, module sub-nav, list and detail panel stack side by side. On a 1440px screen 412px (29%) is spent on navigation before any content. On HR & People the table clips ("STAT", "acti") and the panel title truncates to "Member Deta".
2. **Colour is used for decoration, not meaning.** Seventeen differently coloured sidebar tiles, saturated status pills and a tinted gradient backdrop leave nothing for colour to signal. In the best products colour means status or action.
3. **No single type scale.** About 16 font sizes are in use, including arbitrary 9, 10, 11, 12.5, 13 and 15px. Page titles are styled 8+ different ways.
4. **Components are rebuilt per screen.** There are 802 hand-written `<button>`s against 84 uses of the shared Button, and 302 raw `<input>`s against 49 uses of the shared Input. Every module looks slightly different because it *is* slightly different.
5. **Boxes inside boxes.** Cards within cards, and every profile field in its own bordered tile. This adds visual weight without adding structure.

**Recommended direction: "calm precision".** That means a single sidebar, quiet neutral surfaces, monochrome icons, colour reserved for status and the one primary action, one type scale, and dense-but-breathable tables. This is how Linear, Stripe and Attio feel premium. It isn't decoration; it's restraint applied consistently.

---

## 2. What's already strong (keep it)

| Area | Why it works | Evidence |
|---|---|---|
| Inbox | Clear three-pane email model, readable list, a contact panel that earns its space, reply composer with internal notes | `ux-audit/inbox-light.png` |
| Home | Leads with "Needs your attention", has a clear action per row, and groups the launcher like the sidebar | `ux-audit/home-light.png` |
| Theme tokens | OKLCH palette, semantic tokens (`--primary`, `--muted`, `--border`), radius scale, matched dark mode | `app/globals.css` |
| Dark mode | Consistent surfaces and contrast; not an afterthought | `ux-audit/leads-dark.png` |
| ⌘K search, breadcrumbs, grouped sidebar | Navigation fundamentals are in place | — |
| Chatbot setup checklist | Progress, done states, a clear next step | `ux-audit/chatbot-light.png` |

---

## 3. Measured audit (503 UI files)

| Measure | Value | World-class target | Read |
|---|---|---|---|
| Raw palette classes (`bg-blue-500`, `text-emerald-600`…) | **3,667** | Near 0 outside a status/chart map | 36% of colour bypasses the tokens. Hard to re-theme; dark mode relies on manual `dark:` pairs |
| Hex colours in components | 163 | 0 (tokens only) | Mostly module tones and charts |
| Token colour classes | 6,623 | — | The system exists and is used most of the time |
| Font sizes in use | ~16 (6 arbitrary px values, 563 uses of 10–11px) | 6–7 steps | 10px and 9px text is below a comfortable reading size |
| Font weights | 4 (+2 stray) | 3 (400, 500, 600) | `font-bold` (300 uses) competes with `semibold` for the same job |
| Radius values | 7 (`lg`, `xl`, `2xl`, `full`, `md`, base, `sm`) | 3 | Cards, inputs and pills each pick their own |
| Shared `Button` vs raw `<button>` | 84 vs **802** | Nearly all through one component | Hover, focus, size and disabled states differ per screen |
| Shared `Input` vs raw `<input>` | 49 vs 302 | Same | Different heights and focus rings across forms |
| Icon libraries | Tabler (243 files) + Lucide (31) + Material (4) | One | Stroke weights and corner styles don't match |
| Page title styles | 8+ variants | 1 | "Payroll Dashboard" (18px), "Leads" (15px), Home (24px) |
| `focus-visible` vs `focus:` | 51 vs 542 | `focus-visible` | `focus:` shows a ring on mouse click too. Keyboard focus exists, but it isn't consistent |
| Largest component | `PeopleDirectory.tsx`, 1,965 lines | <400 | A single file holds a table, filters, a drawer, forms and dialogs, so no shared patterns emerge |

---

## 4. Findings and fixes

Each finding gives the evidence, why it matters against the benchmark, the fix, and a "done when". Severity: **P0** (hurts every session), **P1** (visible quality gap), **P2** (polish).

### D1 (P0). Too many navigation panes

**Evidence.** Every module renders the main sidebar (≈192px), a module sub-nav (≈212px), then content. HR & People and Leads add a detail panel on top. Screenshots: `people-light.png` clips the table and truncates "Member Deta" and "15 ac…"; `leads-light.png` cuts off the last column.

**Why it matters.** Linear, Notion and Attio use **one** sidebar with expandable sections. Stripe uses one sidebar plus in-page tabs. Two stacked menus make people learn two navigation systems, and they cost the content the width it needs.

**Fix.**
1. **Fold each module's sub-nav into the main sidebar.** Clicking "CRM" expands Leads · Accounts · Deals · Reports inline, indented, and collapses the other modules. Or, for modules with 3–6 pages (CRM, Outreach, Payroll, Chatbot), render them as tabs under the page title.
2. **Detail panels become an overlay drawer** (from the right, 480–560px, over the list, closed with Esc), not a fourth column. This applies to People, Leads, Deals, Accounts and Tasks.
3. Settings stays a two-column layout (that pattern is standard for settings).

**Done when** no module shows more than two navigation surfaces, and the Leads and People tables show every column at 1440px without horizontal scrolling.

### D2 (P0). Colour as decoration

**Evidence.** Seventeen sidebar items, each with its own saturated tile (`MODULE_TONES`). Status pills are solid yellow, blue and green on Tasks (`tasks-light.png`). A tinted gradient wash sits behind every screen (`app-backdrop`). There are 3,667 raw palette classes.

**Why it matters.** When everything is coloured, colour stops carrying information, and an overdue task or a waiting chat no longer stands out. Linear's sidebar is monochrome; Stripe uses colour almost only for status and the primary button. It is the single biggest cue that separates "premium tool" from "template".

**Fix.**
- **Sidebar:** monochrome icons (current text colour), with the active item shown as a neutral surface plus a 2px accent bar. Module tones survive only as a small accent in each module's page header, if at all.
- **Status:** a small dot plus normal-weight text ("● In progress"), using five semantic tones only: neutral, info, success, warning, danger. Solid filled pills only for a few states that need alarm (Overdue, Failed).
- **Backdrop:** a flat `--background` in app screens. Keep the gradient on auth pages and marketing.
- **Codify:** a `StatusBadge` component with a `tone` prop, so no screen writes `bg-emerald-100 text-emerald-700` again.

**Done when** the sidebar has no coloured tiles, every status in the app comes from `StatusBadge`, and raw palette classes fall below 500, used only in charts and the status map.

### D3 (P0). Type scale

**Evidence.** About 16 sizes, including `text-[10px]` (260 uses), `text-[11px]` (303), `text-[9px]`, `text-[12.5px]` and `text-[13px]`. Titles are styled 8+ ways. Table headers are UPPERCASE in Payroll and sentence case in CRM.

**Fix.** One scale, as Tailwind theme tokens, with a single title component:

| Token | Size / line-height | Use |
|---|---|---|
| `text-caption` | 12 / 16 | Meta, table captions, timestamps (never smaller) |
| `text-body-sm` | 13 / 20 | Dense UI: tables, sidebar, controls |
| `text-body` | 14 / 22 | Default body and forms |
| `text-title-sm` | 16 / 24, 600 | Card and section titles |
| `text-title` | 20 / 28, 600 | Page titles (every module, same) |
| `text-display` | 28 / 36, 600 | Home greeting, empty-state heroes only |

Weights: 400, 500 and 600 only. Remove `font-bold` and `font-black`. Table headers: sentence case, 12px, 500 weight, muted.

**Done when** no `text-[…px]` remains in components, and every page title renders through one `PageHeader` component.

### D4 (P1). One component library, actually used

**Evidence.** 802 raw `<button>`s, plus `TBtn` (CRM's own button) and `Button`. 302 raw `<input>`s. Tabler, Lucide and Material icons. Three confirm patterns (`useConfirm`, `confirmDialog`, plus one browser `alert` in `HelpArticleEditor.tsx`).

**Why it matters.** Users judge craft by consistency. A button that is 32px here and 36px there, or a focus ring that changes colour between modules, feels like several products glued together.

**Fix.**
- **`Button`:** variants `primary | secondary | ghost | danger | link`, sizes `sm (28) | md (32) | lg (36)`, plus loading, disabled and icon-only states. Migrate module by module, starting with the most-used screens (CRM, Work, People). Delete `TBtn`.
- **`Input`, `Select`, `Textarea`, `Field`** (label, hint and error in one wrapper) for every form.
- **Icons:** Tabler only, stroke 1.75, sizes 16 and 18. Remove `lucide-react` and Material.
- **Dialogs:** `useConfirm` only. Replace the remaining `alert`.
- **`PageHeader`** (title, description, actions, tabs), **`DataTable`** (D5), **`StatusBadge`** (D2), **`EmptyState`** (one pattern: icon, one sentence, primary action).
- Add an ESLint rule (`no-restricted-syntax`) that flags raw `<button>` and `text-[…px]` in `components/Admin/**`, so it doesn't regress.

**Done when** raw `<button>` falls below 50 in `components/Admin`, there's one icon library, and the lint rule is on.

### D5 (P1). Tables are the product; they need to feel like Attio, not a spreadsheet export

**Evidence.** Leads (`leads-light.png`) puts a stage dropdown and an owner dropdown in **every** row, so 15 chevrons compete with the data. There's no column chooser, no sticky first column, and the last column clips. On phones (`leadsm-light.png`) the same table just shrinks and scrolls sideways.

**Fix.** A single `DataTable` used by Leads, Accounts, Deals list, People, Tasks list and Payslips:
- Row height 40px (comfortable) or 32px (compact), switched by a density toggle.
- **Inline editing on hover or focus only.** At rest a cell shows plain text ("New", "Unassigned"); the control appears on hover.
- Sticky header and first column; column visibility and order saved per user in Saved Views (already exists).
- Right-align numbers in tabular figures; muted "—" for empty cells.
- Selecting rows reveals a bulk-action bar at the bottom: Assign, Change stage, Add to list, Export.
- **On phones, rows become stacked cards:** name, one secondary line, and status. Never a squeezed table.

**Done when** Leads shows all columns at 1440px, rows have no visible controls at rest, and the phone view is a card list.

### D6 (P1). Boxes inside boxes

**Evidence.** The People detail panel puts every field (Status, Department, Work location…) in its own bordered tile (`people-light.png`). Chatbot nests cards within cards. KPI rows are cards on top of a card panel.

**Fix.** Use **one** surface per region. Inside it, structure comes from spacing, a hairline divider and label/value typography. For example, a definition list: label 12px muted on the left, value 14px on the right, 12px row gap. Keep cards only for things you can act on as a unit: a project, a pipeline deal, a KPI that links somewhere.

**Done when** no card sits directly inside another card, and profile and detail views use one definition-list component.

### D7 (P1). Header noise

**Evidence.** "Viewing as Super Admin" (≈200px) sits in the header for every owner on every page, next to search, theme, bell and profile.

**Fix.** Move role preview into the profile menu ("Preview as… ▸"). Only show a header banner *while* previewing ("Previewing as HR · Exit"). Move the theme toggle into the profile menu too. The header then holds breadcrumbs, search, notifications and avatar, like Linear and Vercel.

**Done when** the header has at most four elements on the right outside preview mode.

### D8 (P1). Brand consistency between site and app

**Evidence.** The marketing site and logo use navy `#002C70`. The app's primary colour is violet (OKLCH hue 283).

**Fix.** Pick one primary for both. Recommended: a brighter, accessible derivative of the logo navy, e.g. `oklch(0.52 0.19 262)` for light mode with a lighter step for dark mode, keeping violet only as a chart colour. A customer moving from the website to signup should feel they're in the same product.

**Done when** `--primary` and `--brand` in the app match the site's primary, and the signup button is the same colour as "Get started free" on rhinontech.com.

### D9 (P1). Accessibility basics

**Evidence.** 563 uses of 10–11px text, often in muted colours (contrast risk). `focus:` is used where `focus-visible:` is meant. The status pill colours haven't been contrast-checked.

**Fix.** A 12px minimum (D3). `focus-visible` rings everywhere: 2px `--ring` with an offset, provided by the shared components (D4). Verify muted text at 4.5:1 on both themes, and status tones at 3:1 against their background. Every icon-only button gets an `aria-label`. Respect `prefers-reduced-motion` in the call overlay and Home animations.

**Done when** an axe scan of Home, Leads, Inbox, People and Settings shows no serious or critical issues, and keyboard-only navigation works through each.

### D10 (P2). Motion and feedback

**Fix.** One timing set: 120ms for hover and press, 180ms for panels and drawers, ease-out. Skeletons that match the final layout (some screens show generic bars). Optimistic updates with a toast and Undo for reversible actions (archive, stage change) instead of confirm dialogs, as Linear and Superhuman do.

### D11 (P2). Signup and first impression

**Evidence.** `signup-light.png`: a generic centred card on a gradient, a low-contrast disabled button (40% violet), and a footer note that's cut off.

**Fix.** A two-column layout at ≥1024px: the form on the left, and on the right a quiet product preview (the real Home screenshot) with three one-line benefits. Disabled buttons keep text contrast. Reduce the form to name, work email and password, and ask for company and workspace address on the next step.

---

## 5. The design system to build (tokens)

```css
/* Surfaces: flat, quiet, layered by lightness, not by blur */
--background: oklch(0.985 0.002 265);  /* app canvas */
--surface:    oklch(1 0 0);            /* panels, tables */
--surface-2:  oklch(0.97 0.003 265);   /* hover rows, inputs */
--border:     oklch(0.92 0.004 265);   /* hairlines, 1px */
--text:       oklch(0.21 0.01 265);
--text-muted: oklch(0.5 0.012 265);    /* verify 4.5:1 */

/* One accent, aligned with the logo navy (D8) */
--primary:    oklch(0.52 0.19 262);
--primary-fg: oklch(0.99 0 0);

/* Status only (dot + text by default) */
--info: oklch(0.6 0.15 250);  --success: oklch(0.62 0.14 155);
--warning: oklch(0.75 0.15 75); --danger: oklch(0.6 0.2 25);

/* Shape */
--radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px;  /* + full for avatars only */

/* Spacing: 4px base; layouts use 8 / 12 / 16 / 24 / 32 */
/* Elevation: one shadow for floating layers (menus, drawers, dialogs) and none on resting cards */
```

Glass utilities (`glass-panel`, `glass-card`…) are retired in app screens and kept for the marketing site and auth pages.

---

## 6. Plan

| Phase | Work | Effort | Visible result |
|---|---|---|---|
| 1. Foundations | Tokens (§5), type scale (D3), `Button`/`Input`/`Field`/`StatusBadge`/`PageHeader`/`EmptyState`, one icon set, lint rules (D4) | 1 week | Nothing moves yet; everything after is cheaper |
| 2. Shell | Single sidebar with inline module sections, drawers instead of fourth columns (D1), monochrome nav and flat canvas (D2), header clean-up (D7), brand colour (D8) | 1 week | The whole product immediately feels calmer and wider |
| 3. Tables | `DataTable` (D5) on Leads, People, Deals list, Tasks list, Payslips, with phone card layouts | 1–1.5 weeks | The screens people live in reach Attio-level polish |
| 4. Screens | Migrate the remaining modules to the components; remove nested cards (D6); a11y pass (D9) | 2 weeks | Consistency everywhere |
| 5. Polish | Motion and undo (D10), signup redesign (D11), screenshot-based visual review at 375, 768 and 1440px | 3–4 days | First impression and feel |

For sequencing, do Phase 2 before Phase 3. The shell change alone fixes the cramped tables on most screens, and it is what a buyer notices in the first ten seconds of a demo.

---

## 7. Screenshots referenced

All in `docs/ux-audit/`, captured 25 November 2026 from a beta-data build:

- `home-light.png`
- `inbox-light.png`
- `leads-light.png`
- `leads-dark.png`
- `leadsm-light.png` (520px wide)
- `people-light.png`
- `tasks-light.png`
- `payroll-light.png`
- `chatbot-light.png`
- `billing-light.png`
- `signup-light.png`

---

## Implementation status (2026-11-25)

| Phase | Commit | Done |
|---|---|---|
| 1. Foundations | 2e69fda | Brand primary, flat surfaces, type scale (2xs/ui), StatusBadge, PageHeader, focus-visible, reduced motion |
| 2. Shell | 48512c8 | Module pages nested in the pinned sidebar, monochrome nav, theme + role preview in profile menu |
| 3. Tables | a5b6177 | Leads: controls only on hover/focus, phone card list. Shared DataTable for other lists still to do |
| 4. Screens | 353f331 | Payroll/Tasks status tones unified, People detail as label/value rows |
| 5. Polish | 04ebf42 | Two-column signup, Undo toast on lead stage change, legible disabled buttons |
| Fix | (next) | cn() no longer drops text-ui / text-2xs |

Open: DataTable for People/Deals/Tasks/Payslips, density toggle, bulk-action bar, axe scan, module colours on Home/⌘K/breadcrumbs (kept pending a decision on how colourful the app should be).
