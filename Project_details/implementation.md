# Project Nexus - End-to-End Implementation Document

Date: 19 April 2026
Repository root: Nexus

## 1. Purpose of This Document

This document captures the implemented state of Project Nexus directly from the current codebase. It is written as a full technical reference for report preparation.

It covers:
- architecture and design decisions
- routing and module responsibilities
- database schema and migration history
- auth and permission model
- AI and RAG internals
- GitHub integration internals
- environment and operational setup
- current limitations and next evolution points

## 2. Product Scope

Project Nexus is an AI-augmented project management platform that combines:
- project/workspace management
- kanban task execution
- contextual AI chat
- AI architect task decomposition
- implementation roadmap generation and maintenance
- analytics with AI narrative insights
- team collaboration via invitations and role-based access
- GitHub integration with code indexing and webhook reconciliation

The platform is implemented as a Next.js full-stack app using server actions and API routes.

## 3. High-Level Architecture

### 3.1 Core stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode enabled)
- UI: Tailwind CSS 4, shadcn/ui, Radix, Framer Motion
- State management: Zustand (+ persist middleware)
- Database: PostgreSQL (Supabase), Drizzle ORM
- Vector store: Qdrant
- AI runtime:
  - chat and tool prompts via OpenAI-compatible chat completion endpoints
  - embeddings via Gemini native embedding endpoint
  - architect pipeline via LangGraph state machine
- Authentication: Supabase SSR/Auth

### 3.2 Runtime architecture (logical)

1. Client UI (App Router pages + module components) calls server actions.
2. Server actions perform auth/role checks (where applied), then query/mutate Postgres through Drizzle query modules.
3. AI-dependent actions call provider endpoints for completion/embedding.
4. RAG sync writes vectors into Qdrant collections.
5. GitHub webhooks trigger reindex + commit-to-task matching in deferred background work.

### 3.3 Layered code organization

- src/app: route entrypoints, route groups, API routes
- src/modules: domain feature modules (actions, hooks, components, module libs)
- src/core:
  - db: schema, client, query layer
  - auth: auth and role helpers
  - ai: provider selection, chat and embedding runtime
- src/lib: shared utilities (supabase clients, hooks, realtime mappers, class utilities)
- src/stores: Zustand stores
- drizzle: SQL migrations and snapshots

## 4. Route and Surface Map

### 4.1 Page routes

Public and auth routes:
- /
- /sign-in
- /sign-up
- /invite/[token]
- /auth/callback

Protected platform routes:
- /dashboard
- /projects/[projectId]/board
- /projects/[projectId]/roadmap
- /projects/[projectId]/chat
- /projects/[projectId]/agent
- /projects/[projectId]/insight
- /projects/[projectId]/code
- /projects/[projectId]/settings

### 4.2 API routes

- GET /api/health
- GET /api/rag/backfill
- GET /api/auth/github/start
- GET /api/auth/github/callback
- POST /api/webhooks/github

## 5. Database Design

Schema source: src/core/db/schema.ts

### 5.1 Enums

- task_status: backlog, todo, in_progress, done
- task_priority: low, medium, high
- event_type: created, updated, status_changed, assigned, deleted
- member_role: owner, admin, member
- chat_role: user, assistant
- invitation_status: pending, accepted, revoked, expired

### 5.2 Tables (13 total)

1) users
- id (pk)
- email (unique)
- name
- avatar_url
- created_at

2) projects
- id (pk)
- name
- description
- owner_id (fk -> users)
- tech_stack (jsonb string[])
- architectural_guidelines (text)
- created_at
- updated_at

3) project_members
- id (pk)
- project_id (fk -> projects, cascade delete)
- user_id (fk -> users, cascade delete)
- role (member_role enum)
- joined_at

4) project_invitations
- id (pk)
- project_id (fk -> projects, cascade delete)
- invited_email
- invited_by_user_id (fk -> users, set null)
- role (member_role enum)
- token (unique)
- status (invitation_status enum)
- expires_at
- created_at
- accepted_at

5) tasks
- id (pk)
- project_id (fk -> projects, cascade delete)
- title
- description
- status (task_status enum)
- priority (task_priority enum)
- assignee_id (fk -> users, set null)
- created_at
- updated_at
- tags (jsonb string[])
- ai_metadata (jsonb object)
- ai_generated (boolean)
- story_points (int)

6) task_events
- id (pk)
- task_id (fk -> tasks, cascade delete)
- event_type (event_type enum)
- old_value
- new_value
- user_id (fk -> users, set null)
- timestamp

7) chat_messages
- id (pk)
- project_id (fk -> projects, cascade delete)
- user_id (fk -> users, set null)
- role (chat_role enum)
- content
- created_at

8) chat_message_metrics
- message_id (pk, fk -> chat_messages, cascade delete)
- provider
- model
- prompt
- response
- latency_ms
- prompt_tokens
- completion_tokens
- total_tokens
- retry_count
- error_status
- error_message
- created_at

9) chat_rate_limits
- user_id (fk -> users, cascade delete)
- project_id (fk -> projects, cascade delete)
- window_key
- request_count
- updated_at
- composite pk (user_id, project_id, window_key)

10) agent_generations
- id (pk)
- project_id (fk -> projects, cascade delete)
- user_id (fk -> users, set null)
- requirement
- generated_tasks (jsonb)
- reasoning
- accepted_count
- created_at

11) implementation_plans
- id (pk)
- project_id (fk -> projects, cascade delete)
- version
- content
- sections (jsonb PlanSection[])
- source
- is_active
- created_by (fk -> users, set null)
- created_at
- updated_at

12) github_connections
- id (pk)
- project_id (unique fk -> projects, cascade delete)
- user_id (fk -> users, cascade delete)
- github_user_login
- access_token
- repo_owner
- repo_name
- repo_full_name
- default_branch
- webhook_id
- last_indexed_sha
- last_indexed_at
- created_at
- updated_at

13) github_indexed_files
- id (pk)
- project_id (fk -> projects, cascade delete)
- filepath
- sha
- chunk_count
- indexed_at

### 5.3 Migration sequence

- 0000_wandering_blob.sql: initial core schema
- 0001_chat_ai_metrics.sql: chat telemetry + rate limit
- 0002_acoustic_ezekiel_stane.sql: tasks AI metadata columns + repeated metric/rate tables in this migration file
- 0003_even_zaladane.sql: projects tech_stack and architectural_guidelines
- 0004_outstanding_pixie.sql: implementation_plans
- 0005_daily_thunderbolts.sql: github integration tables
- 0006_realtime_tasks.sql: tasks REPLICA IDENTITY FULL + publication to supabase_realtime
- 0007_project_invitations.sql: invitation enum/table/indexes

## 6. Authentication and Session Model

### 6.1 Auth provider and session transport

- Supabase SSR clients are used for browser, server, and middleware contexts.
- Session refresh and route redirects happen in src/lib/supabase/middleware.ts.

Current middleware behavior:
- signed-in users are redirected away from / and auth pages to /dashboard
- unauthenticated users trying /dashboard or /projects/* are redirected to /sign-in

### 6.2 Auth flows

- Email/password login: signInWithPassword
- Signup: signUp + sync to public users table + claimPendingInvitations
- Google OAuth login: signInWithOAuth(provider=google)
- callback route exchanges code for session and redirects to next

Safe redirect behavior:
- next values must start with / and not //
- invalid next falls back to /dashboard

## 7. Authorization and Role Model

Role hierarchy:
- owner > admin > member

Permission helper:
- getMembership(userId, projectId)
- hasRole(actualRole, minimumRole)
- requireRole(userId, projectId, minimumRole)

Current enforcement coverage:

Enforced with requireRole:
- projects actions (member/admin/owner by operation)
- kanban actions (member for read/write, admin for delete)
- chat actions (member for send/load, admin for clear)
- agent actions (member)
- invites actions (member/admin based)

Authenticated but not role-enforced (important hardening gap):
- roadmap actions
- insight actions
- github actions

Additional gap:
- getTaskEvents in kanban actions currently does not enforce auth/role before returning event history.

## 8. Feature Implementation Details

### 8.1 Dashboard and project lifecycle

Implemented in:
- src/app/(platform)/dashboard/page.tsx
- src/modules/projects/actions.ts
- src/modules/projects/components/create-project-dialog.tsx

Key behavior:
- Dashboard shows all projects where user is a member.
- Create Project dialog is a 2-step mandatory workflow:
  1) create project metadata
  2) create roadmap (AI generate or manual authoring)
- On project creation:
  - project row inserted
  - creator auto-added as owner member
  - currentProjectId set in Zustand

### 8.2 Kanban board

Implemented in:
- src/modules/kanban/actions.ts
- src/modules/kanban/components/*
- src/modules/kanban/hooks/use-tasks.ts

Capabilities:
- DnD with @dnd-kit (pointer + keyboard sensors)
- optimistic status movement with rollback
- create/update/delete/move tasks via server actions
- task modal with edit and timeline view
- event logging for every major task mutation

Task-event model:
- created, updated, status_changed, deleted entries persisted in task_events.

Realtime integration:
- useRealtimeTasks subscribes to postgres_changes on tasks filtered by project_id
- board wires useRealtimeTasks(projectId)
- row mapper converts snake_case realtime rows into Task client shape

### 8.3 AI chat

Implemented in:
- src/modules/chat/actions.ts
- src/core/ai/chat.ts
- src/core/ai/models.ts
- src/modules/chat/components/*

Message lifecycle:
1) user message saved in chat_messages
2) rate-limit window consumed from chat_rate_limits
3) prompt context assembled from:
   - full project board snapshot (all tasks grouped by status)
   - relevant roadmap sections (roadmap RAG)
   - relevant code chunks (code RAG)
4) provider completion request executed
5) assistant message persisted
6) telemetry persisted to chat_message_metrics

Provider behavior:
- AI_PROVIDER chooses openai/gemini/anthropic config path
- retries for transient HTTP/runtime failures
- configurable timeout and retry count

Important implementation note:
- provider requests use an OpenAI-compatible /chat/completions call path.

### 8.4 Architect agent (task generation)

Implemented in:
- src/modules/agent/actions.ts
- src/modules/architect/graph.ts
- src/modules/architect/prompts.ts
- src/modules/architect/schemas.ts

Flow:
1) collect requirement and project context
2) retrieve relevant tasks (topK=15)
3) retrieve relevant code chunks (topK=6)
4) load active implementation plan content
5) run LangGraph state machine:
   - Planner node
   - Critic node
   - conditional loop to Planner when critique says needs_revision and iteration < 2
   - Finalizer node
6) save generation in agent_generations
7) user can accept generated tasks in bulk
8) accepted tasks persist with aiGenerated=true and aiMetadata source stamp

Output typing:
- Zod schemas enforce strict task output (title, description, priority, story points, tags).

### 8.5 Implementation roadmap

Implemented in:
- src/modules/roadmap/actions.ts
- src/modules/roadmap/plan-generator.ts
- src/modules/roadmap/plan-parser.ts
- src/modules/roadmap/components/*

Capabilities:
- fetch active plan
- fetch version history
- generate full plan with AI
- upload manual markdown plan
- update full plan (new version)
- update single section inline
- regenerate single phase with AI

Plan representation:
- content stores original markdown
- sections stores parsed structured sections:
  - overview/goals/tasks/deliverables
  - phase number and phase title
  - textual content + bullet item list

Versioning behavior:
- creating/updating plan deactivates previous active plan
- next version number increments
- old versions are pruned to keep at most 10

### 8.6 Insight analytics and narratives

Implemented in:
- src/modules/insight/actions.ts
- src/core/db/queries/analytics.ts
- src/modules/insight/components/*
- src/modules/insight/lib/format-analytics-prompt.ts

Metrics pipeline:
- project metrics: total/completed/in-progress/completion rate/trend
- distribution by status
- breakdown by priority
- member performance metrics
- burndown reconstruction from task_events

Narrative generation:
- analytics data formatted into a PM-style prompt
- LLM generates a concise markdown narrative
- shown in NarrativePanel with regenerate support

### 8.7 Team collaboration and invitations

Implemented in:
- src/modules/invites/actions.ts
- src/modules/invites/email.ts
- src/modules/invites/components/members-section.tsx
- src/core/db/queries/invites.ts
- src/app/invite/[token]/page.tsx

Features:
- invite by email with role (member/admin)
- pending invite listing and revoke
- member listing and removal
- invitation token acceptance with 7-day expiry
- signed-out users are routed through sign-in/sign-up with return-to-invite path
- claim pending invites on signup

Email delivery implementation:
- SMTP via Nodemailer (SMTP_HOST/SMTP_USER/SMTP_PASS etc)
- if SMTP config is absent, invite flow still works via link copy/logging fallback

### 8.8 GitHub integration and code intelligence

Implemented in:
- src/modules/github/actions.ts
- src/modules/github/lib/*
- src/app/api/auth/github/*
- src/app/api/webhooks/github/route.ts

OAuth flow:
1) /api/auth/github/start validates user and projectId
2) state + projectId written to short-lived cookies
3) redirect to GitHub authorize URL
4) callback exchanges code for access token
5) github connection row upserted
6) user redirected to project settings

Repository connect and indexing:
- user selects repo from authenticated account list
- optional webhook registration (if APP_BASE_URL + GITHUB_WEBHOOK_SECRET configured)
- full repo tree fetched from default branch
- file filter applies allowlist and size/directory constraints
- file content chunked line-wise (150 lines with 20 overlap)
- chunks embedded and upserted into code_chunks collection
- indexed file metadata stored for incremental sync

Webhook flow:
- HMAC SHA256 signature verification
- handle push events
- heavy work deferred with after():
  - reindex changed/added files
  - remove deleted files from vector/index tables
  - run commit-to-task matcher and auto-close matched tasks

Commit matcher:
- sends commit message + changed files + open tasks to LLM
- expects strict JSON { taskIds: [] }
- validates returned IDs against open task set before applying updates

Code browser:
- file tree retrieval from connected repo
- per-file content fetch and syntax-highlighted rendering

## 9. RAG and Vector Search Internals

### 9.1 Collections

- tasks
  - payload indexes: project_id, status, priority
- roadmap
  - payload indexes: project_id, phase, section_type, version
- code_chunks
  - payload indexes: project_id, filepath, language

### 9.2 Embedding pipeline

- Text embeddings generated with Gemini native embed endpoint.
- Default embedding model: gemini-embedding-001.
- Qdrant vector dimension is configured by EMBEDDING_DIMENSIONS (default 768).

### 9.3 Sync triggers

Task vectors:
- create/update/move -> upsertTaskVector
- delete -> deleteTaskVector

Roadmap vectors:
- generate/upload/update/regenerate -> upsertPlanVectors
- section edit -> upsertSingleSectionVector

Code vectors:
- repo index -> upsertCodeChunk per chunk
- file deletion/change -> delete file chunks then re-upsert

### 9.4 Retrieval usage

- chat:
  - board snapshot first
  - plan sections retrieval
  - code chunk retrieval
  - task retrieval as fallback path
- architect agent:
  - relevant task retrieval
  - relevant code chunk retrieval
  - active plan content

## 10. API/Action Contract Map

### 10.1 Project actions

- getProjects()
- getProject(projectId)
- createProject({name, description})
- updateProjectAction(projectId, patch)
- deleteProjectAction(projectId)

### 10.2 Kanban actions

- getTasks(projectId)
- getTaskEvents(taskId)
- createTask(input)
- updateTask(input)
- deleteTask(taskId, projectId)
- moveTask(taskId, newStatus, projectId)

### 10.3 Chat actions

- sendChatMessage(projectId, message)
- loadChatHistory(projectId)
- clearChat(projectId)

### 10.4 Agent actions

- generateTasks(request)
- acceptGeneratedTasks(projectId, tasks)
- getGenerationHistory(projectId)

### 10.5 Roadmap actions

- getImplementationPlan(projectId)
- getPlanVersionHistory(projectId)
- generatePlanWithAI(projectId, details)
- uploadPlan(projectId, content)
- updateImplementationPlan(projectId, content)
- updatePlanSectionAction(planId, sectionId, content, items)
- regeneratePhaseWithAI(projectId, phaseNumber)

### 10.6 Insight actions

- getAnalytics(projectId, range)
- generateNarrative(projectId, range)

### 10.7 Invite actions

- getMembersAction(projectId)
- getPendingInvitationsAction(projectId)
- createInviteAction({projectId, email, role})
- revokeInviteAction({projectId, invitationId})
- removeMemberAction({projectId, userId})
- getMyRoleAction(projectId)

### 10.8 GitHub actions

- getConnectionStatus(projectId)
- listUserRepos(projectId)
- selectRepo(projectId, owner, name)
- disconnectGithub(projectId)
- triggerReindex(projectId)
- getFileTree(projectId)
- getFileContent(projectId, filepath)

## 11. Client State and Hook Model

Zustand stores:
- projects-store:
  - projects, currentProjectId, loading
  - persists currentProjectId
- tasks-store:
  - task list + optimistic move/rollback helpers
- chat-store:
  - per-project conversation map, persisted
  - dedupe assistant/user messages by id during addMessage
- ui-store:
  - theme, sidebar state, task modal state

Module hooks:
- use-projects: fetches project list when empty
- use-tasks: fetches tasks by project
- use-chat: hydrates DB history and sends messages
- use-agent: wraps generation + acceptance
- use-analytics: fetches analytics on range/project change
- use-roadmap: full roadmap CRUD/generation/regeneration orchestration
- use-realtime-tasks: subscribes to Supabase realtime task events

## 12. UI System and UX Implementation

### 12.1 Theming and typography

- next-themes provider in root layout
- design tokens and gradients defined in src/app/globals.css
- custom font stack:
  - Manrope (body)
  - Sora (headings)
  - Geist Mono (monospace)

### 12.2 Layout

- platform shell:
  - collapsible sidebar
  - sticky header with breadcrumb
  - animated page transitions
- route-level animated wrappers use AnimatedPage

### 12.3 Shared UI patterns

- glass-card visual treatment
- soft-scrollbar utility
- toasts via Sonner
- skeleton loading states in major modules

## 13. Environment Configuration

### 13.1 Required for core app

- DATABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

### 13.2 AI provider config

Generic:
- AI_PROVIDER (openai|gemini|anthropic)
- AI_TIMEOUT_MS
- AI_MAX_RETRIES

OpenAI path:
- OPENAI_API_KEY
- OPENAI_CHAT_MODEL
- OPENAI_BASE_URL

Gemini path:
- GEMINI_API_KEY
- GEMINI_CHAT_MODEL
- GEMINI_BASE_URL
- EMBEDDING_MODEL

Anthropic path:
- ANTHROPIC_API_KEY
- ANTHROPIC_CHAT_MODEL
- ANTHROPIC_BASE_URL

### 13.3 Chat rate limit

- CHAT_RATE_LIMIT_REQUESTS
- CHAT_RATE_LIMIT_WINDOW_MINUTES

### 13.4 Vector DB

- QDRANT_URL
- QDRANT_API_KEY
- EMBEDDING_DIMENSIONS

### 13.5 GitHub integration

- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_OAUTH_REDIRECT_URL (optional override)
- GITHUB_WEBHOOK_SECRET
- APP_BASE_URL
- NEXT_PUBLIC_APP_URL

### 13.6 Invite email (SMTP)

- SMTP_HOST
- SMTP_USER
- SMTP_PASS
- SMTP_PORT (optional)
- SMTP_SECURE (optional)
- INVITE_EMAIL_FROM (optional)

## 14. Operations and Execution

Scripts (package.json):
- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run db:generate
- npm run db:migrate
- npm run db:studio
- npm run start:all

start:all behavior (scripts/start-all.mjs):
1) load .env
2) preflight checks for DB, Qdrant, AI key presence
3) run drizzle migrations
4) start next dev
5) call /api/rag/backfill for task vector sync

## 15. Current Limitations and Risks

1) Authorization consistency
- roadmap/insight/github actions should enforce membership/role checks but currently only require authentication.
- getTaskEvents lacks auth guard.

2) Build safety
- next.config.ts ignores TypeScript and ESLint build errors.

3) Profile module missing
- src/modules/profile and platform profile page are empty.

4) Limited automated verification
- no test suite in repository.

5) Provider consistency caveats
- Anthropic configuration is present but marked not-ready in current provider readiness logic.
- Gemini default chat model differs across modules (2.0 flash in models vs 2.5 flash fallback in roadmap/architect utilities).

6) Realtime duplicate risk
- board may receive local addTask and realtime INSERT for same task without explicit dedupe in tasks-store addTask.

7) Auth callback fallback route
- /auth/callback redirects failures to /auth/auth-code-error, but that page is not currently present in app routes.

## 16. Suggested Next Technical Improvements

1. Enforce role checks consistently on all project-scoped actions.
2. Add automated test coverage for:
- role enforcement
- invite lifecycle
- task event integrity
- webhook signature + commit matcher safety
3. Implement profile module and route.
4. Remove or tighten build ignore flags in next.config.ts.
5. Add idempotency/replay protection in webhook processing.
6. Add explicit dedupe for realtime task inserts in tasks-store.
7. Add operational monitoring around vector sync failures and reindex failures.

## 17. Report-Ready Conclusion

Nexus is already implemented as a multi-module, AI-native project management platform rather than a prototype-only UI. The current codebase demonstrates:
- real persistence and relational modeling
- functional auth and team collaboration
- integrated AI chat, AI planning, and AI-generated analytics
- practical retrieval augmentation over tasks, roadmap content, and repository code
- repository-aware workflow automation through GitHub webhooks

The remaining work is mostly in hardening, consistency, and production controls, not in fundamental feature construction.
