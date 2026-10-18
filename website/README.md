# Effica site (Next.js + TypeScript)

Hand-rebuilt from the original Framer export (kept in `_original/`, git-ignored). No Framer runtime.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

- `lib/content.ts` — all copy, links and image paths. Rebrand here. In strings, `*text*` = full-ink, `_text_` = muted.
- `components/sections/*` — one component + CSS module per page section, in page order (see `app/page.tsx`).
- `components/layout/*` — fixed header/menu (blend-mode `difference`) and footer.
- `components/ui/*` — shared primitives: `SplitText` (word rise-in), `ScrollText` (scroll-linked letter ink-in),
  `Reveal` / `CurtainImage` (entrances), `CountUp`, `RollText` (hover letter roll), buttons, grid lines, icons.
- `lib/motion.ts` — shared easings/springs. Animations use `motion`; smooth scrolling uses `lenis`.
