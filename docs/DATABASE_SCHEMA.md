# Reddit Hidden Profile Viewer — Database Schema Specification

## 1. Overview & Principles

The database schema is engineered for **PostgreSQL 15+** with strong relational integrity, time-series indexing, and immutable provenance tracking.

### Core Design Rules:
1. **Source ID Preservation**: Reddit fullname IDs (`t2_` for users, `t3_` for posts, `t1_` for comments, `t5_` for subreddits) are stored alongside internal UUIDs.
2. **Explicit State Tracking**: Content states are tracked via typed ENUMs representing their historical lifecycle.
3. **Revision History**: Multiple revisions of edited or removed content are preserved as append-only provenance records.
4. **Verifiable Citations**: Every AI insight references foreign keys to validated posts or comments.

---

## 2. Custom Enumeration Types

```sql
-- Historical content lifecycle states
CREATE TYPE content_status AS ENUM (
    'VISIBLE',               -- Active, public, unmoderated
    'DELETED',               -- Deleted by author
    'REMOVED',               -- Removed by subreddit moderators or Reddit spam filters
    'EDITED',                -- Content body was modified after initial submission
    'DELETED_LATER',         -- Initially visible in historical archive, but missing in subsequent snapshots
    'INITIALLY_UNAVAILABLE'  -- Content could not be retrieved from initial ingestion
);

-- Media availability lifecycle states
CREATE TYPE media_status AS ENUM (
    'MEDIA_AVAILABLE',       -- Source URL confirmed accessible
    'ARCHIVED_COPY',         -- Stored permanently in local/cloud archival storage
    'THUMBNAIL_AVAILABLE',   -- Low-res thumbnail extracted from metadata
    'MEDIA_REFERENCE_ONLY',  -- Raw URL known, but not verified/accessible
    'MEDIA_UNAVAILABLE'      -- Confirmed 404, broken, or scrubbed
);

-- AI insight confidence levels
CREATE TYPE confidence_level AS ENUM (
    'HIGH',                  -- 85%+ certainty backed by direct primary evidence
    'MEDIUM',                -- 60-84% certainty with consistent secondary signals
    'SPECULATIVE'            -- 40-59% hypothesis based on contextual patterns
);

-- AI insight claim classification
CREATE TYPE claim_classification AS ENUM (
    'EXPLICIT',              -- User stated fact directly (e.g., "I work as a Rust developer")
    'STRONGLY_SUPPORTED',    -- Directly inferred from overwhelming consistent activity
    'WEAK_INFERENCE'         -- Nuanced behavioral pattern or contextual assumption
);

-- Ingestion job status
CREATE TYPE sync_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'PARTIAL',
    'FAILED'
);
```

---

## 3. Entity Relational Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │◄──────┤      posts      │◄──────┤   comments      │
├─────────────────┤1     *├─────────────────┤1     *├─────────────────┤
│ id (UUID)       │       │ id (UUID)       │       │ id (UUID)       │
│ username        │       │ reddit_id (t3_) │       │ reddit_id (t1_) │
│ sync_status     │       │ author_id       │       │ post_id         │
└────────┬────────┘       │ subreddit_id    │       │ author_id       │
         │                │ status          │       │ parent_id       │
         │                └────────┬────────┘       │ status          │
         │                         │                └────────┬────────┘
         │                         │1                        │1
         │                         │*                        │*
         │                ┌────────▼─────────────────────────▼────────┐
         │                │           provenance_metadata             │
         │                ├───────────────────────────────────────────┤
         │                │ id (UUID)                                 │
         │                │ target_type ('POST' | 'COMMENT')          │
         │                │ target_id                                 │
         │                │ previous_body / current_body / diff_patch │
         │                └───────────────────────────────────────────┘
         │
         │1
         ├──────────────────────────────┐
         │*                             │*
┌────────▼────────┐            ┌────────▼────────┐
│   ai_insights   │            │activity_stats   │
├─────────────────┤            ├─────────────────┤
│ id (UUID)       │            │ id (UUID)       │
│ user_id         │            │ user_id         │
│ insight_index   │            │ period_start    │
│ title           │            │ post_count      │
│ classification  │            │ comment_count   │
│ confidence      │            │ removed_count   │
└────────┬────────┘            └─────────────────┘
         │1
         │*
┌────────▼────────┐
│ evidence_links  │
├─────────────────┤
│ id (UUID)       │
│ insight_id      │
│ post_id (opt)   │
│ comment_id (opt)│
│ quote_snippet   │
└─────────────────┘
```

---

## 4. Table Definitions

### 4.1 `users`
Represents analyzed Reddit user accounts.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reddit_id VARCHAR(32) UNIQUE,            -- e.g. "t2_12345abc" (NULL if deleted/unknown)
    username VARCHAR(64) NOT NULL UNIQUE,     -- Canonical case-insensitive handle
    avatar_url TEXT,
    created_utc TIMESTAMP WITH TIME ZONE,     -- Account registration timestamp
    first_seen_utc TIMESTAMP WITH TIME ZONE,  -- Oldest recorded activity timestamp
    last_seen_utc TIMESTAMP WITH TIME ZONE,   -- Most recent recorded activity timestamp
    total_karma INT DEFAULT 0,
    link_karma INT DEFAULT 0,
    comment_karma INT DEFAULT 0,
    is_suspended BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    sync_status sync_status DEFAULT 'PENDING',
    sync_progress_percent INT DEFAULT 0,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users (LOWER(username));
CREATE INDEX idx_users_sync_status ON users (sync_status);
```

### 4.2 `subreddits`
Normalized directory of subreddits where users participated.

```sql
CREATE TABLE subreddits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reddit_id VARCHAR(32) UNIQUE,            -- e.g. "t5_2qh1i"
    name VARCHAR(64) NOT NULL UNIQUE,         -- e.g. "askreddit"
    display_name VARCHAR(64) NOT NULL,        -- e.g. "AskReddit"
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_quarantined BOOLEAN DEFAULT FALSE,
    created_utc TIMESTAMP WITH TIME ZONE,
    subscribers_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subreddits_name ON subreddits (LOWER(name));
```

### 4.3 `posts`
Historical Reddit submission records.

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reddit_id VARCHAR(32) NOT NULL UNIQUE,    -- e.g. "t3_xj9k2q"
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    author_username VARCHAR(64) NOT NULL,
    subreddit_id UUID REFERENCES subreddits(id) ON DELETE SET NULL,
    subreddit_name VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    selftext TEXT DEFAULT '',
    url TEXT,
    permalink TEXT NOT NULL,
    score INT DEFAULT 0,
    upvote_ratio NUMERIC(4,3),
    num_comments INT DEFAULT 0,
    created_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    edited_utc TIMESTAMP WITH TIME ZONE,
    status content_status DEFAULT 'VISIBLE',
    media_status media_status DEFAULT 'MEDIA_REFERENCE_ONLY',
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_spoiler BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    raw_payload JSONB,                        -- Full original source JSON from Arctic Shift
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_author_created ON posts (author_id, created_utc DESC);
CREATE INDEX idx_posts_subreddit ON posts (subreddit_id);
CREATE INDEX idx_posts_status ON posts (status);
CREATE INDEX idx_posts_score ON posts (score DESC);
CREATE INDEX idx_posts_reddit_id ON posts (reddit_id);
CREATE INDEX idx_posts_raw_search ON posts USING GIN (to_tsvector('english', title || ' ' || selftext));
```

### 4.4 `comments`
Historical Reddit comment records.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reddit_id VARCHAR(32) NOT NULL UNIQUE,    -- e.g. "t1_gm7n8x"
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    post_reddit_id VARCHAR(32) NOT NULL,      -- "t3_..."
    parent_id VARCHAR(32) NOT NULL,           -- "t1_..." or "t3_..."
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    author_username VARCHAR(64) NOT NULL,
    subreddit_id UUID REFERENCES subreddits(id) ON DELETE SET NULL,
    subreddit_name VARCHAR(64) NOT NULL,
    body TEXT NOT NULL,
    permalink TEXT,
    score INT DEFAULT 0,
    created_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    edited_utc TIMESTAMP WITH TIME ZONE,
    status content_status DEFAULT 'VISIBLE',
    is_distinguished VARCHAR(16),             -- 'moderator', 'admin', NULL
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_author_created ON comments (author_id, created_utc DESC);
CREATE INDEX idx_comments_post ON comments (post_id);
CREATE INDEX idx_comments_status ON comments (status);
CREATE INDEX idx_comments_reddit_id ON comments (reddit_id);
CREATE INDEX idx_comments_parent ON comments (parent_id);
CREATE INDEX idx_comments_raw_search ON comments USING GIN (to_tsvector('english', body));
```

### 4.5 `provenance_metadata`
Immutable audit log of historical modifications, diffs, and deletions.

```sql
CREATE TABLE provenance_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(16) NOT NULL,        -- 'POST' or 'COMMENT'
    target_id UUID NOT NULL,                 -- References posts.id or comments.id
    target_reddit_id VARCHAR(32) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    status_at_snapshot content_status NOT NULL,
    previous_content TEXT,
    current_content TEXT,
    diff_patch TEXT,                         -- Unified diff representation
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_origin VARCHAR(64) NOT NULL       -- 'ARCTIC_SHIFT', 'WAYBACK', 'REDDIT_LIVE'
);

CREATE INDEX idx_provenance_target ON provenance_metadata (target_type, target_id);
```

### 4.6 `media_references`
Catalog of media assets attached to submissions.

```sql
CREATE TABLE media_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    archive_url TEXT,
    media_type VARCHAR(32),                  -- 'IMAGE', 'VIDEO', 'GALLERY', 'EXTERNAL_LINK'
    status media_status DEFAULT 'MEDIA_REFERENCE_ONLY',
    http_status_code INT,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_media_post ON media_references (post_id);
CREATE INDEX idx_media_status ON media_references (status);
```

### 4.7 `activity_aggregates`
Pre-calculated chronological and categorical breakdowns for fast UI rendering.

```sql
CREATE TABLE activity_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(16) NOT NULL,        -- 'YEAR', 'MONTH', 'SUBREDDIT', 'DAY_OF_WEEK', 'HOUR_OF_DAY'
    period_key VARCHAR(64) NOT NULL,         -- e.g. "2023", "2023-08", "askreddit", "MONDAY", "14"
    post_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    deleted_post_count INT DEFAULT 0,
    deleted_comment_count INT DEFAULT 0,
    removed_post_count INT DEFAULT 0,
    removed_comment_count INT DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_activity_user_period ON activity_aggregates (user_id, period_type, period_key);
```

### 4.8 `ai_insights`
Stores the generated "30 Things About This Profile" insights per user.

```sql
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_index INT NOT NULL,              -- 1 to 30
    category VARCHAR(64) NOT NULL,           -- 'TECH_PROFESSION', 'HABITS', 'POLITICAL_LEANING', 'GAMING', etc.
    title VARCHAR(256) NOT NULL,
    finding TEXT NOT NULL,
    confidence confidence_level NOT NULL,
    classification claim_classification NOT NULL,
    reasoning TEXT NOT NULL,
    model_version VARCHAR(64) NOT NULL,      -- e.g. "gemini-2.0-flash"
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ai_insights_user_index ON ai_insights (user_id, insight_index);
```

### 4.9 `evidence_links`
Strict junction table linking AI insights to primary source records.

```sql
CREATE TABLE evidence_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES ai_insights(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reddit_fullname VARCHAR(32) NOT NULL,    -- "t3_..." or "t1_..."
    quote_snippet TEXT NOT NULL,             -- The exact extracted phrase/sentence
    relevance_score NUMERIC(3,2),            -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_evidence_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE INDEX idx_evidence_insight ON evidence_links (insight_id);
CREATE INDEX idx_evidence_post ON evidence_links (post_id);
CREATE INDEX idx_evidence_comment ON evidence_links (comment_id);
```
