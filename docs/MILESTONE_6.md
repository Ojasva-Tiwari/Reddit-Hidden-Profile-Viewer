# Milestone 6 — Evidence-Backed AI Profile Summary

**Completed**: 2026-09-01  
**Target Milestone**: Milestone 6 (Evidence-Backed AI Profile Summary / "30 Things")  
**Status**: `AI SUMMARY READY`

---

## 1. Overview & Objectives Achieved

Milestone 6 implements the Phase 2 AI synthesis engine: **"30 Things About This Profile"**. Using Google Gemini Flash models (`gemini-2.5-flash` / `gemini-2.0-flash` configurable via `GEMINI_MODEL`), the system derives structured, evidence-grounded behavioral insights from historical public Reddit activity. Every generated finding is strictly verified against real stored post and comment records before display.

```
                      ┌────────────────────────────────────────────────────────┐
                      │              Normalized Posts & Comments               │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │        Deterministic Signal & Evidence Selection       │
                      │   - Subreddit frequency, active years, topic terms     │
                      │   - Compact evidence records bounded for Gemini input  │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │            Gemini 2.0 Flash Synthesis Engine           │
                      │   - Strict system prompt & citation requirements       │
                      │   - Prohibition of sensitive personal attributes       │
                      │   - EXPLICIT / STRONGLY_SUPPORTED / WEAK_INFERENCE     │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │          Grounding Audit & Evidence Validation         │
                      │   - Validate all evidence IDs exist in candidate set   │
                      │   - Drop ungrounded or hallucinated citations          │
                      │   - Deduplicate similar titles & findings              │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
 ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
 │   PostgreSQL Persistence  │    │     Internal API Routes   │    │  Screen 8: AI Summary UI  │
 │  ai_insights table cache  │    │ GET /api/.../summary      │    │ 30 Things insight cards   │
 │  modelVersion & timestamps│    │ POST /api/.../refresh     │    │ View Evidence citation    │
 └───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 2. Server-Side AI Architecture

### 2.1 Schema & Validation (`src/lib/ai/schemas.ts`)
- **Categories**: `INTERESTS`, `MEDIA`, `FOOD`, `GAMES`, `HOBBIES`, `COMMUNITIES`, `ACTIVITY`, `COMMUNICATION`, `TIMELINE`, `NOTABLE_PUBLIC_EVENTS`.
- **Classification**:
  - `EXPLICIT`: User directly made the statement.
  - `STRONGLY_SUPPORTED`: Recurring evidence across multiple submissions/comments.
  - `WEAK_INFERENCE`: Plausible contextual observation.
- **Confidence**: `HIGH`, `MEDIUM`, `SPECULATIVE`.
- **No Filler Rule**: If insufficient evidence exists for 30 items, fewer than 30 are returned without padding.

### 2.2 Evidence Preparation & Deterministic Signals (`src/lib/ai/evidence.ts`)
- Extracts deterministic metrics (posts/comments ratio, top subreddits with percentages, active years, frequent topic terms) to aid LLM reasoning.
- Compacts candidate records into bounded evidence objects `{ id, type, subreddit, createdAt, status, score, title, content }` capped at 400 characters per item.

### 2.3 Gemini Client & Prompts (`src/lib/ai/gemini.ts`, `src/lib/ai/prompts.ts`)
- Server-side only client configured with `GEMINI_API_KEY`.
- Prohibits hallucination, outside web research, and inferring sensitive personal attributes (religion, medical condition, political affiliation, sexual orientation, race, exact location, financial status, criminal history).
- Restricts the term "favorite" to instances where the user explicitly described something as such.

### 2.4 Evidence Validation Engine (`src/server/services/ai-summary.service.ts`)
- **Strict Grounding**: Evaluates every `evidenceId` in the LLM response against the candidate evidence set. Any insight citing non-existent or unresolvable IDs is immediately dropped.
- **Deduplication**: Eliminates duplicate findings and re-indexes valid insights sequentially from `#1`.
- **Caching & Refresh**: Checks PostgreSQL for cached summaries; supports explicit refresh via `POST /api/profile/[username]/summary/refresh` protected by strict rate limits.

---

## 3. Frontend Integration (`src/app/u/[username]/ai-summary/page.tsx`)

- Connects to `/api/profile/[username]/summary` with dynamic category filtering.
- Displays insight cards with sequence numbers (`#01` to `#30`), Title, Finding, Classification Badge, Confidence Badge, and Grounded Citations.
- **`[VIEW EVIDENCE CITATION]`**: Directly fetches the authentic database/archival record and opens `EvidenceViewModal`.
- Supports all application states: `LOADING`, `READY`, `INSUFFICIENT_DATA`, `RATE_LIMITED`, `AI_UNAVAILABLE`, `ERROR`.

---

## 4. Verification Results

### 4.1 Automated Test Suite (`scripts/test-milestone6.ts`)
- **Schema Validation**: Parses valid insights, rejects invalid categories (**Passed**).
- **Exact 30-Item Handling**: Validates full 30 insight arrays (**Passed**).
- **Fewer-Than-30 Handling**: Validates non-padded output when archive data is sparse (**Passed**).
- **Deterministic Signal Extraction**: Aggregates top subreddits, counts, and ratios (**Passed**).
- **Evidence Selection & Compaction**: Formats compact records (**Passed**).
- **Grounding Audit**: Retains valid insights and drops hallucinated IDs (**Passed**).
- **Deduplication**: Filters out duplicate insight titles (**Passed**).
- **Insufficient Archival Data**: Returns `INSUFFICIENT_DATA` when evidence count < 3 (**Passed**).
- **Gemini Unavailable**: Gracefully returns `AI_UNAVAILABLE` when unconfigured (**Passed**).

**Result**: `16/16 Tests Passed`.

### 4.2 Live Smoke Test (`scripts/smoke-test-milestone6.ts`)
- Tested execution environment:
  `LIVE GEMINI TEST NOT RUN — API KEY NOT CONFIGURED` (Handled gracefully as specified).

---

## 5. Commands Run & Build Verification

| Command | Exit Code | Result |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | `0` | **0 Errors** |
| `npm run lint` (`next lint`) | `0` | **0 Errors** |
| `npm run test` (`scripts/test-milestone6.ts`) | `0` | **16 Passed** |
| `npm run test:milestone5` (Regression) | `0` | **19 Passed** |
| `npm run test:milestone4` (Regression) | `0` | **27 Passed** |
| `npm run test:smoke` (`scripts/smoke-test-milestone6.ts`) | `0` | **Passed (Unconfigured key message)** |
| `npm run build` (`next build`) | `0` | **All 8 screens compiled** |
