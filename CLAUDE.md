# Ink Flow Manager

Tattoo studio management PWA SaaS. Solo founder project.

## Stack
- React 18 + TypeScript + Vite (PWA with workbox)
- Dexie.js (IndexedDB, currently at v14)
- React Router v6
- Express server (Stripe Connect payments)
- 7 languages (EN/ZH/ES/PT/FR/DE/JP)

## Key rules
- Everything prioritized for tattoo artist convenience (一切以纹身师便利为主)
- Work in D:\ink-flow-manager, never C:\Users\snow3
- Run `npx tsc --noEmit` before committing
- Git proxy: http://127.0.0.1:10808 (v2rayN)
- No comments unless the WHY is non-obvious
- No emojis unless user asks

## Architecture
- `src/db.ts` — Dexie DB schema, migrations, all Table types
- `src/pages/` — one page per route
- `src/lib/` — business logic (no React)
- `src/components/` — shared UI components
- `server/` — Express backend
