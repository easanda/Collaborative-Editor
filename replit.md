# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a real-time collaborative Markdown editor built with React + Vite (frontend) and Express + Socket.io (backend).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **WebSockets**: Socket.io (server + client)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite, react-markdown, remark-gfm
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express + Socket.io API server
│   └── markdown-editor/    # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Features

- Real-time collaborative Markdown editing via Socket.io
- Split-pane editor (Markdown source + live rendered preview)
- Document list sidebar with create/delete/search
- Auto-save to database (debounced, 2s after typing stops)
- Connected users indicator with colored avatars
- "Save to GitHub Gist" button (requires GITHUB_TOKEN secret)
- Strictly typed Socket.io events via shared types

## Socket.io Events

The server socket is at `/api/socket.io`. Typed events (see `artifacts/api-server/src/types.ts`):
- `join-document` (C→S): Join a document room
- `leave-document` (C→S): Leave a document room
- `text-update` (both): Broadcast text changes to all room members
- `title-update` (both): Broadcast title changes
- `user-joined` (S→C): Notify when a user joins
- `user-left` (S→C): Notify when a user leaves
- `document-users` (S→C): Current list of active users in a room

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `GITHUB_TOKEN` — GitHub Personal Access Token with `gist` scope (user-provided, optional)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

Root commands:
- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 + Socket.io API server. Routes in `src/routes/`. Socket.io server with room management for collaborative editing.

- Shared types: `src/types.ts` — ServerToClientEvents, ClientToServerEvents, ActiveUser
- Routes: health, documents (CRUD), github (save to Gist)
- Socket: manages document rooms, broadcasts text-update/title-update/user events

### `artifacts/markdown-editor` (`@workspace/markdown-editor`)

React + Vite frontend.

- `src/hooks/use-socket.ts` — Socket.io client hook
- `src/components/editor/` — toolbar + GitHub save dialog
- `src/components/layout/sidebar.tsx` — document list sidebar
- `src/pages/document-view.tsx` — split-pane editor + preview

### `lib/db` (`@workspace/db`)

- `src/schema/documents.ts` — documents table (id, title, content, createdAt, updatedAt)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec with endpoints: healthz, /documents (CRUD), /github/save

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
