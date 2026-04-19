# Project Nexus Progress Report (Code-Synced)

Last synced: 19 April 2026

This file is synchronized with the current codebase under src/, drizzle/, and scripts/.

## 1. Executive Status

Current state: Functional MVP+ platform with AI planning, AI chat, roadmap management, team collaboration, GitHub integration, and realtime task sync.

Overall implementation status by module:

| Module | Status | Notes |
| --- | --- | --- |
| Auth (Supabase email/password + Google OAuth) | Complete | Login, signup, callback, safe next redirect, user sync to public users table |
| Projects and dashboard | Complete | Project CRUD, project switcher, dashboard grid |
| Kanban board | Complete | DnD, optimistic updates, task events, realtime subscription |
| Chat + AI telemetry + rate limit | Complete | Multi-provider runtime, DB persistence, metrics, board/plan/code context injection |
| Architect agent | Complete | LangGraph Plan -> Critique -> Finalize loop, task acceptance workflow |
| Roadmap (implementation plans) | Complete | AI generation, manual upload, section edit, phase regeneration, version history |
| Insights dashboard | Complete | Metrics charts + AI narrative generation |
| Team collaboration (invites + RBAC) | Complete | Member/admin/owner roles, invitation lifecycle, public invite accept flow |
| GitHub integration + code RAG | Complete | OAuth, repo selection, indexing, webhook reindex, commit-task matching |
| Profile module | Not implemented | src/modules/profile is empty and no profile page route exists |

## 2. Milestones Completed

1. Core platform foundations
- Next.js 15 app-router architecture, Tailwind/shadcn UI system, Zustand stores, Drizzle + Supabase Postgres.

2. Real AI chat stack
- Real provider-backed chat runtime with retries, timeout handling, persistence, and telemetry.

3. Task RAG
- Qdrant task vectors + semantic retrieval + auto-sync on task mutations + backfill endpoint.

4. Architect agent
- LangGraph state machine for requirement decomposition with structured Zod outputs.

5. Roadmap/implementation plan
- Versioned implementation plans with parsed phase sections, inline editing, and plan RAG.

6. Insight narratives
- AI-generated PM-style narrative from analytics metrics.

7. Realtime tasks
- Supabase Realtime migration + client subscription wired into Kanban board.

8. Team collaboration
- Project invitations, role hierarchy, members management UI, claim-on-signup, public token accept page.

9. GitHub integration and code intelligence
- OAuth connect, repo selection, file tree indexing, code chunk vectors, code browser, webhook-based reindex + commit-to-task auto-close.

## 3. Current Architecture Snapshot

### 3.1 Stack
- Framework: Next.js 15
- Language: TypeScript (strict mode enabled in tsconfig)
- UI: Tailwind CSS 4, shadcn/ui, Radix primitives, Framer Motion
- State: Zustand (+ persist middleware)
- DB: PostgreSQL via Supabase, Drizzle ORM
- Vector DB: Qdrant (three collections)
- AI libs/services: OpenAI-compatible chat endpoint wrapper + Gemini embedding endpoint + LangGraph

### 3.2 Data layer
- Total tables currently modeled in src/core/db/schema.ts: 13
- Key entities: users, projects, project_members, project_invitations, tasks, task_events, chat_messages, chat_message_metrics, chat_rate_limits, agent_generations, implementation_plans, github_connections, github_indexed_files.

### 3.3 Route surface
- Platform pages: dashboard + project-scoped board/chat/agent/roadmap/insight/code/settings.
- Public routes: landing, sign-in, sign-up, invite token accept.
- API routes: health, rag backfill, github oauth start/callback, github webhook.

### 3.4 AI and retrieval
- Chat context combines:
  - full board snapshot (grouped by status + completion rate)
  - relevant roadmap sections
  - relevant indexed repository code chunks
- Agent context combines:
  - project metadata
  - roadmap content
  - relevant tasks
  - relevant code chunks

## 4. Important Corrections vs Older Progress Notes

- Database is no longer a 9-table system. It is now a 13-table system.
- AI Insight Narrative is implemented (not pending).
- Team invite email sender is SMTP/Nodemailer-based (not Resend API).
- Realtime task sync is implemented and wired into board via useRealtimeTasks.
- GitHub integration is implemented end-to-end, including code browsing and webhook handling.
- Route surface differs from earlier assumptions:
  - dashboard exists at /dashboard
  - no standalone /projects page
  - no profile page currently

## 5. Current Risks / Gaps

1. Authorization hardening gaps
- Some server actions currently check only authentication, not project membership/role:
  - roadmap actions
  - insight actions
  - github actions
- getTaskEvents in kanban actions does not currently enforce auth/role.

2. Profile area missing
- src/modules/profile and src/app/(platform)/profile are empty.

3. Testing coverage
- No automated test suite files are present in current workspace.

4. Build policy
- next.config.ts ignores TypeScript and ESLint errors during build, which can hide regressions.

5. AI/provider consistency
- Anthropic appears configurable in environment model mapping but marked not-ready in provider readiness logic.

## 6. Recommended Next Sprint Priorities

1. Apply requireRole/member checks to roadmap, insight, github, and task-events actions.
2. Add baseline automated tests:
- permissions and auth redirects
- task CRUD/move + event logging
- invite lifecycle
- webhook signature validation and commit-matcher safety
3. Implement profile page/module.
4. Add production-safe build gates (remove ignoreBuildErrors/ignoreDuringBuilds or scope them).
5. Add operational safeguards for GitHub webhook replay/idempotency and vector-sync observability.

## 7. Status Summary

Project Nexus is in a strong implementation state for a major project report:
- complete cross-module user workflows
- substantial AI + RAG integration
- collaboration + integrations beyond basic PM tooling

Remaining work is now mostly hardening and production readiness, not core feature construction.
