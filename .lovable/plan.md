

# Premium iOS-Style UI Redesign

This plan covers a visual-only overhaul of the app's layout, styling, and animations. Zero changes to business logic, hooks, queries, or data structures.

## Files to Modify

### 1. `src/index.css` — Design System Overhaul
- Refine CSS variables for deeper dark theme (#020617 base)
- Enhance glassmorphism utilities (`.glass-card` with stronger blur, softer borders)
- Add new utility classes: `.glass-pill`, `.glass-nav`, `.glass-stat`
- Improve scrollbar styling for dark theme
- Add smooth keyframe animations: card lift, fade-in stagger, progress shimmer
- Bottom nav safe area improvements

### 2. `src/components/AppLayout.tsx` — Shell Redesign
- Deep gradient background (`from-[#020617] via-[#020617] to-[#022c22]`)
- Remove zinc-500/600/700 backgrounds, replace with transparent/dark gradient
- Header: glass blur bar with avatar (left), logo center, search + notifications (right)
- User greeting pulled from `useAuth().profile`
- Add category pill navigation (All / Planerade / Pågående / Klart) — purely visual filter state in Dashboard
- Remove border-zinc colors, use `border-white/5`
- Main content area: transparent background, remove max-w-md constraint on desktop
- Bottom nav wrapper: remove bg-white, let BottomNav handle its own styling

### 3. `src/pages/Dashboard.tsx` — Premium Dashboard
- Remove outer `bg-zinc-800` wrapper, use transparent with space-y-6
- **Header section**: Large greeting "Hej {userName}" with date subtitle, avatar on left
- **Category pills**: Horizontal scrollable filter pills (All/Planerade/Pågående/Klart) with active glow state — filters `todayJobs` display only (no logic change)
- **Map section**: Full-width large glass card with rounded-2xl, overflow-hidden, subtle border glow. Same `DashboardWorkerMap` component, just wrapped in premium container
- **Job cards**: Redesigned with glass morphism, horizontal layout (info left, status badge right), subtle press feedback via `active:scale-[0.98]`, status dot indicator with color coding
- **Stats grid**: 2-col grid with glass stat cards, each with icon in glowing circle, label, large value. Subtle gradient overlay
- **Week strip**: Horizontal scroll with glass pill cards, today highlighted with primary glow ring
- **Progress bar**: Wider, with shimmer animation on fill, percentage label
- All text: `text-white`, `text-white/60`, `text-white/40` hierarchy instead of zinc

### 4. `src/components/BottomNav.tsx` — Floating iOS Navigation
- 5 tabs: Home, Calendar (Planning), Map (Route), Chat, Settings (Admin)
- Floating pill shape: `rounded-2xl`, `backdrop-blur-2xl`, `bg-white/[0.06]`, `border border-white/10`
- Bottom safe area padding with `pb-[env(safe-area-inset-bottom)]`
- Active tab: emerald glow dot under icon, icon color `text-emerald-400`
- Inactive: `text-white/30`
- Subtle shadow: `shadow-[0_-8px_32px_rgba(0,0,0,0.4)]`
- Smooth transition on active state

### 5. `src/components/DashboardWorkerMap.tsx` — Map Styling Only
- Container: `rounded-2xl` instead of `rounded-xl`
- Height increase: `h-[320px]`
- Glass border: `border border-white/10`
- Darker filter for map tiles
- No changes to Leaflet logic, markers, or data handling

### 6. `src/components/AppSidebar.tsx` — Dark Sidebar
- Background: deep dark gradient matching app theme
- Menu items: glass hover states, emerald active indicator
- Header: dark styled with logo
- Text: white/muted hierarchy

### 7. `src/components/NotificationBell.tsx` — Styling Only
- Glass circular button background
- Popover: dark glass theme matching app
- No logic changes

## Technical Approach
- All changes are className/style prop modifications
- Filter pills in Dashboard use local `useState` only — no data logic changes
- `useAuth().profile.fullName` already available for greeting
- No new dependencies needed
- Existing Tailwind config + CSS variables provide the foundation

## Key Constraints
- All Supabase queries, hooks, callbacks, data transforms remain untouched
- `loadJobs`, `loadHours`, `mapJobs` memo, `weekDays` computation — zero changes
- Component props and interfaces unchanged
- Route definitions unchanged

