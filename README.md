# Nexus — AI-Augmented Project Management Platform

> A full-stack, AI-native project management platform that unifies Kanban execution, implementation roadmaps, analytics, context-aware AI chat, an autonomous task-generation agent, and GitHub-integrated code intelligence — all powered by a shared retrieval-augmented memory over tasks, plans, and source code.

Built with **Next.js 15 · TypeScript · Supabase · Drizzle · Qdrant · LangGraph**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [AI & RAG Design](#ai--rag-design)
- [GitHub Integration](#github-integration)
- [Roles & Permissions](#roles--permissions)
- [Known Limitations](#known-limitations)
- [Further Reading](#further-reading)

---

## Overview

Modern software teams juggle three disconnected surfaces — an **issue tracker**, an **AI assistant**, and the **code repo**. Context never flows between them: AI assistants hallucinate task names, task generators produce duplicate work, and commits don't close tickets.

**Nexus** fixes this by giving its chat, its task-generation agent, and its Kanban board a **single retrieval-augmented memory** spanning the project's tasks, implementation plan, and GitHub source code — and by letting the code repository **write back** into the board through webhook-driven commit-to-task matching.

---

## Key Features

| Module | Capabilities |
| --- | --- |
| **Auth** | Supabase email/password, Google OAuth, invite-based onboarding |
| **Projects & Dashboard** | Project CRUD, role-based access, 2-step create flow (metadata → roadmap) |
| **Kanban Board** | Drag-and-drop with `@dnd-kit`, optimistic updates, task event log, realtime sync |
| **AI Chat** | Multi-provider runtime, rate limiting, RAG context over board + roadmap + code |
| **Architect Agent** | LangGraph state machine: **Planner → Critic → Finalizer** with Zod-validated output |
| **Roadmap** | AI-generated or manual markdown plans, inline section edits, per-phase regeneration, version history |
| **Insight Analytics** | Completion metrics, distribution charts, burndown, AI-generated PM narrative |
| **Team Collaboration** | Email invites, 7-day token expiry, claim-on-signup, owner/admin/member roles |
| **GitHub Integration** | OAuth repo connect, file indexing, webhook reindex, commit-to-task auto-close |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Client (Next.js App Router + Zustand stores)            │
└──────────────────────────────────────────────────────────┘
                         │ Server Actions
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Modules (src/modules/*)                                 │
│  projects · kanban · chat · agent · roadmap · insight    │
│  invites · github                                        │
└──────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────────┐
        ▼                ▼                    ▼
┌──────────────┐  ┌──────────────┐   ┌───────────────────┐
│  Drizzle ORM │  │ AI Providers │   │  Qdrant Vector DB │
│  Postgres    │  │ OpenAI/Gemini│   │  tasks · roadmap  │
│  (Supabase)  │  │   Anthropic  │   │  · code_chunks    │
└──────────────┘  └──────────────┘   └───────────────────┘
        │
        ▼
┌──────────────────────┐       ┌─────────────────────────┐
│ Supabase Realtime    │       │ GitHub OAuth + Webhook  │
│ (tasks table)        │       │ (reindex + commit match)│
└──────────────────────┘       └─────────────────────────┘
```

---

## Tech Stack

**Framework & Language**
- Next.js 15 (App Router, Server Actions)
- TypeScript (strict mode)
- React 19

**UI & State**
- Tailwind CSS 4, shadcn/ui, Radix primitives
- Framer Motion (page transitions)
- Zustand + persist middleware
- Sonner (toasts), Recharts (analytics)

**Data & Storage**
- PostgreSQL (Supabase)
- Drizzle ORM + drizzle-kit migrations
- Qdrant (vector DB, 3 collections)

**AI Runtime**
- OpenAI / Gemini / Anthropic (configurable via `AI_PROVIDER`)
- `@langchain/langgraph` for agent state machine
- Gemini `gemini-embedding-001` for embeddings (768-dim)

**Integrations**
- `@octokit/rest` for GitHub API
- Nodemailer (SMTP) for invitation emails
- Supabase SSR for auth, Supabase Realtime for live task sync

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL database (Supabase recommended)
- Qdrant instance (local Docker or Qdrant Cloud)
- At least one AI provider API key (OpenAI, Gemini, or Anthropic)
- GitHub OAuth app (optional, required for GitHub integration)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd Project-Manager
npm install

# Configure environment (see next section)
cp .env.example .env   # then fill in values

# Run migrations
npm run db:migrate

# Start dev server (or use start:all for full preflight)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the app.

### One-shot development startup

`npm run start:all` runs a preflight script that:

1. Loads `.env`
2. Checks database connectivity, Qdrant reachability, and AI key presence
3. Runs pending Drizzle migrations
4. Starts `next dev`
5. Calls `/api/rag/backfill` to sync task vectors into Qdrant

---

## Environment Variables

### Core (required)

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### AI Provider

Select a provider and fill the matching block:

**OpenAI**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Gemini (OpenAI-compatible endpoint)**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

**Anthropic**
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
```

**Common AI tuning**
```env
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=2
CHAT_RATE_LIMIT_REQUESTS=20
CHAT_RATE_LIMIT_WINDOW_MINUTES=1
```

### Vector DB (Qdrant)

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768
GEMINI_API_KEY=...   # also required for embeddings, even when AI_PROVIDER != gemini
```

### GitHub Integration (optional)

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_OAUTH_REDIRECT_URL=   # optional override
GITHUB_WEBHOOK_SECRET=...
APP_BASE_URL=https://your-app.com
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### Invite Email (optional — graceful fallback to link copy if absent)

```env
SMTP_HOST=smtp.example.com
SMTP_USER=...
SMTP_PASS=...
SMTP_PORT=587
SMTP_SECURE=false
INVITE_EMAIL_FROM=noreply@yourdomain.com
```

---

## Database & Migrations

The schema lives in [src/core/db/schema.ts](src/core/db/schema.ts) and is version-controlled via Drizzle migrations in [drizzle/](drizzle/).

- **13 tables**: users, projects, project_members, project_invitations, tasks, task_events, chat_messages, chat_message_metrics, chat_rate_limits, agent_generations, implementation_plans, github_connections, github_indexed_files
- **7 migrations** (0000 core → 0007 invitations)

```bash
npm run db:generate   # generate a new migration from schema changes
npm run db:migrate    # apply pending migrations
npm run db:studio     # open Drizzle Studio GUI
```

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (platform)/             # Protected routes (dashboard, projects/*)
│   ├── sign-in · sign-up       # Auth pages
│   ├── invite/[token]          # Public invite acceptance
│   └── api/                    # Route handlers (health, rag, github, webhooks)
├── modules/                    # Feature modules (actions + components + hooks)
│   ├── projects · kanban
│   ├── chat · agent · architect
│   ├── roadmap · insight
│   ├── invites · github
├── core/
│   ├── db/                     # Drizzle schema, client, query layer
│   ├── auth/                   # Role helpers (hasRole, requireRole)
│   └── ai/                     # Provider abstraction, chat, embeddings
├── lib/                        # Supabase clients, utilities, realtime mappers
└── stores/                     # Zustand stores (projects, tasks, chat, ui)
drizzle/                        # SQL migrations + snapshots
scripts/                        # start-all.mjs preflight script
```

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run start:all` | Preflight + migrate + dev + RAG backfill |

---

## AI & RAG Design

**Three Qdrant collections**, each with domain-specific payload indexes:

| Collection | Payload indexes | Source |
| --- | --- | --- |
| `tasks` | `project_id`, `status`, `priority` | Task title + description + tags |
| `roadmap` | `project_id`, `phase`, `section_type`, `version` | Parsed plan sections |
| `code_chunks` | `project_id`, `filepath`, `language` | 150-line chunks with 20-line overlap |

**Embeddings**: Gemini `gemini-embedding-001` via native `embedContent` endpoint (see [src/core/ai/embedding.ts](src/core/ai/embedding.ts)).

**Chat context assembly** (per message):
1. Full board snapshot (all tasks grouped by status)
2. Top-k relevant roadmap sections
3. Top-k relevant code chunks
4. Injected into system prompt → OpenAI-compatible `/chat/completions`
5. Response + telemetry persisted to `chat_message_metrics`

**Architect Agent** ([src/modules/architect/graph.ts](src/modules/architect/graph.ts)):
- Retrieves top-15 tasks, top-6 code chunks, active plan
- Graph nodes: **Planner → Critic → (revision loop, max 2 iterations) → Finalizer**
- Output strictly validated by Zod schema before persistence

---

## GitHub Integration

**OAuth flow**: `/api/auth/github/start` → GitHub authorize → `/api/auth/github/callback` → token saved in `github_connections`.

**Indexing pipeline**:
- Fetch repo tree from default branch
- Filter files (allowlist + size/directory constraints)
- Chunk line-wise (150 lines, 20 overlap)
- Embed and upsert into `code_chunks` collection
- Record per-file SHA in `github_indexed_files` for incremental sync

**Webhook flow** (`POST /api/webhooks/github`):
- HMAC SHA256 signature verification
- Handle `push` events only
- Heavy work deferred via Next.js `after()`:
  - Reindex changed/added files
  - Remove deleted files from vector + index tables
  - Run **commit-to-task matcher**: sends commit message + changed files + open tasks to LLM, expects strict JSON `{taskIds: []}`, validates returned IDs against open task set before applying updates

---

## Roles & Permissions

**Role hierarchy**: `owner > admin > member`

**Enforcement helpers** ([src/core/auth](src/core/auth)):
- `getMembership(userId, projectId)`
- `hasRole(actualRole, minimumRole)`
- `requireRole(userId, projectId, minimumRole)`

Enforced across projects, kanban, chat, agent, and invites actions. See [Known Limitations](#known-limitations) for current gaps.

---

## Known Limitations

- **Authorization gaps**: roadmap, insight, and github actions currently check only authentication, not membership/role. `getTaskEvents` lacks auth guard.
- **Build policy**: `next.config.ts` ignores TypeScript and ESLint build errors.
- **No profile module**: `src/modules/profile` and `/profile` route are empty.
- **No automated tests**: test suite not yet in repository.
- **Anthropic provider**: configurable in env mapping but marked not-ready in provider readiness logic.
- **Realtime dedupe**: `tasks-store` `addTask` may receive both local optimistic insert and realtime INSERT for the same task without explicit dedupe.
- **Auth callback fallback**: `/auth/callback` redirects failures to `/auth/auth-code-error`, which is not currently present in app routes.

---

## Further Reading

- [Project_details/implementation.md](Project_details/implementation.md) — full end-to-end technical reference
- [Project_details/progress.md](Project_details/progress.md) — code-synced progress snapshot
- [presentation.md](presentation.md) — 15-slide technical presentation

---

## License

Private / internal project.
