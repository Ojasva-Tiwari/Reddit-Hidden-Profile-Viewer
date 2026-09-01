# Stitch Design Handoff & Technical Architecture

## Project Summary
- **Project Name**: Reddit Archive Researcher
- **Stitch Project ID**: `842669024710378873`
- **Destination Repository**: Reddit Hidden Profile Viewer (`https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer.git`)
- **Author**: Ojasva Tiwari
- **Handoff Date**: 2026-09-01

---

## 1. Imported Screens & Screen Inventory

All 8 requested screens were retrieved from Stitch MCP along with their HTML code, full-resolution screenshots, and metadata.

| # | Screen Name | Screen ID | Dimensions | Local Directory |
|---|-------------|-----------|------------|-----------------|
| 1 | **Profile Overview** | `ad01872de42e43c39d903055ec81ea79` | 2560 × 2048 | `stitch-import/screens/01-profile-overview/` |
| 2 | **Posts Feed** | `4f9ff12a2bda498384ec6c01951ddbfa` | 2560 × 2048 | `stitch-import/screens/02-posts-feed/` |
| 3 | **Activity Overview** | `37197d3de5a644bd9539b7a5c1f83e00` | 2560 × 2048 | `stitch-import/screens/03-activity-overview/` |
| 4 | **Comments Feed** | `ce8eaa3fc4fc41379bbf0afe8cab598a` | 2560 × 2048 | `stitch-import/screens/04-comments-feed/` |
| 5 | **Timeline** | `c90997ba20cd4a34b3c1f87f0cc1fad7` | 2560 × 2048 | `stitch-import/screens/05-timeline/` |
| 6 | **Content Detail View** | `c882fd850c484b2eb30de1e772a5bd7a` | 2560 × 2048 | `stitch-import/screens/06-content-detail-view/` |
| 7 | **Evidence View** | `2f92b55ef7d245e686bf0b29f232f2f1` | 2560 × 2048 | `stitch-import/screens/07-evidence-view/` |
| 8 | **AI Profile Summary** | `beed1b17edba4b97ac99b3cfc6bbc74b` | 2560 × 2130 | `stitch-import/screens/08-ai-profile-summary/` |

---

## 2. Retrieved Assets Structure

Assets are organized in `stitch-import/` as follows:

```
stitch-import/
├── DESIGN.md                                 # Full Stitch Design System specification
└── screens/
    ├── 01-profile-overview/
    │   ├── screen.html                       # Raw Stitch HTML output
    │   ├── screenshot.png                    # Screen capture
    │   └── metadata.json                     # Screen identifiers and API metadata
    ├── 02-posts-feed/
    │   ├── screen.html
    │   ├── screenshot.png
    │   └── metadata.json
    ├── 03-activity-overview/
    │   ├── screen.html
    │   ├── screenshot.png
    │   └── metadata.json
    ├── 04-comments-feed/
    │   ├── screen.html
    │   ├── screenshot.png
    │   └── metadata.json
    ├── 05-timeline/
    │   ├── screen.html
    │   ├── screenshot.png
    │   └── metadata.json
    ├── 06-content-detail-view/
    │   ├── screen.html
    │   ├── screenshot.png
    │   └── metadata.json
    ├── 07-evidence-view/
    │   ├── screen.html
    │   ├── screenshot.png
    │   └── metadata.json
    └── 08-ai-profile-summary/
        ├── screen.html
        ├── screenshot.png
        └── metadata.json
```

---

## 3. Detected Frontend Technology & Code Format

- **Code Format**: Semantic HTML5 markup with embedded `<script id="tailwind-config">` configurations.
- **Styling**: Tailwind CSS (loaded via CDN runtime with forms and container queries plugins).
- **Iconography**: Google Material Symbols Outlined (`data-icon` and icon ligatures).
- **Typography**:
  - Primary UI & Reading: **Inter** (weights 400, 600, 700)
  - Data, Provenance, Metadata & Code: **JetBrains Mono** (weights 400, 500)
- **Aesthetic Philosophy**: "Terminal-as-Interface" & Digital Forensics / Technical Brutalism. Sharp 1px hairline borders (`#30363D`), tonal elevation layering, zero blurry drop shadows, high information density.

---

## 4. Design System Information (DESIGN.md)

Stitch generated a complete **Forensic Archive** design system embedded in the project metadata (saved to [`stitch-import/DESIGN.md`](file:///d:/Reddit-Hidden-Profile-Viewer/stitch-import/DESIGN.md)).

### 4.1 Color Palette & Theme Tokens

| Token | Hex Value | Purpose |
|-------|-----------|---------|
| `surface` / `background` | `#131313` / `#121212` | Dark Canvas default |
| `surface-container-lowest` | `#0E0E0E` | Deep recessed containers & code panels |
| `surface-container-low` | `#1C1B1B` | Sidebar & panel backgrounds |
| `surface-container` | `#201F1F` | Base card background |
| `surface-container-high` | `#2A2A2A` | Interactive hover & elevated cards |
| `surface-container-highest` | `#353534` | Subtle highlights |
| `on-surface` / `on-background` | `#E5E2E1` | Primary text |
| `on-surface-variant` | `#DDC0B6` / `#8B949E` | Secondary/muted text & icons |
| `outline` / `outline-variant` | `#30363D` / `#57423A` | Hairline borders (1px) |
| `primary` | `#FFB598` / `#D96A38` | Muted Terracotta brand accent |
| `primary-container` | `#E2703E` | Active primary actions |
| `secondary` | `#AAC7FF` / `#388BFD` | Scholarly Blue (links & active filters) |
| `secondary-container` | `#0072E3` | Active navigation tab highlight |
| `error` | `#FFB4AB` / `#DA3633` | Deleted status indicator |

### 4.2 Semantic Status Palette

- **Visible / Active**: Green (`#2EA043` / `#3FB950`)
- **Deleted (User Removed)**: Red (`#FFB4AB` / `#DA3633`)
- **Removed (Moderator Action)**: Amber (`#D29922` / `#E3B341`)
- **Edited / Revised**: Blue (`#58A6FF` / `#388BFD`)

### 4.3 Typography Scale

- `display-lg`: Inter 32px / 40px, Bold (Weight 700), Tracking `-0.02em`
- `headline-md`: Inter 20px / 28px, Semi-Bold (Weight 600), Tracking `-0.01em`
- `headline-sm`: Inter 16px / 22px, Semi-Bold (Weight 600), Tracking `-0.005em`
- `body-base`: Inter 14px / 20px, Regular (Weight 400)
- `body-dense`: Inter 13px / 18px, Regular (Weight 400)
- `label-caps`: JetBrains Mono 11px / 14px, Medium (Weight 500), Tracking `0.05em` (uppercase metadata)
- `code`: JetBrains Mono 12px / 16px, Regular (Weight 400) (IDs, timestamps, tabular numbers)

### 4.4 Spacing & Grid System

- **Baseline Unit**: 4px
- **Scale**: `xs`: 4px, `sm`: 8px, `md`: 12px, `lg`: 16px, `xl`: 24px
- **Layout Margins**: Mobile 12px, Desktop 24px, Gutter 12px
- **Max Container Width**: 1280px

---

## 5. Reusable Component Inventory

Based on the 8 Stitch screens, the UI decomposes into the following reusable components:

### 5.1 Shell & Navigation
1. **`TopNavBar`**: Global header with `OSINT_ARCHIVE` title, search trigger, utility buttons (filters, settings, history), and researcher avatar.
2. **`WorkbenchSidebar`**: Fixed 300px left sidebar with system badge (`ARCHIVE_V1`), target profile metadata, navigation links (Posts, Comments, Activity, Timeline, AI Summary), and `EXPORT DATA` button.
3. **`GlobalFooter`**: Minimal footer containing `"Made by Ojasva Tiwari"` and link to the GitHub repository.

### 5.2 Profile & Metrics (Phase 1)
4. **`ProfileHeaderCard`**: Hero card with user handle (`u/username`), account age, first/last seen years, sync status pill (`Archive Sync Status: Complete`), and karma statistics.
5. **`MetricCard` / `StatGrid`**: High-density metric tiles showing total posts, total comments, removal rate, edit frequency, and active subreddits.
6. **`ActivityHeatmap`**: Subreddit distribution and time-of-day activity matrix.

### 5.3 Feeds & Content List (Phase 1)
7. **`PostCard`**: Research card with post title, subreddit tag (`r/subreddit`), score, comment count, timestamp in monospace, full body preview, and semantic status badge (`VISIBLE`, `DELETED`, `REMOVED`, `EDITED`).
8. **`CommentCard`**: Compact comment row showing parent post context, comment body, score, edit history indicator, and direct permalink.
9. **`StatusBadge`**: Pill badge (`rounded-full` or `rounded-sm`) utilizing semantic status background tints and sharp high-contrast text.
10. **`FilterSortToolbar`**: Filter chips (All, Deleted Only, Removed Only, Edited Only), subreddit selector dropdown, date range picker, and sort selector (Newest, Oldest, Score).

### 5.4 Timeline & Provenance (Phase 1)
11. **`TimelineStream`**: Chronological vertical axis with milestone markers, year dividers, and event cards.
12. **`ContentDetailModal`**: Side-by-side or stacked diff viewer showing original text, revision history, moderation notes, and raw JSON payload.

### 5.5 AI Profile Summary & Evidence (Phase 2)
13. **`AISummaryDashboard`**: Overview containing "30 Things About This Profile", categorization tabs (Interests, Demographics, Technical Skills, Behavioral Traits, Contradictions).
14. **`InsightItemCard`**: Numbered insight card (e.g. `#14`) with claim text, inference vs explicit tag, confidence level badge (`HIGH`, `MEDIUM`, `SPECULATIVE`), and `VIEW EVIDENCE` action.
15. **`EvidenceViewModal`**: Modal dialog presenting the exact post/comment that substantiates a given insight, highlighted evidence snippet, timestamp, and verification link.

---

## 6. What Stitch Did NOT Provide (Gaps for Implementation)

The following areas must be built during implementation:

1. **React / Next.js Component Architecture**: Stitch delivered raw HTML mockups with CDN Tailwind CSS scripts, not modular JSX/TSX components.
2. **State & Interaction Logic**:
   - Tab switching & client-side routing.
   - Filter/Sort reactive state.
   - Modal dialog triggers & focus management.
   - Search input debounce & autocomplete.
3. **Multi-Theme Engine**:
   - AMOLED mode (`#000000` true black background).
   - Light archival mode (`#F5F5F5` document background).
   - Dark mode default (`#121212`).
   - Theme toggle switcher and persistence.
4. **Data Fetching & Pipeline**:
   - Integration with historical Reddit archives (Arctic Shift / Pushshift / Reddit APIs).
   - Error handling (rate limits, deleted accounts, empty datasets).
   - Pagination & infinite virtualized scrolling for massive profiles.
5. **AI Synthesis Pipeline**:
   - Structured JSON schema generation via Gemini API.
   - Evidence mapping engine linking claims to exact post/comment IDs.
6. **Data Export Utilities**:
   - Client-side JSON & CSV export generation.

---

## 7. Recommended Mapping to Next.js Application

### 7.1 Proposed Directory Layout

```
src/
├── app/
│   ├── layout.tsx                     # Root layout with theme provider & fonts
│   ├── page.tsx                       # Landing / username search screen
│   └── u/
│       └── [username]/
│           ├── layout.tsx             # Workbench layout (TopNav + Sidebar)
│           ├── page.tsx               # 01 Profile Overview
│           ├── posts/page.tsx         # 02 Posts Feed
│           ├── activity/page.tsx      # 03 Activity Overview
│           ├── comments/page.tsx      # 04 Comments Feed
│           ├── timeline/page.tsx      # 05 Timeline
│           └── ai-summary/page.tsx    # 08 AI Profile Summary ("30 Things")
├── components/
│   ├── layout/                        # TopNav, Sidebar, Footer, WorkbenchShell
│   ├── profile/                       # ProfileHeader, MetricGrid, SyncStatus
│   ├── feed/                          # PostCard, CommentCard, FilterBar, StatusBadge
│   ├── timeline/                      # TimelineStream, TimelineItem, YearAnchor
│   ├── modals/                        # ContentDetailModal (06), EvidenceModal (07)
│   ├── ai/                            # InsightCard, ConfidenceBadge, CategoryTabs
│   └── ui/                            # Button, Badge, Input, Select, Dialog
├── lib/
│   ├── api/                           # Data fetching clients (Arctic Shift / Reddit)
│   ├── ai/                            # Gemini prompt templates & structured outputs
│   ├── export/                        # CSV and JSON serialization utilities
│   └── tokens.ts                      # Theme tokens & status constants
└── styles/
    └── globals.css                    # Tailwind CSS v3/v4 & theme variables
```

### 7.2 Theme Strategy
Use CSS variables or Tailwind class-based themes (`dark`, `light`, `amoled`):
- `dark` (default): canvas `#121212`, card `#1A1A1A`, border `#30363D`
- `amoled`: canvas `#000000`, card `#0D1117`, border `#21262D`
- `light`: canvas `#F5F5F5`, card `#FFFFFF`, border `#D1D5DA`
