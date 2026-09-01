# Reddit Hidden Profile Viewer — System Architecture

## 1. Architectural Overview

**Reddit Hidden Profile Viewer** is a high-density, forensic-grade research platform designed to reconstruct, analyze, and synthesize historical Reddit user activity, removed/edited content, and behavioral provenance.

The system is architected in two primary phases:
1. **Phase 1: Historical Profile Reconstruction & Exploration** — In-site workbench viewer for profile timelines, post/comment histories, diffs/edits, and content statuses.
2. **Phase 2: Evidence-Backed AI Profiling ("30 Things")** — Deterministic evidence extraction pipeline generating strictly grounded, classified, and cited behavioral insights via Gemini.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Browser / Client Application                       │
│  (Next.js App Router, Tailwind CSS, Material Symbols, Theme Engine)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Next.js Backend & API Gateway Layer                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   Route Handlers (/api/profile, /api/search, /api/evidence, etc.)  │  │
│  └──────────────────┬─────────────────────────────┬──────────────────┘  │
│                     │                             │                     │
│  ┌──────────────────▼──────────┐   ┌──────────────▼──────────────────┐  │
│  │     Data Normalization &     │   │      AI Synthesis Pipeline      │  │
│  │     Provenance Engine       │   │  (Evidence Extractor + Gemini)  │  │
│  └──────────────────┬──────────┘   └──────────────┬──────────────────┘  │
│                     │                             │                     │
│  ┌──────────────────▼─────────────────────────────▼──────────────────┐  │
│  │                 Data Source Abstraction Interface                 │  │
│  │   ┌───────────────────────┬───────────────────┬───────────────┐   │  │
│  │   │   ArcticShiftSource   │ FutureRedditSource│ LocalArchive  │   │  │
│  │   └───────────────────────┴───────────────────┴───────────────┘   │  │
│  └──────────────────┬─────────────────────────────┬──────────────────┘  │
└─────────────────────┼─────────────────────────────┼─────────────────────┘
                      │                             │
       ┌──────────────▼──────────────┐       ┌──────▼─────────────────────┐
       │     PostgreSQL Database     │       │    Redis Cache / Memory    │
       │ (Profiles, Posts, Comments, │       │  (Rate limits, API Cache,  │
       │  AI Insights, Provenance)   │       │   Active Job Sessions)     │
       └─────────────────────────────┘       └────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS configured with the Stitch *Forensic Archive* design tokens
- **Typography**: `Inter` (UI/Content) & `JetBrains Mono` (Metadata/Code/Timestamps)
- **Icons**: Material Symbols Outlined (`data-icon`)
- **State Management**: React Query (TanStack Query) for server state caching + React Context for active workbench session & theme selection.

### 2.2 Theme System (Dark / Light / AMOLED)
The system supports three native modes conforming to the Stitch design specifications:

| Theme | Class | Canvas Background | Surface / Cards | Hairline Borders | Primary Accent |
|---|---|---|---|---|---|
| **Dark (Default)** | `.dark` | `#121212` / `#131313` | `#1A1A1A` / `#201F1F` | `#30363D` | `#FFB598` / `#D96A38` |
| **AMOLED** | `.amoled` | `#000000` | `#0D1117` | `#21262D` | `#FFB598` / `#D96A38` |
| **Light (Archival)** | `.light` | `#F5F5F5` | `#FFFFFF` | `#D1D5DA` | `#A04010` / `#D96A38` |

- **Persistence**: `localStorage.getItem("theme")` with fallback to system `prefers-color-scheme`.
- **FOUC Prevention**: Inline blocking script in `app/layout.tsx` to set the theme class before initial paint.

### 2.3 Route & Stitch Screen Mapping

The 8 Stitch-generated screens are mapped into Next.js App Router pages and reusable modal components:

```
src/app/
├── layout.tsx                                 # Global shell, font injection, ThemeProvider, Footer
├── page.tsx                                   # Landing & Username Search View
└── u/
    └── [username]/
        ├── layout.tsx                         # Workbench Shell: TopNavBar + 300px WorkbenchSidebar
        ├── page.tsx                           # Screen 1: Profile Overview Hub
        ├── posts/page.tsx                     # Screen 2: Posts Feed with Status Filter
        ├── activity/page.tsx                  # Screen 3: Activity Breakdown & Distribution
        ├── comments/page.tsx                  # Screen 4: Comments Feed with Parent Context
        ├── timeline/page.tsx                  # Screen 5: Chronological Activity Timeline
        └── ai-summary/page.tsx                # Screen 8: "30 Things About This Profile"
```

#### Screen Component Breakdown:
1. **Screen 1: Profile Overview (`ad01872de42e43c39d903055ec81ea79`)** -> `src/app/u/[username]/page.tsx`
2. **Screen 2: Posts Feed (`4f9ff12a2bda498384ec6c01951ddbfa`)** -> `src/app/u/[username]/posts/page.tsx`
3. **Screen 3: Activity Overview (`37197d3de5a644bd9539b7a5c1f83e00`)** -> `src/app/u/[username]/activity/page.tsx`
4. **Screen 4: Comments Feed (`ce8eaa3fc4fc41379bbf0afe8cab598a`)** -> `src/app/u/[username]/comments/page.tsx`
5. **Screen 5: Timeline (`c90997ba20cd4a34b3c1f87f0cc1fad7`)** -> `src/app/u/[username]/timeline/page.tsx`
6. **Screen 6: Content Detail View (`c882fd850c484b2eb30de1e772a5bd7a`)** -> **Reusable Modal Component**: `ContentDetailModal.tsx` (Triggered from posts, comments, and timeline)
7. **Screen 7: Evidence View (`2f92b55ef7d245e686bf0b29f232f2f1`)** -> **Reusable Modal Component**: `EvidenceViewModal.tsx` (Triggered from AI summary insight cards)
8. **Screen 8: AI Profile Summary (`beed1b17edba4b97ac99b3cfc6bbc74b`)** -> `src/app/u/[username]/ai-summary/page.tsx`

---

## 3. Backend Architecture & Data Source Abstraction

### 3.1 Pluggable Data Source Architecture

To prevent vendor lock-in and decouple the ingestion mechanism from the database/UI, all data ingestion is mediated through a standardized TypeScript interface:

```typescript
export interface IRedditDataSource {
  readonly name: string;
  
  getUserProfile(username: string): Promise<RawUserProfile | null>;
  getUserPosts(params: FetchContentParams): Promise<PaginatedResult<RawPost>>;
  getUserComments(params: FetchContentParams): Promise<PaginatedResult<RawComment>>;
  getUserAggregates?(username: string): Promise<RawUserAggregates | null>;
  checkHealth(): Promise<DataSourceHealth>;
}
```

Implementations:
1. **`ArcticShiftSource`** *(Primary)*: Communicates with Arctic Shift API (`https://arctic-shift.photon-reddit.com` / `https://api.pullpush.io`).
2. **`FutureRedditSource`**: Official Reddit OAuth API fallback / live verification provider.
3. **`LocalArchiveSource`**: Ingests offline JSONL/NDJSON datasets from local research dumps.

### 3.2 Data Tiering & Caching Strategy

```
┌─────────────────────────┬────────────────────────────────────────────────────────┐
│ Tier                    │ Data Handling Policy                                   │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Live / Ephemeral        │ Real-time Reddit profile existence check & live karma  │
│ Cached (Redis/Memory)   │ Search query responses (TTL: 1h), API rate limiter     │
│ Normalized & Stored     │ Ingested Posts, Comments, Subreddits, Diffs, MediaRefs  │
│ Computed on Demand      │ Subreddit distribution, activity heatmaps, hour trends │
│ AI Generated & Stored   │ "30 Things" AI insights and verified evidence links    │
└─────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 4. Media Provenance Pipeline

The media pipeline ensures that external media references are never falsely represented as permanent archival assets:

```
                     ┌─────────────────────────────┐
                     │     Post / Comment Record   │
                     └──────────────┬──────────────┘
                                    │ Inspect URL & Metadata
            ┌───────────────────────┼────────────────────────┐
            │                       │                        │
  ┌─────────▼─────────┐   ┌─────────▼─────────┐    ┌─────────▼─────────┐
  │ Embedded / URL    │   │ Reddit Native     │    │ Deleted / 404     │
  │ Reference Only    │   │ Thumbnail Exists  │    │ Media Host        │
  └─────────┬─────────┘   └─────────┬─────────┘    └─────────┬─────────┘
            │                       │                        │
┌───────────▼───────────┐ ┌──────────▼───────────┐ ┌──────────▼───────────┐
│ MEDIA_REFERENCE_ONLY  │ │ THUMBNAIL_AVAILABLE  │ │  MEDIA_UNAVAILABLE   │
└───────────────────────┘ └──────────────────────┘ └───────────────────────┘
```

### Media Lifecycle States:
- `MEDIA_AVAILABLE`: Direct URL active and confirmed accessible.
- `ARCHIVED_COPY`: Media asset explicitly backed up in archive storage.
- `THUMBNAIL_AVAILABLE`: Low-resolution thumbnail recovered from Reddit/archive metadata.
- `MEDIA_REFERENCE_ONLY`: Metadata URL points to third-party host without verified preservation.
- `MEDIA_UNAVAILABLE`: Original host is 404, removed, or private.

---

## 5. Phase 2 — AI Profile Summary Architecture

The AI profiling pipeline executes in four deterministic stages to ensure **zero unsupported claims**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 1: Evidence Ingestion & Pre-Filtering                             │
│ - Select top 150-300 posts and comments with highest engagement/length  │
│ - Filter out boilerplate, spam, automated submissions                   │
│ - Extract verified metadata (subreddits, timestamps, status, IDs)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Stage 2: Structured Observation Extraction                              │
│ - Extract explicit statements: professions, tech stacks, hobbies, locs │
│ - Map timeline evolution: shifts in active subreddits over years        │
│ - Extract communication patterns: sentiment, debate style, tone         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Stage 3: LLM Synthesis with Grounded Schema (Gemini)                   │
│ - Generate strictly 30 distinct profile insights                        │
│ - Assign mandatory Evidence IDs (e.g. ["t3_xyz", "t1_abc"]) for each   │
│ - Enforce Classification: EXPLICIT, STRONGLY_SUPPORTED, WEAK_INFERENCE   │
│ - Refuse speculation on protected personal characteristics              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Stage 4: Citation Integrity Verification                                │
│ - Validate every Evidence ID against the local database                 │
│ - Reject any insight whose supporting records fail verification         │
│ - Persist verified insights into `ai_insights` & `evidence_links`       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Security, Privacy & Integrity

1. **API Key Isolation**: Gemini API keys and Reddit credentials reside exclusively in server-side environment variables (`process.env.GEMINI_API_KEY`).
2. **SSRF Protection**: Media URL resolution and external data fetchers validate all hostnames against IP blacklists (`127.0.0.1`, `169.254.169.254`, internal subnets).
3. **Input Sanitization**: Reddit usernames are validated against `^[A-Za-z0-9_-]{3,20}$`. Markdown in posts/comments is sanitized using DOMPurify / sanitize-html before rendering to prevent stored XSS.
4. **Rate Limiting**: Sliding window rate-limiting per IP (60 requests/minute for content endpoints; 5 requests/minute for AI generation).
5. **Data Immutability**: Historical provenance states (`visible`, `deleted`, `removed`, `edited`) are preserved with snapshot timestamps rather than overwritten.
