# MatchUp

## Current State

MatchUp is a sports matchmaking app with match listing/creation, user profiles, and a simple matching system (mutual matches). Backend is Motoko. Frontend is React + Tailwind + TypeScript.

## Requested Changes (Diff)

### Add
- Message type: `{ id: Text; from: Principal; to: Principal; text: Text; createdAt: Int }`
- `sendMessage(to: Principal, text: Text)` - stores a message; requires mutual match
- `getMessages(with: Principal)` query - returns conversation thread sorted by time
- ChatSection component: lists mutual matches, shows thread, send input
- useGetMessages and useSendMessage hooks

### Modify
- App.tsx: render ChatSection below FindPlayersSection for logged-in users
- useQueries.ts: add new hooks

### Remove
- Nothing

## Implementation Plan

1. Regenerate backend with chat message storage
2. Add frontend hooks and ChatSection component
3. Wire into App.tsx
