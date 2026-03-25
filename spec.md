# MatchUp – Production-Level Real-Time Upgrade

## Current State
- React + TypeScript frontend with Motoko/ICP backend (NOT Firebase)
- Polling every 5s via react-query `refetchInterval`
- Basic match cards with sport band
- Form with minimal validation
- No connection status indicator
- No optimistic updates
- No match sorting or sport ranking

## Requested Changes (Diff)

### Add
- Connection status indicator: green pulsing dot (online), yellow (connecting), red (offline) using navigator.onLine + query fetching state
- "Trận mới nhất" (newest match) highlight badge on the most recently created match
- Live match counter badge in section header
- Auto-sort matches by time (nearest first)
- Sport popularity ranking sidebar/widget showing most common sport
- Glassmorphism card style: backdrop-blur, semi-transparent bg, soft shadow
- Fade-in animation for new match cards
- Sticky "Tạo trận" button on mobile
- Success/error toasts already exist, ensure they work correctly

### Modify
- Form validation: validate `missing` with `Number()`, check for NaN and > 0; prevent empty sport/location/time fields; show inline errors
- Form submit button: immediately disable + show spinner + "Đang xử lý..." text on click
- After success: reset form + re-enable button
- Poll interval reduced from 5s to 3s for snappier updates
- Match cards: add dynamic sport image using `https://loremflickr.com/400/300/{sport}` (lowercase sport name)
- Card design upgrade: glassmorphism with backdrop-blur, semi-transparent bg over the sport image
- Hover effect: subtle lift + glow
- Mobile-first: large tap targets (min-h-12), spacing ≥ 12px, font ≥ 14px
- Section layout: sort matches by time ascending (soonest first)
- `useGetAllMatches` refetchInterval: 3000ms

### Remove
- Nothing removed

## Implementation Plan
1. Update `useQueries.ts`: reduce refetchInterval to 3000ms, add optimistic update for joinMatch
2. Update `App.tsx`:
   a. ConnectionStatus component: uses `useGetAllMatches().isFetching` + `navigator.onLine`
   b. Sort matches by time (new Date comparison) before rendering
   c. Tag the match with latest `createdAt` as "new"
   d. SportRanking widget showing top sport from match list
   e. LiveCounter in section header
   f. MatchCard redesign: sport image bg, glassmorphism overlay, hover glow
   g. Form validation improvements: inline error messages, Number() parsing
   h. Submit button: immediate disable + spinner state
   i. Mobile sticky create button
3. Update `index.css`: glassmorphism utility classes, glow hover, pulse animation for status dot
