# Reddit Hidden Profile Viewer — API Design & Upstream Integration

## 1. Overview & Architectural Standards

All internal API endpoints are served as Next.js Route Handlers (`src/app/api/...`) conforming to the following standards:
- **Transport**: HTTPS with standard JSON payloads.
- **Error Responses**: RFC 7807 problem details (`{ "error": string, "code": string, "statusCode": number, "details"?: any }`).
- **Pagination**: Cursor-based using `created_utc` + Reddit ID or standard limit/offset for table views.
- **Cache-Control**: `s-maxage` caching for static historical records; `no-store` for active sync jobs.

---

## 2. Arctic Shift Upstream Mapping

The backend translates internal application requests to Arctic Shift endpoints (`https://arctic-shift.photon-reddit.com` / `https://api.pullpush.io`):

| App Feature | Arctic Shift Endpoint | Upstream Query Parameters | Notes |
|---|---|---|---|
| **Author Posts** | `GET /reddit/submission/search/` | `author={user}&limit={100}&sort=desc&sort_type=created_utc` | Paged via `before={timestamp}` |
| **Author Comments** | `GET /reddit/comment/search/` | `author={user}&limit={100}&sort=desc&sort_type=created_utc` | Paged via `before={timestamp}` |
| **Subreddit Activity** | `GET /reddit/comment/search/` | `author={user}&metadata=true&aggs=subreddit` | Used for distribution matrix |
| **Parent Post Lookup** | `GET /reddit/submission/search/` | `ids={t3_ids}` | Resolves comment context trees |
| **Specific ID Lookup** | `GET /reddit/{type}/search/` | `ids={fullname_list}` | Ingests missing context |

### Ingestion Resilience Policies:
1. **Exponential Backoff**: 3 retries on HTTP 429 / 5xx with jitter (`1s`, `2s`, `4s`).
2. **Chunked Pagination**: Maximum 100 records per HTTP page; sync jobs process batches in parallel workers (concurrency: 3).
3. **Time-Slice Ingestion**: For hyper-active accounts (>10,000 items), jobs chunk by year/quarter to prevent timeout.
4. **Graceful Degradation**: If Arctic Shift is unresponsive, cached or partially ingested records are returned with `sync_status: "PARTIAL"`.

---

## 3. Internal Application Endpoints

### 3.1 `GET /api/search/user`
Fast lookup and initial validation of a Reddit username.

#### Query Parameters:
- `q` (string, required): Username to search (e.g. `Speeder`).
- `forceRefresh` (boolean, optional): Bypass Redis cache if true.

#### Response (200 OK):
```json
{
  "username": "Speeder",
  "exists": true,
  "inDatabase": true,
  "syncStatus": "COMPLETED",
  "firstSeen": "2018-04-12T14:32:00Z",
  "lastSeen": "2024-08-29T19:10:00Z",
  "totalRecordedPosts": 412,
  "totalRecordedComments": 3890
}
```

---

### 3.2 `GET /api/profile/:username`
Fetches the consolidated profile header, account metrics, and ingestion status.

#### Response (200 OK):
```json
{
  "profile": {
    "id": "c1f7a012-3844-4672-9118-e8ab11649980",
    "redditId": "t2_123456",
    "username": "Speeder",
    "avatarUrl": "https://...",
    "createdUtc": "2018-04-12T14:32:00Z",
    "accountAgeYears": 6.3,
    "firstSeenUtc": "2018-04-12T14:32:00Z",
    "lastSeenUtc": "2024-08-29T19:10:00Z",
    "totalKarma": 48290,
    "linkKarma": 14200,
    "commentKarma": 34090,
    "syncStatus": "COMPLETED",
    "syncProgress": 100,
    "lastSyncedAt": "2026-09-01T12:00:00Z"
  },
  "metrics": {
    "totalPosts": 412,
    "totalComments": 3890,
    "deletedPosts": 14,
    "deletedComments": 86,
    "removedPosts": 22,
    "removedComments": 45,
    "editedPosts": 31,
    "editedComments": 210,
    "topSubreddits": [
      { "name": "starcraft", "count": 1420, "score": 22400 },
      { "name": "programming", "count": 890, "score": 11200 },
      { "name": "rust", "count": 640, "score": 8900 }
    ]
  }
}
```

---

### 3.3 `GET /api/profile/:username/posts`
Paginated, filterable, and sortable historical posts.

#### Query Parameters:
- `page` (number, default: `1`): 1-indexed page.
- `limit` (number, default: `25`, max: `100`): Page size.
- `status` (string, optional): `ALL` | `VISIBLE` | `DELETED` | `REMOVED` | `EDITED`.
- `subreddit` (string, optional): Filter by subreddit name.
- `sort` (string, default: `newest`): `newest` | `oldest` | `score_desc` | `comments_desc`.
- `q` (string, optional): Full-text search within title and selftext.
- `after` / `before` (ISO 8601 string, optional): Date range bounds.

#### Response (200 OK):
```json
{
  "data": [
    {
      "id": "e4581f12-0941-4776-a077-511bbcf80199",
      "redditId": "t3_xj9k2q",
      "title": "Optimal APM for Zerg Early Game Macro",
      "subreddit": "starcraft",
      "author": "Speeder",
      "score": 1240,
      "numComments": 342,
      "createdUtc": "2023-09-14T11:20:00Z",
      "editedUtc": null,
      "status": "VISIBLE",
      "mediaStatus": "MEDIA_REFERENCE_ONLY",
      "permalink": "/r/starcraft/comments/xj9k2q/optimal_apm_for_zerg_early_game_macro/",
      "snippet": "I've been analyzing replays of top Korean GM players, and there's a distinct pattern in APM bursts..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalCount": 412,
    "totalPages": 17,
    "hasMore": true
  }
}
```

---

### 3.4 `GET /api/profile/:username/comments`
Paginated and filterable comments with parent context resolution.

#### Query Parameters:
- Same pagination, filter, and sorting parameters as `/posts`.

#### Response (200 OK):
```json
{
  "data": [
    {
      "id": "d9812a44-8842-4911-9a71-61a8ef110822",
      "redditId": "t1_gm7n8x9",
      "postRedditId": "t3_k81mno",
      "parentRedditId": "t1_gm7m110",
      "subreddit": "rust",
      "score": 85,
      "createdUtc": "2024-02-18T16:45:00Z",
      "status": "EDITED",
      "body": "The borrow checker prevents this exact race condition at compile time...",
      "parentContext": {
        "author": "other_user",
        "bodySnippet": "Why can't I just pass a mutable reference to both threads?"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalCount": 3890,
    "totalPages": 156,
    "hasMore": true
  }
}
```

---

### 3.5 `GET /api/profile/:username/activity`
Aggregated time-series and activity distribution metrics.

#### Response (200 OK):
```json
{
  "timeSeries": {
    "byYear": [
      { "year": 2018, "posts": 40, "comments": 290 },
      { "year": 2023, "posts": 120, "comments": 940 }
    ],
    "byMonth": [
      { "month": "2023-01", "posts": 12, "comments": 80 }
    ],
    "byDayOfWeek": [
      { "day": "Sunday", "count": 640 },
      { "day": "Monday", "count": 410 }
    ],
    "byHourOfDayUtc": [
      { "hour": 0, "count": 180 },
      { "hour": 14, "count": 420 }
    ]
  },
  "subredditDistribution": [
    { "subreddit": "starcraft", "percentage": 36.5, "count": 1420 },
    { "subreddit": "programming", "percentage": 22.9, "count": 890 }
  ]
}
```

---

### 3.6 `GET /api/profile/:username/timeline`
Chronological milestone stream connecting key posts, removed entries, and account events.

#### Query Parameters:
- `year` (number, optional): Limit to specific year.
- `limit` (number, default: `50`): Batch size.

---

### 3.7 `GET /api/content/:id`
Retrieves detailed content, historical revisions, and full diff provenance for Screen 6 (`Content Detail View`).

#### Path Parameters:
- `id` (string, required): Internal UUID or Reddit fullname ID (`t3_...`, `t1_...`).

#### Response (200 OK):
```json
{
  "id": "e4581f12-0941-4776-a077-511bbcf80199",
  "type": "POST",
  "redditId": "t3_xj9k2q",
  "author": "Speeder",
  "subreddit": "starcraft",
  "title": "Optimal APM for Zerg Early Game Macro",
  "currentBody": "I've been analyzing replays...",
  "status": "EDITED",
  "createdUtc": "2023-09-14T11:20:00Z",
  "editedUtc": "2023-09-14T13:45:00Z",
  "provenance": [
    {
      "version": 1,
      "recordedAt": "2023-09-14T11:20:00Z",
      "status": "VISIBLE",
      "content": "Initial draft of APM analysis without replay timestamps..."
    },
    {
      "version": 2,
      "recordedAt": "2023-09-14T13:45:00Z",
      "status": "EDITED",
      "content": "Updated APM analysis including 1:45 timestamp correlation...",
      "diffPatch": "@@ -1,4 +1,6 @@\n..."
    }
  ],
  "rawPayload": { /* Full original Arctic Shift JSON */ }
}
```

---

### 3.8 `GET /api/evidence/:id`
Retrieves supporting evidence metadata for Screen 7 (`Evidence View`).

#### Response (200 OK):
```json
{
  "evidenceId": "f7188a10-2911-4011-b021-998811223344",
  "insightId": "a1198b33-4011-4991-8822-112233445566",
  "redditFullname": "t3_xj9k2q",
  "sourceType": "POST",
  "author": "Speeder",
  "subreddit": "starcraft",
  "title": "Optimal APM for Zerg Early Game Macro",
  "exactQuote": "Specifically, at the 1:45 mark, APM spikes to ~350 for about 4 seconds.",
  "fullText": "I've been analyzing replays of top Korean GM players...",
  "correlationNotes": "Substantiates Insight #14: Technical gaming analysis in competitive RTS.",
  "createdUtc": "2023-09-14T11:20:00Z",
  "status": "VISIBLE"
}
```

---

### 3.9 `GET /api/profile/:username/summary` (Phase 2)
Retrieves the "30 Things About This Profile" AI synthesis.

#### Response (200 OK):
```json
{
  "username": "Speeder",
  "totalInsights": 30,
  "generatedAt": "2026-09-01T14:30:00Z",
  "modelVersion": "gemini-2.0-flash",
  "insights": [
    {
      "index": 1,
      "category": "TECH_PROFESSION",
      "title": "Systems-Level Software Engineer with Rust Expertise",
      "finding": "Author has repeatedly discussed low-level memory management, borrow checker mechanics, and async runtimes in r/rust and r/programming.",
      "classification": "EXPLICIT",
      "confidence": "HIGH",
      "evidenceIds": ["t1_gm7n8x9", "t1_hf4k119"],
      "supportingCitations": [
        {
          "redditId": "t1_gm7n8x9",
          "subreddit": "rust",
          "quote": "In our production services, we migrated from C++ to Rust to eliminate concurrency data races..."
        }
      ]
    }
  ]
}
```
