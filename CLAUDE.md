# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + production build
npm run lint       # ESLint with TypeScript + React Hooks rules
npm run preview    # Preview production build
```

No test suite is configured — lint is the only automated quality check.

## Stack

- **React 19** + **TypeScript 5** (strict mode, no `any`)
- **Vite 8** + **TailwindCSS 4** (class-based dark mode via `theme-dark` on root)
- **Firebase 12**: Auth (Google OAuth + email), Firestore (real-time via `onSnapshot`)
- **React Router 7** (client-side routing with outlet context pattern)
- **Zustand** is installed but not used — avoid adding it

## Architecture

### Data Flow

```
main.tsx (AuthProvider)
  └── AppRoutes.tsx
        ├── PublicOnly → Login.tsx
        └── RequireAuth → AppLayout.tsx (outlet context provider)
              └── Pages (receive workspaces, catalog, handlers via outlet context)
```

All persistent data lives in Firestore under `/users/{uid}/`:
- `tasks` — user tasks
- `workspaces` — workspace list
- `responsaveis` — people catalog (workspace-scoped)
- `locais` — locations catalog (workspace-scoped)

### Key Hooks

- [useAuth.tsx](src/hooks/useAuth.tsx) — Firebase Auth context; always wrap reads with this
- [useTasks.ts](src/hooks/useTasks.ts) — Real-time task CRUD, normalization, and subtask logic (~500 lines)
- [useWorkspaces.ts](src/hooks/useWorkspaces.ts) — Workspace CRUD with auto-recovery from tasks
- [useCatalog.ts](src/hooks/useCatalog.ts) — Generic hook for responsáveis and locais

### Layout Context Pattern

[AppLayout.tsx](src/layouts/AppLayout.tsx) passes data down to all child pages via React Router's `useOutletContext`. Pages call `useOutletContext<OutletContextType>()` instead of calling hooks directly.

### Task Model (SMART structure, Portuguese field names)

```typescript
// src/types/task.ts
oQue, porQue, detalhamento, onde, quando, quem, como, quantoCusta
status: 'pending' | 'todo' | 'doing' | 'done'
```

Task `status` is derived from subtask completion via `deriveTaskStatusFromSubtasks()` in [taskProgress.ts](src/utils/taskProgress.ts).

### Legacy Migration

`useTasks` auto-migrates old localStorage data to Firestore on first login. The code handles both old SMART field names (`specific`, `measurable`) and current Portuguese names. Avoid removing normalization logic — it's load-bearing for existing users.

### Workspace Scoping

Default workspace ID is `''` (empty string). Legacy IDs `workspace-work` and `workspace-personal` are also handled. Catalogs (responsáveis, locais) are scoped per workspace.

## Conventions

- **Language**: UI strings, comments, and variable names are Portuguese (pt-BR)
- **Firestore reads**: Always use `onSnapshot` (real-time), not `getDocs`
- **Normalization**: Pass new tasks through `normalizeTask()` before saving
- **Firebase config**: Read from `VITE_FIREBASE_*` env vars — see `.env.example`
