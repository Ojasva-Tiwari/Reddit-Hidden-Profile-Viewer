# Implementation Milestone 2 — Database Foundation

## Summary of Completed Work
Milestone 2 establishes the database and data-access layer for **Reddit Hidden Profile Viewer** using PostgreSQL, Drizzle ORM, and typed repository abstractions. The schema faithfully implements the approved design in [`docs/DATABASE_SCHEMA.md`](file:///d:/Reddit-Hidden-Profile-Viewer/docs/DATABASE_SCHEMA.md), preserving original Reddit fullname IDs (`t2_`, `t3_`, `t1_`), revision diff histories, and evidence links for AI insights.

---

## 1. Dependencies Added

```json
{
  "dependencies": {
    "dotenv": "^16.4.7",
    "drizzle-orm": "^0.38.4",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "@types/pg": "^8.11.11",
    "drizzle-kit": "^0.30.2",
    "tsx": "^4.19.2"
  }
}
```

---

## 2. Database Schema Implemented

The schema is defined in [`src/db/schema.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/db/schema.ts):

### 2.1 Custom Enums
- **`content_status`**: `VISIBLE`, `DELETED`, `REMOVED`, `EDITED`, `DELETED_LATER`, `INITIALLY_UNAVAILABLE`.
- **`media_status`**: `MEDIA_AVAILABLE`, `ARCHIVED_COPY`, `THUMBNAIL_AVAILABLE`, `MEDIA_REFERENCE_ONLY`, `MEDIA_UNAVAILABLE`.
- **`confidence_level`**: `HIGH`, `MEDIUM`, `SPECULATIVE`.
- **`claim_classification`**: `EXPLICIT`, `STRONGLY_SUPPORTED`, `WEAK_INFERENCE`.
- **`sync_status`**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `PARTIAL`, `FAILED`.

### 2.2 Table Definitions (9 Tables)
1. **`users`**: Canonical Reddit profiles, avatar URLs, registration timestamps, total/link/comment karma, suspension/deletion flags, and sync progression state.
2. **`subreddits`**: Normalized subreddit directory with subscriber counts and NSFW/quarantine flags.
3. **`posts`**: Submissions with Reddit fullname (`t3_`), author reference, score, comment counts, content status, media status, and raw JSON payload.
4. **`comments`**: Historical comments with Reddit fullname (`t1_`), parent context pointers (`parentId`, `postRedditId`), scores, and edit timestamps.
5. **`provenance_metadata`**: Append-only revision audit log storing previous/current content snapshots, unified diff patches, and capture timestamps.
6. **`media_references`**: External media URLs, extracted thumbnails, archived copies, and availability status.
7. **`activity_aggregates`**: Pre-aggregated time-series breakdowns (by year, month, subreddit, day-of-week, hour-of-day).
8. **`ai_insights`**: Synthesized "30 Things About This Profile" insights with confidence ratings, classification tags, and grounding summaries.
9. **`evidence_links`**: Junction table connecting AI insights to exact post/comment records with quote snippets and relevance scores.

### 2.3 Key Indexes Designed
- `idx_users_username` on `LOWER(username)`
- `idx_posts_author_created` on `(authorId, createdUtc DESC)`
- `idx_comments_author_created` on `(authorId, createdUtc DESC)`
- `idx_posts_reddit_id` on `posts.redditId` (`t3_...`)
- `idx_comments_reddit_id` on `comments.redditId` (`t1_...`)
- `idx_provenance_target` on `(targetType, targetId)`
- `idx_evidence_insight` on `evidence_links.insightId`

---

## 3. Repository Layer Implemented

Located in [`src/server/repositories/`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/):

| Repository | File | Primary Methods |
|---|---|---|
| **UserRepository** | [`user.repository.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/user.repository.ts) | `findByUsername`, `findById`, `upsertUser`, `updateSyncStatus` |
| **PostRepository** | [`post.repository.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/post.repository.ts) | `insertPost`, `insertBatch`, `findByRedditId`, `findByAuthorId`, `countByAuthorId` |
| **CommentRepository** | [`comment.repository.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/comment.repository.ts) | `insertComment`, `insertBatch`, `findByRedditId`, `findByAuthorId`, `countByAuthorId` |
| **ActivityRepository** | [`activity.repository.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/activity.repository.ts) | `upsertAggregate`, `findByUserAndType`, `findSummaryByUserId` |
| **AIRepository** | [`ai.repository.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/ai.repository.ts) | `insertInsight`, `findByUserId`, `findWithEvidence` |
| **EvidenceRepository** | [`evidence.repository.ts`](file:///d:/Reddit-Hidden-Profile-Viewer/src/server/repositories/evidence.repository.ts) | `insertEvidence`, `findByInsightId`, `findByRedditFullname` |

---

## 4. Migrations & Seed Infrastructure

### 4.1 NPM Scripts Added
- `npm run db:generate` — Generates SQL migration scripts using `drizzle-kit`.
- `npm run db:migrate` — Executes migrations against the configured PostgreSQL database.
- `npm run db:push` — Direct schema push for fast prototyping.
- `npm run db:studio` — Opens Drizzle Studio graphical data browser.
- `npm run db:seed` — Seeds development environment with fake test users (`demo_user`, `archive_test`).

### 4.2 Initial Migration Generated
Generated at [`drizzle/0000_chunky_rictor.sql`](file:///d:/Reddit-Hidden-Profile-Viewer/drizzle/0000_chunky_rictor.sql) containing all 9 tables, 5 enums, and foreign key relations.

---

## 5. Development Setup & Environment Variables

Create a local `.env` file based on [`.env.example`](file:///d:/Reddit-Hidden-Profile-Viewer/.env.example):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reddit_archive
NODE_ENV=development
PORT=3000
```

### Initializing a Local Database:
1. Start PostgreSQL (e.g. via Docker or local service):
   ```bash
   docker run --name reddit-archive-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=reddit_archive -p 5432:5432 -d postgres:16-alpine
   ```
2. Run database migration:
   ```bash
   npm run db:migrate
   ```
3. Seed development data:
   ```bash
   npm run db:seed
   ```

---

## 6. Validation Results

| Test | Command | Result |
|---|---|---|
| **Drizzle Migration Generation** | `npm run db:generate` | **0 Errors** (Created `drizzle/0000_chunky_rictor.sql`) |
| **TypeScript Strict Verification** | `npm run typecheck` (`tsc --noEmit`) | **0 Errors** (Clean exit code 0) |
| **Next.js Production Build** | `npm run build` | **0 Errors** (All 8 routes compiled cleanly) |
