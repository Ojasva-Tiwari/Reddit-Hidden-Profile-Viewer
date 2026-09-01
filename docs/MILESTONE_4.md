# Milestone 4 — Internal API & Real Phase 1 Data Integration

**Completed**: 2026-09-01  
**Target Milestone**: Milestone 4 (Internal API Layer + Production Phase 1 Data)  
**Status**: `PHASE 1 API READY`

---

## 1. Overview & Objectives Achieved

Milestone 4 establishes the complete production Next.js App Router Route Handler layer, services orchestration, sliding-window rate limiting, and Zod parameter validation. All approved Stitch Forensic Archive screens are connected to live normalized data from Arctic Shift and PostgreSQL with fallback caching.

```
Client Browser (Stitch UI)
           ↓
Next.js App Router Route Handler (`/api/...`)
           ↓
Zod Validation & Rate Limiter Middleware
           ↓
Server Service Layer (`SearchService`, `ProfileService`, `PostService`, `CommentService`, `ActivityService`, `TimelineService`, `ContentService`)
           ↓
Repository / Pluggable DataSource Layer
           ↓
PostgreSQL Database / Arctic Shift API
```

---

## 2. Implemented Route Handlers

All routes return a standardized response envelope:
- **Success**: `{ "data": ..., "meta": { "source": "...", "cached": boolean, ... } }`
- **Error**: `{ "error": { "code": "...", "message": "..." } }`

| Route | Method | Description | Parameters / Filters |
|---|---|---|---|
| `/api/search/user` | `GET` | Validates target, checks local DB first, then queries upstream | `username` |
| `/api/profile/[username]` | `GET` | Consolidated profile metadata, karma, account ages, sync status | `username` |
| `/api/profile/[username]/posts` | `GET` | Paginated historical submissions | `page`, `limit`, `sort`, `status`, `subreddit`, `search`, `from`, `to`, `hasMedia` |
| `/api/profile/[username]/comments` | `GET` | Paginated comments with parent context | `page`, `limit`, `sort`, `status`, `subreddit`, `search`, `from`, `to` |
| `/api/profile/[username]/activity` | `GET` | Multi-dimensional activity distributions | `username` |
| `/api/profile/[username]/timeline` | `GET` | Merged chronological stream of submissions and comments | `limit`, `sort`, `type`, `status`, `subreddit`, `year` |
| `/api/content/[id]` | `GET` | Detailed post or comment record with provenance and media | `id` (Reddit fullname or ID) |
| `/api/evidence/[id]` | `GET` | Archival evidence citation links | `id` (Reddit fullname) |
| `/api/profile/[username]/sync` | `POST` | Triggers background historical sync | `username` |

---

## 3. Frontend Screen Integration

| Stitch Screen | Route | Connected API | Key Features |
|---|---|---|---|
| **Home Search** | `/` | `/api/search/user` | Real validation, quick demo targets, leading `u/` stripping |
| **Profile Overview** | `/u/[username]` | `/api/profile/[username]` | Live karma, verified badge, avatar/monogram, sync trigger |
| **Posts Feed** | `/u/[username]/posts` | `/api/profile/[username]/posts` | Real pagination, keyword search, status filtering, sort options, ContentDetailModal |
| **Comments Feed** | `/u/[username]/comments` | `/api/profile/[username]/comments` | Real pagination, keyword search, parent context preview, ContentDetailModal |
| **Activity Breakdown** | `/u/[username]/activity` | `/api/profile/[username]/activity` | Subreddit share bar charts, 24-hour UTC frequency bars, 7-day engagement cycle |
| **Timeline** | `/u/[username]/timeline` | `/api/profile/[username]/timeline` | Combined post/comment chronological stream with annual anchor nodes |

---

## 4. Security, Resilience & Rate Limiting

1. **Zod Query Validation**:
   - `usernameParamSchema`: Rejects invalid characters, strips leading `u/`, enforces 3-30 character length.
   - `postsQuerySchema` / `commentsQuerySchema` / `timelineQuerySchema`: Enforces min/max page limits (`1-100`), enum validation (`VISIBLE`, `DELETED`, `REMOVED`, `EDITED`), and numeric coercion.
2. **Sliding-Window Rate Limiting**:
   - `checkRateLimit(ip, 60)` protects public search and feed endpoints from automated flooding.
   - Returns standard HTTP 429 with reset duration.
3. **SSRF & Data Sanitization**:
   - No user-controlled URLs fetched server-side.
   - Upstream objects sanitized and normalized before sending to client.

---

## 5. Automated & Live Verification

### 5.1 Automated Test Suite (`scripts/test-milestone4.ts`)
- **Profile & Search**: Valid profile extraction, karma mapping (**Passed**).
- **Validation**: Rejection of malformed usernames and 404 on unknown accounts (**Passed**).
- **Posts Querying**: Pagination, status filtering (`DELETED`), subreddit filtering, and keyword search (**Passed**).
- **Comments Querying**: Status filtering (`EDITED`), keyword searching (**Passed**).
- **Activity Distribution**: Subreddit shares, 24 UTC hourly bins, 7 weekly days (**Passed**).
- **Timeline Merging**: Combined post/comment stream, deterministic tie-breaking (**Passed**).
- **Rate Limiting**: Sliding window enforcement (**Passed**).
- **Zod Schemas**: Type coercion and validation rules (**Passed**).

**Result**: `27/27 Tests Passed`.

### 5.2 Live Smoke Test (`scripts/smoke-test-milestone4.ts`)
- Live target: `u/spez`
- **Stage 1 (Search)**: Live profile matched via upstream.
- **Stage 2 (Profile)**: Profile details and metadata loaded.
- **Stage 3 (Posts)**: 5 real posts retrieved from Arctic Shift.
- **Stage 4 (Comments)**: 5 real comments retrieved from Arctic Shift.
- **Stage 5 (Activity)**: Subreddit distribution calculated (`r/RDDT` at 19.5%).
- **Stage 6 (Timeline)**: Chronological timeline stream constructed.

**Result**: `ALL 6 STAGES PASSED`.

---

## 6. Verification Commands Run

| Command | Exit Code | Result |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | `0` | **0 Errors** |
| `npm run lint` (`next lint`) | `0` | **0 Errors** |
| `npm run test` (`scripts/test-milestone4.ts`) | `0` | **27 Passed** |
| `npm run test:smoke` (`scripts/smoke-test-milestone4.ts`) | `0` | **6 Stages Passed** |
| `npm run build` (`next build`) | `0` | **All routes compiled** |
