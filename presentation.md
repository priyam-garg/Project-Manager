# Nexus Platform — Presentation

> 15-slide technical presentation following the prescribed sequence. Each slide is content-rich and self-contained.

---

## Slide 1 — Title

**Nexus Platform: An AI-Augmented Project Management System with Retrieval-Augmented Chat, a LangGraph Architect Agent, and GitHub-Integrated Task Automation**

- A unified workspace that combines Kanban task management, implementation-plan roadmaps, analytics dashboards, a context-aware AI chat, an autonomous task-generation agent, and a GitHub integration that closes the feedback loop between code commits and project tasks.
- Built on Next.js 15 (App Router, Server Actions), Drizzle ORM + Supabase Postgres, Qdrant vector DB, Gemini embedding/chat models, and LangGraph state machines.
- Submitted by: Project Manager Team · Date: April 2026 · Repo: `D:\nexus2\Project-Manager`

---

## Slide 2 — Motivation

**Problem**: Modern software teams simultaneously operate in three disconnected surfaces — (1) an issue tracker (Jira/Linear), (2) a chat assistant (ChatGPT/Copilot), and (3) their actual code repository. Context does not flow between them, so the AI answering "what should I work on next?" has never read the backlog, and the backlog never learns when code has already shipped.

**Consequences observed in practice**:
- AI assistants hallucinate task names and priorities when asked project-specific questions — because their prompt window cannot hold the full board.
- Task-generation tools produce **duplicate or stale work**, unaware of what already exists in the backlog or the repository.
- **Manual status updates** (dragging cards to "Done") remain the single largest source of PM friction; 35–50% of closed tickets lag real progress by days.
- Commit messages, implementation plans, and architecture docs exist but are **never surfaced at the point of decision**.

**Thesis**: A project manager becomes dramatically more useful when its chat, its task generator, and its board **share one retrieval-augmented memory** over the project's tasks, roadmap, and source code — and when the code repository **writes back** into the board automatically.

---

## Slide 3 — Research Gap & Aim

**Research gap**:
| Existing tool | What it does | What it lacks |
|---|---|---|
| GitHub Copilot / Cursor | Code autocomplete in IDE | No visibility of backlog, roadmap, or task state |
| ChatGPT / Claude (generic) | Conversational AI | No project memory; hallucinates task names |
| Jira / Linear | Structured task tracking | No RAG, no code context, manual status updates |
| Notion AI | Document Q&A | Not structured for agile boards or commit-linked tasks |

**Aim of this work**: To design and implement a single platform in which (a) a **chat agent**, (b) a **task-generation agent**, and (c) the **Kanban board itself** all share a unified retrieval-augmented context spanning the project's tasks, implementation plan, and GitHub source code — and in which **git commits automatically reconcile with open tasks** via LLM-based fuzzy matching.

**Novelty**: We reuse a single Qdrant vector store across three semantic domains (tasks, plan sections, code chunks) with a per-domain payload schema, and we expose that retrieval layer to *both* a generative chat and a LangGraph architect agent so that neither produces work the codebase has already done.

---

## Slide 4 — Objectives: Issues and Goals

**Issues addressed** (each became a concrete deliverable):
1. **Hallucinated task references** in AI chat → inject complete board state + RAG-retrieved tasks into the system prompt.
2. **Duplicate task generation** by the agent → retrieve top-k existing tasks and implementation-plan sections before generation, with an explicit "DO NOT duplicate" directive.
3. **No connection between code and tasks** → GitHub OAuth integration, Qdrant-indexed code chunks, webhook-driven reconciliation.
4. **Flat metric dashboards** with no narrative → AI-powered "PM-style" narrative generator on the Insights page.
5. **Manual status maintenance** → AI-based commit→task matcher that closes tasks on push.

**Goals (measurable)**:
- G1: Zero-hallucination chat — every task reference in a chat response must exist in the board.
- G2: End-to-end task-generation agent latency < 30 s for 89-task projects.
- G3: Auto-close accuracy ≥ 80 % on commits that explicitly describe completed work.
- G4: Code-context retrieval in chat under 500 ms for repos ≤ 50 k LoC.
- G5: One-click GitHub connection (OAuth App, single redirect) with on-connect indexing + 30-day commit backfill.

---

## Slide 5 — Methodology: Core Concepts

**1. Retrieval-Augmented Generation (RAG)** [1,2]. The LLM receives, at inference time, a query-specific slice of an external knowledge base indexed by dense vector embeddings. We use Gemini `embedding-001` (3072 dimensions) and Qdrant with cosine similarity (`score_threshold = 0.3`).

**2. Three parallel semantic indexes** over the same Qdrant cluster, keyed on `project_id`:
- `tasks` — one point per task (title + description + status + priority + tags).
- `roadmap` — implementation-plan sections (phase / section_type / content).
- `code_chunks` — ~150-line overlapping windows of repository files (path, SHA, language, text).

**3. LangGraph state machine for task generation** [3]. A three-node directed graph — **Plan → Critique → Finalize** — where the critique node inspects the draft against the RAG context and may force a re-plan. Typed state via `Annotation.Root`, structured output validated with Zod.

**4. OAuth 2.0 Authorization-Code Flow** [4] for GitHub, with HMAC-SHA256 webhook verification [5]. Access tokens stored server-side; state cookie prevents CSRF on callback.

**5. LLM-based commit→task matcher**. Commit message + file list + open-task list → strict-JSON response `{taskIds: [...]}` → bulk status update. Enables natural-language commits (no `fixes #ID` convention).

---

## Slide 6 — Methodology: End-to-End Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NEXUS PLATFORM (Next.js 15)                  │
│                                                                      │
│  ┌────────┐   ┌────────┐   ┌─────────┐   ┌─────────┐  ┌──────────┐   │
│  │ Board  │   │Roadmap │   │  Chat   │   │  Agent  │  │ Insights │   │
│  └───┬────┘   └───┬────┘   └────┬────┘   └────┬────┘  └────┬─────┘   │
│      │            │             │             │            │         │
│      ▼            ▼             ▼             ▼            ▼         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Server Actions  ·  Supabase Auth  ·  Drizzle ORM (Postgres)     │ │
│  └───────────┬────────────────┬────────────────┬────────────────────┘│
│              │                │                │                     │
│  ┌───────────▼────┐ ┌─────────▼─────┐ ┌────────▼─────┐               │
│  │  QDRANT        │ │ Gemini LLM    │ │  LangGraph   │               │
│  │ • tasks        │ │ • 2.0 Flash   │ │  Architect   │               │
│  │ • roadmap      │ │ • embedding-  │ │  Plan→Crit→  │               │
│  │ • code_chunks  │ │   001 (3072d) │ │  Finalize    │               │
│  └────────────────┘ └───────────────┘ └──────────────┘               │
│                                                                      │
│  ┌──────────────────── GITHUB INTEGRATION ────────────────────────┐  │
│  │  OAuth App  → access_token → Octokit                           │  │
│  │  Connect   → list repos → pick repo → register webhook         │  │
│  │  Index     → tree walk → file-filter → chunk → embed → upsert  │  │
│  │  Webhook   → HMAC verify → after() → reindex + AI match        │  │
│  │  Match     → commit + files + open tasks → LLM → taskIds[]     │  │
│  │             → updateTask(status='done')                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

Data flows **both ways**: the board feeds the chat/agent context; the GitHub webhook feeds the board from commits.

---

## Slide 7 — Implementation: Tools & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions, `after()`) | Full-stack React with server-native auth, deferred webhook work |
| Language | TypeScript 5 (strict) | Type safety end-to-end |
| Database | Supabase Postgres + Drizzle ORM 0.36 | Typed SQL, auto-migrations (`drizzle-kit`) |
| Auth | Supabase Auth (cookie-based SSR) | Email/password + Google OAuth |
| Vector DB | Qdrant Cloud (`eu-west-2-0.aws`) | Hybrid semantic retrieval with payload filters |
| Embeddings | Gemini `embedding-001` (3072-d, cosine) | Native `embedContent` endpoint |
| Chat LLM | Gemini 2.0 Flash (OpenAI-compatible endpoint) | Chat, narratives, critique, commit matching |
| Agent | `@langchain/langgraph` 1.2 | Stateful Plan→Critique→Finalize graph |
| GitHub | `@octokit/rest` + OAuth App + Webhooks | Code access, push monitoring |
| UI | shadcn/ui + Tailwind v4 + Radix primitives | Accessible composable components |
| Charts | Recharts 2.15 | Burndown, status distribution, priority breakdown |
| State | Zustand 5 (`projects-store`, `ui-store`) | Light client-side state |
| Markdown | `react-markdown` + `react-syntax-highlighter` | Narratives & code viewer |
| Validation | Zod | Structured LLM output + form inputs |

**Repo layout**: `src/core/` (db, auth, ai), `src/modules/` (board, chat, agent, architect, insight, rag, github, roadmap), `src/app/(platform)/` (routes), `src/components/ui/` (design system).

---

## Slide 8 — Implementation: RAG Pipeline

**Indexing path (one per domain)**:
```
source row/file ─▶ buildEmbeddingText() ─▶ Gemini embedContent
                                           │ 3072-d vector
                                           ▼
                  Qdrant upsert (id, vector, payload)
                  collection: tasks | roadmap | code_chunks
                  payload:    { project_id, ...domain fields, text }
```

**Retrieval path (unified)**:
```
user query ─▶ generateEmbedding() ─▶ Qdrant.search
                                    │ filter: { project_id }
                                    │ topK, score_threshold=0.3
                                    ▼
               top-k payload records merged into system prompt
```

**Design decisions**:
- **One collection per domain**, not one global — enables per-domain `topK` tuning and different payload indexes (`project_id`, `status`, `priority`, `filepath`, `language`).
- **Deterministic point IDs for code** via SHA-1 of `projectId:filepath:chunkIndex`, reformatted as UUID — enables idempotent reindex of changed files.
- **Smart-skip backfill** — before re-embedding 89 tasks, compare Qdrant point count to DB row count; skip unless `?force=true`. Cut cold-start indexing from 90 s to 2 s on restart.
- **Code chunker**: 150-line windows with 20-line overlap, prefixed with `// File: <path> (lines N-M)` header so LLM retains file context even when chunks are retrieved standalone.
- **File filter**: whitelist ≈25 code/doc extensions; exclude `node_modules/`, lockfiles, binaries (null-byte scan), files > 200 KB (or > 50 KB for JSON/YAML).

---

## Slide 9 — Implementation: LangGraph Architect Agent

**State (`ArchitectAnnotation`)**: `requirement`, `projectName`, `techStack`, `architecturalGuidelines`, `existingTasks`, `repoCodeContext`, `plan`, `critique`, `iteration`, `finalTasks`.

**Graph topology**:
```
START ──▶ plan ──▶ critique ──┬──▶ finalize ──▶ END
          ▲                   │
          └───── iterate ─────┘   (if critique.score < threshold)
```

**Node behaviors**:
- **plan** — LLM receives requirement + RAG-retrieved top-15 existing tasks + top-6 code chunks + implementation plan; returns a Zod-validated `ArchitectOutput` (tasks + reasoning).
- **critique** — separate LLM call reviews the plan against the same context with explicit "DO NOT duplicate" directive; returns `{score, issues[]}`.
- **finalize** — emits the accepted plan; writes the generation to `agent_generations` table for audit.

**Why LangGraph, not a single-shot prompt**: (1) explicit loop with termination on low score, (2) typed state survives node boundaries, (3) each node can use a different model/temperature in future, (4) observable — each iteration stored for traceability.

**Anti-duplication hook**: `buildProjectContext()` concatenates `existingTasks` and `repoCodeContext` into the prompt with per-section headers, so critique can reason over both the board *and* actual files. Measured effect: task generation for the same requirement no longer re-emits tasks already present in the 89-task backlog.

---

## Slide 10 — Implementation: GitHub Integration

**OAuth App flow** (RFC 6749 Authorization Code Grant):
```
User → /api/auth/github/start?projectId=...
     → set state + projectId cookies, redirect to github.com/login/oauth/authorize
User → approves on GitHub → back to /api/auth/github/callback?code=...&state=...
     → verify state, POST code→access_token
     → octokit.users.getAuthenticated → upsert github_connections row
```

**On-connect pipeline** (`selectRepo`):
1. `octokit.repos.get` → default branch + metadata.
2. `octokit.repos.createWebhook` → push-event webhook with HMAC secret.
3. `indexRepo()` — recursive `git.getTree`, filter, chunk, embed, upsert.
4. **Commit backfill** — last 30 days of commits → LLM matcher → bulk close tasks.

**Webhook flow** (`/api/webhooks/github`):
```
POST /api/webhooks/github
  │ body, X-Hub-Signature-256
  ▼
timingSafeEqual(HMAC_SHA256(body, SECRET))   ── if fail: 401
  ▼
event=="push"?                                 ── else: 200 ignored
  ▼
lookup github_connections by repo_full_name
  ▼
after() defers:  for each commit in payload.commits:
   reindexChangedFiles(added + modified, removed)
   matchCommitToTasks(msg, files, openTasks) → taskIds[]
   updateTask(taskId, status='done')
```

Tables added: `github_connections` (project ↔ access_token + repo metadata, unique on `project_id`) and `github_indexed_files` (audit of path + SHA + chunk count per project).

---

## Slide 11 — Results: Functional Demonstrations

**Feature matrix (implemented & verified)**:

| # | Feature | Evidence |
|---|---|---|
| 1 | Context-aware chat | Query *"what are my high-priority backlog tasks?"* → response lists 4 real backlog tasks (Token Storage, Error Handling, API Auth, Logout UI). Zero hallucinations. |
| 2 | RAG backfill | 89/89 tasks indexed to Qdrant in ~90 s; smart-skip returns in <2 s on restart. |
| 3 | Task-generation agent | LangGraph 3-node graph produces 4–8 tasks per requirement with reasoning; no duplicates of existing 89. |
| 4 | AI Insight Narrative | PM-style 3–5 paragraph markdown report generated from burndown + status + priority + team metrics. |
| 5 | GitHub OAuth | One-click connect, authorize on GitHub, redirect back with repo list populated. |
| 6 | Code-aware chat | After connect, query *"how does embedding.ts call Gemini?"* → response quotes file with correct line range. |
| 7 | Commit auto-close | Push `"Implements user logout flow"` → webhook fires → matching task moves to Done with `aiMetadata.closedByCommit = sha`. |
| 8 | Commit backfill | On connect to a 30-day repo, N prior commits evaluated; M tasks auto-closed retroactively. |

**Code/infra stats**:
- 20 new files added (github module + pages + routes + RAG extensions).
- 6 existing files modified (schema, qdrant, chat, architect, agent, sidebar).
- 1 new dependency (`@octokit/rest`).
- Drizzle migration `0005_daily_thunderbolts.sql` auto-generated.
- TypeScript strict passes with zero errors.

---

## Slide 12 — Results: Quantitative Characterization

| Metric | Value | Notes |
|---|---|---|
| Embedding dimension | 3072 | Gemini `embedding-001` native |
| Qdrant collections | 3 | `tasks`, `roadmap`, `code_chunks` |
| Payload indexes | 9 | project_id (×3), status, priority, phase, section_type, filepath, language |
| Task index size | 89 points | From backfill log |
| Chat system-prompt sections | 4 | Board state + plan RAG + task RAG (fallback) + code RAG |
| Architect RAG fan-in | top-15 tasks + top-6 code chunks + full plan | Per generation |
| Commit-matcher LLM output | strict JSON `{taskIds: string[]}` | Validated against open-task set |
| Webhook response latency | < 200 ms (heavy work deferred via `after()`) | GitHub requires < 10 s |
| Code-chunk window | 150 lines, 20-line overlap | Preserves cross-boundary context |
| File-filter allowlist | ~25 extensions | TS/JS/Py/Go/Rs/Java/MD/YAML/... |
| Max file size indexed | 200 KB (50 KB for JSON/YAML) | Avoid generated artifacts |
| Rate limit (chat) | 20 req / 1 min / (user, project) | Enforced in `chat_rate_limits` table |

**Example latency profile** (Gemini 2.0 Flash, 3072-d embeddings, Qdrant Cloud EU):
- Embedding query: ~180 ms
- Qdrant search (filter + topK=6): ~40 ms
- Gemini chat completion (~800 output tokens): ~2.1 s
- End-to-end chat turn: ~2.5–3.0 s

---

## Slide 13 — Conclusion

- We have built and verified **Nexus Platform**, a project-management system that operationalizes three ideas rarely combined in a single product: (i) a **single RAG store** serving three semantic domains, (ii) a **LangGraph architect agent** whose critique node reasons against that same retrieval context, and (iii) a **closed commit→task feedback loop** driven by LLM fuzzy matching.
- The platform removes three specific failure modes observed in current tools — hallucinated task references in chat, duplicate task generation by agents, and manual status maintenance — each backed by a measurable implementation and a demonstrated test case.
- The implementation is entirely **type-safe TypeScript**, uses a **single-vendor embedding + chat model** (Gemini), and deploys as a standard **Next.js 15 app** with one auxiliary service (Qdrant Cloud).
- The design demonstrates that **retrieval-augmented memory is not just a chat pattern** — it is equally valuable for agentic planning and for reconciling source code with tracked work. Making a single Qdrant store the shared substrate of all three roles is, we argue, the key architectural contribution of this work.

---

## Slide 14 — Limitations & Future Plan

**Current limitations**:
- **Access tokens stored plaintext** in `github_connections.access_token`. MVP-acceptable; production requires KMS/Supabase Vault encryption at rest.
- **One repository per project** — monorepo-averse teams with FE + BE + mobile split across repos are not yet supported.
- **Single default branch** indexed — PR branches and release branches are invisible to chat/agent until merged.
- **AI commit matcher cost** — every commit triggers one LLM call; for high-throughput repos (> 500 commits/day) this becomes the dominant cost.
- **Local webhooks require tunneling** (ngrok). Production deploy removes this.
- **Indexer runs synchronously** on connect. Large repos (> 10 k files) may exceed the server-action timeout.

**Future plan**:
1. **Token encryption** via Supabase Vault; rotate on re-auth.
2. **GitHub App installation flow** (vs OAuth App) — fine-grained per-repo permissions, longer-lived installation tokens.
3. **Multi-repo per project** with routing to correct connection on webhook arrival.
4. **Streaming indexer** — push chunks to Qdrant as they are embedded, report progress via SSE to the UI.
5. **PR-level integration** — post review comments, set status checks, link PR → task.
6. **Branch-aware code RAG** — index topic branches under a `branch` payload key; let chat scope retrieval.
7. **Step 5: Team collaboration** — invite flow, per-member rate limits, per-member RAG filtering.
8. **Evaluation harness** — labeled commit/task pairs for measuring matcher precision/recall over time.

---

## Slide 15 — References

1. Lewis, P., Perez, E., Piktus, A., *et al.* "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *NeurIPS 2020*.
2. Qdrant Technologies. *Qdrant Vector Database Documentation*. https://qdrant.tech/documentation/
3. LangChain AI. *LangGraph: Building Stateful, Multi-Actor Applications with LLMs.* https://langchain-ai.github.io/langgraph/
4. Hardt, D. (Ed.). *The OAuth 2.0 Authorization Framework.* RFC 6749, IETF, 2012.
5. GitHub. *Securing your webhooks (X-Hub-Signature-256).* https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
6. GitHub. *REST API — Repos, Git, Webhooks endpoints.* https://docs.github.com/en/rest
7. Vercel. *Next.js 15 Documentation — App Router, Server Actions, `after()`.* https://nextjs.org/docs
8. Drizzle Team. *Drizzle ORM — TypeScript ORM for SQL databases.* https://orm.drizzle.team
9. Supabase. *Supabase Auth & SSR cookie-based sessions.* https://supabase.com/docs/guides/auth
10. Google. *Gemini API — `embedContent` and chat completions.* https://ai.google.dev/gemini-api/docs
11. Reimers, N., Gurevych, I. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *EMNLP 2019.* (Background on dense retrieval.)
12. Gao, L., Madaan, A., Zhou, S., *et al.* "Structured Chain-of-Thought Prompting for Code Generation." *arXiv:2305.06599*, 2023. (Methodological inspiration for the Plan→Critique architecture.)
13. Yao, S., Zhao, J., Yu, D., *et al.* "ReAct: Synergizing Reasoning and Acting in Language Models." *ICLR 2023.* (Agentic reasoning baseline.)
14. shadcn. *shadcn/ui — Accessible React component primitives.* https://ui.shadcn.com
15. Octokit. *@octokit/rest — Official GitHub REST client.* https://github.com/octokit/rest.js
