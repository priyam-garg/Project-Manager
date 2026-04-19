# 🚀 Project Nexus: Implementation Status Report

## 0. 📝 Latest Update (19/04/2026)

* Implemented **Step 5: Team Collaboration** — project invitations, role-based permissions, and a public `/invite/[token]` accept page. See bottom of this doc for full detail.

## Previous Update (10/04/2026)

* Implemented **Project Roadmap / Implementation Plan** feature.
  * Added `implementation_plans` table to store versioned roadmaps (up to 10 versions) in Markdown structure with JSONB phase tracking (`src/core/db/schema.ts`).
  * Built AI-powered **Plan Generator** (`src/modules/roadmap/plan-generator.ts`) to create full plans or regenerate specific phases.
  * Integrated **Granular RAG** for the roadmap by vectorizing individual plan sections (Overview, Phases, Goals, Tasks) into Qdrant for precise context retrieval.
  * Created a mandatory 2-step **Create Project Wizard** ensuring all new projects begin with a structured roadmap.
  * Built the **`/roadmap` UI** with collapsible phases, inline section editing, and version history.
* Enhanced **Chat and Agent Context Injection**:
  * Chat now receives a **complete board snapshot** (all tasks grouped by status) and **live aggregate statistics** (completion rate, counts by status/priority) instead of just semantic vector search matches. This allows the AI to accurately answer aggregate queries (e.g., "how many tasks are done?") and analyze the full board state to suggest "what to work on next".
  * Both Chat and the Architect Agent now receive relevant roadmap context via Qdrant retrieve calls.
* **Frontend UI Polish & Cleanup**:
  * Fixed global page scrolling: Chat and Kanban board now correctly constrain to the viewport (`h-screen overflow-hidden`), allowing internal elements (message list, task columns) to scroll independently without pushing the input/footer out of view.
  * Added a `Dashboard` home link to the bottom of the sidebar for quick project switching.
  * Cleaned out leftover legacy mock files (`src/lib/mock-data`).

### Previous Updates
* (07/04/2026) Implemented Senior Architect Agent — replaced mock task generation with a real LangGraph-powered AI agent. Built state machine, Zod schemas, structured prompts, and wired into `generateTasks` server action.
* (31/03/2026) Implemented Context-Aware Chat via RAG — Qdrant vector DB, Gemini embeddings, hybrid retriever, auto-vectorization on task mutations, backfill API. Added `tags`, `ai_metadata`, `ai_generated`, `story_points` columns to tasks.
* (23/03/2026) Implemented real AI chat integration with multi-provider support (OpenAI, Gemini, Anthropic). Added AI telemetry tracking and chat rate limiting.
* (18/03/2026) Replaced hardcoded task activity users with real actor data. Added Google OAuth authentication.

---

## 1. 🧱 Core Architecture & Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS 4, shadcn/ui

  * Base Color: *Slate*
  * Customized theme radius and colors
* **State Management:** Zustand (with `persist` middleware for local storage)
* **Database & ORM:** PostgreSQL (Supabase), Drizzle ORM
* **Authentication:** Supabase (Email/Password + Google OAuth)
* **AI Providers:** OpenAI (default), Gemini, Anthropic — configurable via env vars
* **Vector Database:** Qdrant (for RAG task embeddings)
* **Embedding Model:** Gemini `text-embedding-004` via OpenAI-compatible API

### 📦 Key Libraries

* `@dnd-kit` → Drag-and-drop functionality
* `recharts` → Data visualization
* `react-hook-form` + `zod` → Form handling & validation
* `lucide-react` → Icons
* `@qdrant/js-client-rest` → Vector database client for RAG
* `@langchain/langgraph` + `@langchain/openai` → LangGraph state machine for architect agent

### ⚙️ Build Configuration

* `next.config.ts` configured to:

  * Ignore TypeScript errors (`ignoreBuildErrors`)
  * Ignore ESLint errors (`ignoreDuringBuilds`)
* Purpose: Prevent deployment blockers during production builds

---

## 2. 🗄️ Database & Data Layer

### 📐 Schema (`src/core/db/schema.ts`)

* Defined using Drizzle ORM
* **9 tables total** (4 original + 5 new):

  * `users` — user profiles synced from Supabase auth
  * `projects` — with `owner_id` FK → users; includes `tech_stack` (jsonb), `architectural_guidelines` (text)
  * `project_members` — links users↔projects with role enum (`owner`, `admin`, `member`)
  * `tasks` — with `ON DELETE CASCADE` to projects, `SET NULL` on assignee; includes `tags` (jsonb), `ai_metadata` (jsonb), `ai_generated` (boolean), `story_points` (integer)
  * `taskEvents` — audit trail for task changes, `ON DELETE CASCADE` to tasks
  * `chatMessages` — persists chat conversations per project
  * `chatMessageMetrics` — **NEW** — AI telemetry per assistant message (provider, model, latency, tokens, errors)
  * `chatRateLimits` — **NEW** — sliding window rate limiting per user/project with composite PK
  * `agentGenerations` — logs AI task generation requests with JSONB tasks

* **5 enums:** `task_status`, `task_priority`, `event_type`, `member_role`, `chat_role`
* **13 foreign key constraints** with proper `CASCADE` / `SET NULL` behavior
* Full Drizzle relations defined for all tables

### 🔌 Client (`src/core/db/client.ts`)

* PostgreSQL connection via Supabase
* Singleton pattern using `globalThis` to prevent multiple connections during hot reload
* `prepare: false` for Supabase PgBouncer compatibility
* Connection pool size: 10
* Health check function exported

### 🧩 Database Query Layer (`src/core/db/queries/`)

* **6 query modules** providing clean abstraction between server actions and database:

  * `projects.ts` — `getUserProjects`, `getProjectById`, `createProject` (with auto owner membership), `updateProject`, `deleteProject`, `isProjectMember`
  * `tasks.ts` — Full CRUD + `moveTask` (with status_changed event logging) + `bulkCreateTasks` (for agent)
  * `users.ts` — `getUserById`, `getUserByEmail`, `upsertUser`
  * `chat.ts` — `getChatMessages`, `saveChatMessage` (with metrics persistence), `clearChatHistory`, `consumeChatRateLimit`
  * `analytics.ts` — Real aggregation queries: `getProjectMetrics`, `getTaskDistribution`, `getPriorityBreakdown`, `getMemberPerformance`, `getBurndownData`
  * `agent.ts` — `saveGeneration`, `getGenerationHistory`, `updateGenerationAcceptedCount`

* Barrel export via `index.ts`

### 🔍 RAG Pipeline (`src/modules/rag/`)

* **3 modules** powering context-aware AI chat:

  * `qdrant.ts` — Qdrant client singleton, auto-collection creation with payload indexes (project_id, status, priority)
  * `retriever.ts` — Hybrid search: vector similarity + metadata filters, returns top-K tasks above score threshold (0.3)
  * `sync.ts` — `upsertTaskVector` / `deleteTaskVector` for keeping Qdrant in sync with PostgreSQL on every task mutation

### 🧾 Types (`src/types/index.ts`)

* Global TypeScript types:

  * `Task`, `Project`, `User`, `ProjectMember`, `ChatMessageRecord`, `AgentGeneration`
  * `ApiResponse<T>`
  * UI state types
  * Form input types: `CreateTaskInput`, `UpdateTaskInput`, `CreateProjectInput`, `UpdateProjectInput`
  * Custom API payloads (e.g., `TaskGenerationRequest`)

### 🧪 Mock Environment (`src/lib/mock-data/`)

* Retained for fallback/dev scenarios if API keys are not configured
* Mock functions: `generateMockChatResponse`, `generateMockTaskGeneration`
* Note: Both chat and agent now use real AI — mocks are legacy fallbacks only

---

## 3. 🔐 Authentication System (Supabase)

### ⚡ Auth Helper (`src/core/auth/`)

* `getAuthUser()` — extracts authenticated user from Supabase session (throws if not authenticated)
* `getOptionalAuthUser()` — returns null instead of throwing (for optional auth contexts)
* Used by all server actions to enforce authentication and get user context
* Supabase auth `user.id` === public `users.id` (aligned via signup sync)

### ⚡ Server Actions

* Handles:

  * Login & Signup
  * Email/password validation
  * Error handling
  * Redirect to `/dashboard` on success
  * User sync to public `users` table on signup

### 🖥️ UI Pages

* `<SignIn />` → `sign-in/page.tsx`
* `<SignUp />` → `sign-up/page.tsx`
* Fully styled and connected to server actions

---

## 4. 🧠 State Management (Zustand Stores)

### 📌 Stores

#### 🗂️ Tasks Store (`tasks-store.ts`)

* Manages:

  * Task arrays
  * Loading states
  * CRUD operations
* Includes:

  * `optimisticMoveTask`
  * Rollback logic for drag-and-drop

#### 📁 Projects Store (`projects-store.ts`)

* Manages:

  * Project list
  * `currentProjectId` (persisted in localStorage)
* Validated against loaded projects (clears stale IDs from localStorage)

#### 🎛️ UI Store (`ui-store.ts`)

* Handles:

  * Theme
  * Sidebar toggles
  * Modal states
* Persisted in localStorage

#### 💬 Chat Store (`chat-store.ts`)

* Manages:

  * Conversation history
  * Keyed by `projectId`
* Persisted in localStorage

### 🪝 Custom Hooks

* `use-tasks`
* `use-projects`
* `use-chat`
* `use-agent`
* `use-analytics`

---

## 5. 🎨 UI System & Layout

### 🌗 Theme & Dark Mode

* Implemented using `next-themes`
* Supports:

  * Light
  * Dark
  * System
* Verified across all components and charts

### 🧩 Layout Structure

* File: `src/app/(platform)/layout.tsx`
* Responsive grid for:

  * Mobile (320px+)
  * Tablet
  * Desktop

### 🧭 Navigation

* Responsive sidebar:

  * Active link highlighting
  * Hamburger toggle (mobile)
  * **Project-aware navigation** — Board/Chat/Agent/Insights links only appear when a valid project is selected
  * `currentProjectId` validated against loaded projects on mount
* Features:

  * Breadcrumb generation via pathname parsing
  * Keyboard-accessible project switcher dropdown
  * Project switcher sets `currentProjectId` in store on selection

### 🧱 Global Components

* `<LoadingSpinner />`
* `<EmptyState />`
* `<ErrorBoundary />` (class-based)

---

## 6. 🧩 Core Modules (The 4 Pillars)

All modules are routed dynamically via:
`src/app/(platform)/projects/[projectId]/...`

All server actions use **real PostgreSQL queries** via Drizzle ORM with **authentication enforcement**.

---

### A. 📋 Kanban Board (`/board/page.tsx`)

#### ✨ Features

* Drag-and-drop using `@dnd-kit`

  * Pointer & Keyboard sensors
  * `verticalListSortingStrategy`
* Optimistic UI updates upon card movement

#### 🧱 Components

* Task Cards:

  * Truncated previews
  * Priority badges
* Columns:

  * Status headers
  * Task counts
* Task Modal:

  * Edit/view details
  * Activity timeline via `taskEvents`

#### ✅ Validation

* `react-hook-form` + `zod`

#### 🔗 Backend

* `getTasks` — fetches tasks from PostgreSQL by project
* `createTask` — inserts task + logs `created` event + auto-syncs vector to Qdrant (background via `after()`)
* `updateTask` — updates task + logs `updated` event + auto-syncs vector to Qdrant (background via `after()`)
* `deleteTask` — logs `deleted` event + removes task + deletes vector from Qdrant (background via `after()`)
* `moveTask` — updates status + logs `status_changed` event with old/new values + auto-syncs vector to Qdrant (background via `after()`)

---

### B. 💬 Chat Interface (`/chat/page.tsx`)

#### ✨ Features

* Role-based message styling
* Markdown rendering (`react-markdown`) with syntax highlighting
* Auto-scrolling

#### 🧱 Components

* Resizable textarea input (Cmd+Enter support)
* Animated suggested starter questions
* Typing indicators

#### 🔗 Backend

* `sendChatMessage` — persists user message, calls real LLM (with last 20 messages as context), saves AI response + telemetry metrics
* `loadChatHistory` — loads conversation from database
* `clearChat` — clears all messages for a project
* **AI Integration: COMPLETE** — Multi-provider support (OpenAI, Gemini, Anthropic) with retry logic, timeout handling, and graceful error fallback
* **RAG Context Injection: COMPLETE** — Chat retrieves relevant tasks from Qdrant vector DB and injects them into the system prompt for context-aware responses
* **Rate Limiting** — Sliding window rate limiter (default: 20 requests/minute per user/project)
* **Telemetry** — Every AI response tracked with provider, model, latency, token counts, retry count, error status

---

### C. 🤖 Agent Interface (`/agent/page.tsx`)

#### ✨ Features

* AI task generation interface
* Displays:

  * Generated tasks
  * Agent reasoning

#### 🧱 Components

* Requirement input with example dropdowns
* Editable task cards for generated items
* Bulk actions:

  * Accept All
  * Accept Selected
* Clickable Generation History log

#### 🔗 Backend

* `generateTasks` — runs **LangGraph architect agent** (Plan → Critique → Finalize loop) with project context, persists record to `agentGenerations` table
* `acceptGeneratedTasks` — bulk creates tasks via `bulkCreateTasks` with `aiGenerated: true` flag and `aiMetadata` (source, timestamp)
* `getGenerationHistory` — retrieves past generations from database
* **AI Generation: COMPLETE** — Real LangGraph-powered agent with Zod-validated structured output, multi-provider LLM support (OpenAI/Gemini)

#### 🏗️ Architect Agent (`src/modules/architect/`)

* **3 modules** powering intelligent task decomposition:

  * `graph.ts` — LangGraph `StateGraph` with 3 nodes (Planner, Critic, Finalizer), conditional re-planning (max 2 iterations), multi-provider LLM via raw fetch
  * `schemas.ts` — Zod schemas: `TaskSchema` (title, description, priority, storyPoints, tags), `ArchitectOutputSchema`, `CritiqueSchema` (issues with severity + suggestion, overall assessment)
  * `prompts.ts` — Role-based system prompts: Senior Architect (planner), Staff Engineer (critic), Senior Architect (finalizer)

---

### D. 📊 Insight Dashboard (`/insight/page.tsx`)

#### ✨ Features

* Analytics visualization using `recharts`
* Fully responsive and dark-mode compatible

#### 📈 Components

* Metric cards with trend indicators
* Charts:

  * LineChart → Sprint Burndown
  * Bar Chart → Status distribution
  * Pie Chart → Priority distribution
* Member performance table

#### 🔍 Filters

* Date range options:

  * 7d
  * 30d
  * 90d
  * All

#### 🔗 Backend

* `getAnalytics` — runs 5 real aggregation queries in parallel (`Promise.all`):
  * `getProjectMetrics` — total/completed/in-progress counts with completion trend
  * `getTaskDistribution` — groups tasks by status
  * `getPriorityBreakdown` — groups tasks by priority
  * `getMemberPerformance` — per-member completed/in-progress counts
  * `getBurndownData` — daily remaining/completed from `taskEvents`

---

## 7. 📁 Project Management

### Create Project Flow

* `CreateProjectDialog` component (`src/modules/projects/components/create-project-dialog.tsx`)
* Modal with name & description form
* Validates input, shows errors, submits via `createProject` server action
* On success: adds to store, sets as current project, navigates to board
* Accessible from dashboard header button and empty state button

### Project Actions

* `getProjects` — fetches projects where user is a member (via `projectMembers` join)
* `getProject` — fetches single project by ID
* `createProject` — creates project + auto-adds creator as `owner` in `projectMembers`
* `updateProjectAction` — updates project name/description
* `deleteProjectAction` — deletes project (cascades to all related data)

---

## 8. ✨ UX Polish & Edge Cases

### ⏳ Loading States

* Skeleton loaders implemented for:

  * Kanban cards
  * Chat messages
  * Metric cards

### ⚠️ Error Handling

* Global toast notifications configured for failed server actions
* Comprehensive console logging
* Auth errors throw descriptive messages

### ♿ Accessibility

* Tab key navigation verified
* Mobile touch targets:

  * Minimum size: **44×44px**

---

## ✅ Summary

Project Nexus has achieved:

* **Production-quality frontend** with modular, scalable architecture
* **Real PostgreSQL backend** with Drizzle ORM queries replacing all mock data
* **9-table database schema** with proper foreign keys, cascades, audit logging, and AI telemetry
* **Authentication enforcement** on all server actions via Supabase (Email/Password + Google OAuth)
* **Working project creation flow** with form validation and auto-navigation
* **Project-aware sidebar** that validates selected project against real data
* **Real AI chat integration** with multi-provider support (OpenAI/Gemini/Anthropic), rate limiting, and telemetry
* **Context-aware RAG chat** — Qdrant vector DB with Gemini embeddings, auto-sync on task mutations, hybrid retrieval with metadata filters
* **LangGraph architect agent** — real AI task decomposition with Plan → Critique → Finalize loop, structured Zod output, replacing all mock generation
* **Task event tracking** with real user data and friendly status labels

---

### 🔮 Remaining — Ordered by Priority (Next Steps)

#### ~~Step 1: Context-Aware Chat via RAG (Roadmap Section 4)~~ ✅ COMPLETED (31/03/2026)
> **Goal:** Make the AI chat aware of project tasks so it can answer questions like "What high-priority tasks are blocking?"

* ~~Enable `pgvector` extension~~ → Used **Qdrant** vector database instead (external, managed via `@qdrant/js-client-rest`)
* ~~Add `embedding` column to `tasks` table~~ → Vectors stored in Qdrant collection with payload indexes on `project_id`, `status`, `priority`
* ✅ Build vectorization pipeline (`src/core/ai/embedding.ts`) using Gemini `text-embedding-004`
* ✅ Auto-generate embeddings on task create/update/move/delete via `after()` API (background, non-blocking)
* ✅ Build hybrid search retriever (`src/modules/rag/retriever.ts`) — combines vector similarity + metadata filters
* ✅ Inject retrieved task context into chat system prompt before calling LLM
* ✅ Add `tags` (jsonb), `ai_metadata` (jsonb), `ai_generated` (boolean), `story_points` (integer) columns to tasks
* ✅ Backfill API endpoint (`/api/rag/backfill`) for syncing existing tasks

#### ~~Step 2: Senior Architect Agent (Roadmap Section 5)~~ ✅ COMPLETED (07/04/2026)
> **Goal:** Replace mock task generation with a real LangGraph-powered agent that decomposes requirements into tasks

* ✅ Install `@langchain/openai`, `@langchain/langgraph`
* ✅ Define Zod schemas for structured agent output (`TaskSchema`, `ArchitectOutputSchema`, `CritiqueSchema`) in `src/modules/architect/schemas.ts`
* ✅ Build LangGraph state machine (`src/modules/architect/graph.ts`) with Plan → Critique → Finalize loop (max 2 iterations)
* ✅ Add `tech_stack` (jsonb) and `architectural_guidelines` (text) columns to `projects` table
* ✅ Wire architect agent into existing `generateTasks` server action (replace mock) — `runArchitectGraph()` with full project context
* ✅ `ai_generated` (boolean) and `story_points` (integer) columns on tasks (added in Step 1)
* ✅ Accepted tasks flagged with `aiGenerated: true` and `aiMetadata: { source: 'architect-agent' }`

#### Step 3: AI-Powered Insight Narratives (Roadmap Section 6)
> **Goal:** Feed existing analytics data into LLM to generate narrative reports with actionable recommendations

* Build metric extraction service (`src/modules/insight/metrics.ts`) — velocity, feature-to-bug ratio, stagnation detection
* Create LLM prompt template that acts as a "Product Manager" interpreting project metrics
* Add narrative generation to the Insight dashboard alongside existing charts

#### ~~Step 4: Real-Time Sync via Supabase Realtime (Roadmap Section 7)~~ ✅ COMPLETED (19/04/2026)
> **Goal:** Enable live updates across browser tabs/users when tasks change

* ✅ Chose Supabase Realtime over Postgres `LISTEN/NOTIFY` + SSE — the DB client runs in PgBouncer transaction-pool mode (`prepare: false`), which is incompatible with `LISTEN`, and Supabase is already in the stack.
* ✅ Migration `0006_realtime_tasks.sql` — `ALTER TABLE tasks REPLICA IDENTITY FULL` + `ALTER PUBLICATION supabase_realtime ADD TABLE tasks` (so DELETE events carry the old row and the `project_id=eq.X` filter works).
* ✅ Row mapper (`src/lib/realtime/map-task-row.ts`) — converts snake_case Postgres row → camelCase `Task` shape used by the app.
* ✅ Client hook (`src/lib/hooks/use-realtime-tasks.ts`) — subscribes to `postgres_changes` on `tasks` filtered by `project_id`, dispatches `addTask` / `updateTask` / `deleteTask` on the Zustand store. Cleans up the channel on unmount.
* ✅ Wired into `Board` (`src/modules/kanban/components/board.tsx`) — a single `useRealtimeTasks(projectId)` call beside the existing initial `useTasks` fetch.

**Run order after pulling:** `npm run db:migrate` (applies 0006) — no env changes needed; client reuses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

#### ~~Step 5: Team Collaboration~~ ✅ COMPLETED (19/04/2026)
> **Goal:** Allow inviting other users to projects, with role-based permissions.

* ✅ Schema + migration `0007_project_invitations.sql` — new `project_invitations` table (token-keyed, 7-day expiry, status enum `pending/accepted/revoked/expired`, `member_role` default `member`), plus indexes on `(invited_email, status)` and `project_id`.
* ✅ Permission helper (`src/core/auth/permissions.ts`) — `getMembership`, `requireRole`, `hasRole` with role hierarchy `owner > admin > member`.
* ✅ Invite queries (`src/core/db/queries/invites.ts`) — `createInvitation` (generates `base64url` token), `getInvitationByToken`, `getPendingInvitationsForProject`, `revokeInvitation`, `acceptInvitation` (idempotent + expiry auto-marks), `claimPendingInvitations` (bulk accept all pending for an email on signup), `getProjectMembers`, `removeProjectMember`.
* ✅ Invites module (`src/modules/invites/`):
  * `actions.ts` — `getMembersAction`, `getPendingInvitationsAction`, `createInviteAction` (owner+admin only; rejects existing members + self-invites; revokes older pending for same email; returns shareable `acceptUrl`), `revokeInviteAction`, `removeMemberAction` (owner protected), `getMyRoleAction`.
  * `email.ts` — Resend REST sender (HTML template with accept button + link fallback); no-ops with console log if `RESEND_API_KEY` unset so the shareable link flow still works in dev.
  * `components/members-section.tsx` — client card in Project Settings with invite form, pending invitations list (revoke + copy-link per row), and current-members list (remove + role badge).
* ✅ Public accept page (`/invite/[token]`) — outside the `(platform)` layout. Handles: invalid / already-accepted / revoked / expired / signed-out (bounces to `/sign-in?next=...` or `/sign-up?next=...&email=...`) / signed-in-wrong-email (warns) / signed-in-matching-email (auto-accepts + redirects to `/projects/:id/board`).
* ✅ Claim-on-signup — `signup` action calls `claimPendingInvitations(user.id, email)` after user sync, so users invited before they had an account are auto-joined on signup.
* ✅ Auth flow updates — `login` / `signup` / `signInWithGoogle` now honor a safe `next` redirect (rejects protocol-relative `//` paths); sign-in/up pages render a hidden `next` input and preserve it in cross-links; `sign-up` pre-fills `email` from the invite.
* ✅ Role enforcement applied:
  * **Member**: view project, create/update/move tasks, chat, agent (`generateTasks`, `acceptGeneratedTasks`, `getGenerationHistory`), load chat history.
  * **Admin+**: delete tasks, update project settings, invite + revoke, remove non-owner members, clear chat history.
  * **Owner only**: delete project (transfer ownership not yet exposed).
* ✅ Settings page — `MembersSection` added above the existing GitHub section at `src/app/(platform)/projects/[projectId]/settings/page.tsx`.

**Env for email (optional):** set `RESEND_API_KEY` and `INVITE_EMAIL_FROM` to send real emails; otherwise invite creation logs the accept link and the admin can copy it from the Members UI. Base URL for invite links is `APP_BASE_URL` (falls back to `NEXT_PUBLIC_APP_URL` or `http://localhost:3000`).

**Run order after pulling:** `npm run db:migrate` (applies 0007).
