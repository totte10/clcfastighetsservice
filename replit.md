# CLC Fastighetsservice – Field Service Manager

## Overview
A React + Vite PWA for CLC Fastighetsservice. AI-powered field service management covering projects, job planning, maps, route optimization, time tracking, payroll, real-time chat, and voice channels.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- **Maps**: Google Maps API + Leaflet
- **Voice**: LiveKit (via Supabase Edge Function token generation)
- **AI**: Gemini 2.5 Flash via Supabase Edge Function `ai-chat`
- **PWA**: vite-plugin-pwa

## Architecture
This is a **frontend-only SPA** that communicates directly with Supabase.

- All database queries go through the Supabase JS client (`src/integrations/supabase/client.ts`)
- Auth is handled via Supabase Auth (username+password login using `username@app.internal` email pattern)
- Google OAuth is handled via Supabase's native OAuth (configured in Supabase dashboard)
- Admin operations (user management) go through Supabase Edge Functions in `supabase/functions/admin-users/`
- AI chat streams through Supabase Edge Function `supabase/functions/ai-chat/`
- LiveKit tokens generated via `supabase/functions/livekit-token/`

## Key Files
- `src/App.tsx` — routing and auth guards
- `src/hooks/useAuth.tsx` — authentication context
- `src/integrations/supabase/client.ts` — Supabase client
- `src/integrations/lovable/index.ts` — OAuth wrapper (uses Supabase native OAuth)
- `src/lib/store.ts` — Supabase data access helpers
- `src/services/aiAssistant.ts` — AI streaming service

## Environment Variables (Replit shared env)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID
- `VITE_GOOGLE_MAPS_KEY` — Google Maps API key
- `VITE_GEMINI_API_KEY` — Gemini API key

## Running
```
npm run dev   # dev server on port 5000
npm run build # production build to dist/
```

## Deployment
Deployed as a **static site** on Replit. Build output goes to `dist/`.

## Notes
- The Supabase Edge Functions remain deployed on Supabase (not migrated to Replit)
- User accounts use `username@app.internal` as the internal email format
- Admin role is assigned via the `user_roles` table
