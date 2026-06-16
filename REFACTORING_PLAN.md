# JU Activity Hub — Frontend Refactoring Plan

**Goal:** Clean, readable, well-documented, and maintainable code.

**Status:** Proposed — estimated 5–6.5 hours total.

---

## ✅ Phase 1: Break Down `ChatRoomPage.tsx` (1213 → ~250 lines)

**Problem:** Single component with 33+ state variables, 8 refs, 186-line inline render function.

| Step | Action | File(s) | Est. |
|------|--------|---------|------|
| 1.1 | Extract `WaveformVisualizer` to separate component | `src/components/chat/WaveformVisualizer.tsx` | 15m |
| 1.2 | Extract `MessageBubble` component (the `renderMessage` function) | `src/components/chat/MessageBubble.tsx` | 30m |
| 1.3 | Extract `ChatHeader` (channel header JSX) | `src/components/chat/ChatHeader.tsx` | 10m |
| 1.4 | Extract `ChatInput` (input area + reply preview + emoji picker + recording) | `src/components/chat/ChatInput.tsx` | 20m |
| 1.5 | Extract `MembersPanel` (slide-out members panel) | `src/components/chat/MembersPanel.tsx` | 10m |
| 1.6 | Create shared types file for `ChatMessage`, `Member`, `ReactionEntry` | `src/types/chat.ts` | 10m |
| 1.7 | Replace empty `catch {}` with toast notifications | `ChatRoomPage.tsx` + new components | 15m |

**Result:** `ChatRoomPage.tsx` reduced to ~250 lines — orchestrator that imports sub-components.

---

## Phase 2: Split `DashboardLayout.tsx` (875 → ~350 lines)

**Problem:** Contains inline chat widget (~300 lines), duplicate sidebar nav (~55 lines duplicated), hardcoded mock data.

| Step | Action | File(s) | Est. |
|------|--------|---------|------|
| 2.1 | Extract inline chat widget into `CommunicationsHub.tsx` | `src/components/chat/CommunicationsHub.tsx` | 30m |
| 2.2 | Extract sidebar navigation into reusable `SidebarNav.tsx` | `src/components/layout/SidebarNav.tsx` | 20m |
| 2.3 | Remove unused imports (`Textarea`, `SheetTrigger`) | `DashboardLayout.tsx` | 5m |
| 2.4 | Remove hardcoded mock responses and `frostedControlClasses` | `DashboardLayout.tsx` | 5m |

**Result:** `DashboardLayout.tsx` reduced to ~350 lines — layout shell only.

---

## Phase 3: Type the API Layer

**Problem:** `api.ts` returns `any` for every endpoint — no type safety.

| Step | Action | File(s) | Est. |
|------|--------|---------|------|
| 3.1 | Create `src/types/api.ts` with response types for all endpoints | `src/types/api.ts` | 30m |
| 3.2 | Update `api.ts` to use generic response types instead of `any` | `src/lib/api.ts` | 20m |
| 3.3 | Move `ChatMessage`, `Member`, `ReactionEntry` to shared types | `src/types/chat.ts` | 10m |

**Result:** Full end-to-end type safety from API response → component props.

---

## Phase 4: Consolidate Utilities

**Problem:** `formatTime` and `formatDateLabel` duplicated across 3+ files. Emoji lists hardcoded inline.

| Step | Action | File(s) | Est. |
|------|--------|---------|------|
| 4.1 | Create `src/lib/format.ts` with shared `formatTime`, `formatDateLabel` | `src/lib/format.ts` | 10m |
| 4.2 | Remove duplicate implementations from `ChatRoomPage`, `ChatListPage`, `DashboardLayout` | 3 files | 10m |
| 4.3 | Create `src/constants/emojis.ts` for emoji lists (quick reactions + picker) | `src/constants/emojis.ts` | 10m |

**Result:** Single source of truth for formatting and constants.

---

## Phase 5: Error Handling & SPA Routing

**Problem:** 21 `console.error` calls, 7 empty `catch {}`, hard `window.location.href` redirects.

| Step | Action | File(s) | Est. |
|------|--------|---------|------|
| 5.1 | Replace `window.location.href` with React Router `navigate()` | `AuthContext.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx` | 15m |
| 5.2 | Replace `console.error` with toast notifications via `useToast` | All 11 files with console.error | 30m |

**Result:** Professional error handling with user-visible feedback.

---

## Phase 6: Documentation

**Problem:** Almost zero JSDoc or inline documentation across the codebase.

| Step | Action | File(s) | Est. |
|------|--------|---------|------|
| 6.1 | Add JSDoc comments to `api.ts`, contexts, key components | `api.ts`, `AuthContext.tsx`, `ActivityContext.tsx`, `ChatRoomPage.tsx` | 30m |

**Result:** Developers can understand the purpose, parameters, and return values of every public API and context method.

---

## Summary

| Phase | Area | Current Size | Target Size | Time |
|-------|------|-------------|-------------|------|
| 1 | ChatRoomPage | 1213 lines | ~250 lines | 1.5h |
| 2 | DashboardLayout | 875 lines | ~350 lines | 1h |
| 3 | API types | `any` everywhere | Fully typed | 1h |
| 4 | Utilities | 3× duplication | Single source | 30m |
| 5 | Error handling | 21 console.error | Toast-based | 45m |
| 6 | Documentation | Near zero | Key files documented | 30m |
| **Total** | | | | **5–6.5h** |

---

## File Tree After Refactoring

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx         ← extracted
│   │   ├── ChatInput.tsx          ← extracted
│   │   ├── CommunicationsHub.tsx  ← extracted from DashboardLayout
│   │   ├── MembersPanel.tsx       ← extracted
│   │   ├── MessageBubble.tsx      ← extracted
│   │   └── WaveformVisualizer.tsx ← extracted
│   ├── layout/
│   │   ├── DashboardLayout.tsx    ← slimmed down
│   │   └── SidebarNav.tsx         ← extracted
│   └── ...
├── constants/
│   └── emojis.ts                  ← new
├── lib/
│   ├── api.ts                     ← fully typed
│   ├── format.ts                  ← new
│   └── utils.ts
├── types/
│   ├── api.ts                     ← new
│   └── chat.ts                    ← new
└── pages/
    └── chat/
        ├── ChatRoomPage.tsx       ← slimmed down
        └── ChatListPage.tsx
```
