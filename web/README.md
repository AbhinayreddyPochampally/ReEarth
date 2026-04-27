# ReEarth 2.0 Demo — Frontend

Next.js 16 App Router application. See `docs/` at the repo root for design decisions and wave playbooks.

## Quickstart

```bash
cp .env.local.example .env.local
# fill in .env.local with Supabase and Azure keys
npm install
npm run dev
# → http://localhost:3000
```

## Key conventions

- Database access: `lib/db/` only — never import Supabase directly in components
- AI calls: `lib/ai/` only — never call Azure OpenAI/Document Intelligence in components
- Server components by default; `"use client"` only when interactivity demands it
