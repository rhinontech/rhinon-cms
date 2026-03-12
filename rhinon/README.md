# Rhinon CMS

Rhinon is a **Private CMS + Outbound Sales Engine** for internal operations teams.

## What is implemented
A complete, runnable Next.js admin dashboard shell with premium styling and high-density workflows:

- Collapsible-style left navigation with core modules
- Top command/search bar (`⌘K`) and contextual action controls
- KPI metric cards and performance chart section
- Recent activity feed
- Lead management datatable
- Campaign orchestration progress cards
- Template builder preview with AI prompt and variable chips

## Tech Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide icons
- Zustand (included for future global state workflows)

## Run locally
```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Project structure
```
rhinon/
  app/
    components/dashboard.tsx
    lib/data.ts
    globals.css
    layout.tsx
    page.tsx
  package.json
  tailwind.config.ts
  next.config.ts
  tsconfig.json
```
