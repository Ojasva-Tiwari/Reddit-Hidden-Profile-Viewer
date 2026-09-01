# Milestone 5 — Historical Content, Provenance & Media Layer

**Completed**: 2026-09-01  
**Target Milestone**: Milestone 5 (Historical Content, Provenance & Media Layer)  
**Status**: `HISTORICAL LAYER READY`

---

## 1. Overview & Objectives Achieved

Milestone 5 enhances the fidelity and trustworthiness of historical Reddit profiles by establishing canonical status mappings, authentic provenance snapshots, revision diffs, media reference classifications, and clean JSON/CSV export capabilities.

```
                    ┌──────────────────────────────────────────────────────────┐
                    │               Canonical Content Statuses                 │
                    │  VISIBLE • DELETED • REMOVED • EDITED • DELETED_LATER    │
                    │                  INITIALLY_UNAVAILABLE                   │
                    └─────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                    ┌──────────────────────────────────────────────────────────┐
                    │                 Media Reference Engine                   │
                    │     MEDIA_AVAILABLE • ARCHIVED_COPY • THUMBNAIL_ONLY     │
                    │         MEDIA_REFERENCE_ONLY • MEDIA_UNAVAILABLE         │
                    └─────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
 ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
 │   ProvenanceViewer UI     │    │  ContentDetailModal V2    │    │  EvidenceViewModal V2     │
 │ Source • ID • Timestamps  │    │  Post vs Comment Support  │    │ Source Record • Metadata  │
 │ Revisions & Diff Patches  │    │  Media & Parent Context   │    │ Supporting Content Quotes │
 └───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 2. Canonical Status Normalization

Content status normalization strictly avoids false inferences:

- **`VISIBLE`**: Default active text state.
- **`DELETED`**: Explicit `[deleted]` author deletion marker or `_meta.is_deleted` without preserved text.
- **`REMOVED`**: Moderator removal marker `[removed]` or `_meta.is_removed`.
- **`EDITED`**: Upstream `edited` timestamp or `_meta.is_edited` flag.
- **`DELETED_LATER`**: Original text body preserved in archival snapshot, with subsequent `_meta.is_deleted` pass.
- **`INITIALLY_UNAVAILABLE`**: Upstream record created with unpopulated selftext/body.

---

## 3. Media Reference Pipeline

No raw media is downloaded or scraped externally. Classification maps accurately:

- **`MEDIA_AVAILABLE`**: Image/video preview bytes URL preserved in Reddit preview or gallery metadata.
- **`ARCHIVED_COPY`**: Upstream cached copy available.
- **`THUMBNAIL_AVAILABLE`**: Preserved thumbnail image without full-resolution bytes.
- **`MEDIA_REFERENCE_ONLY`**: Direct media link exists (e.g. `i.imgur.com`, `v.redd.it`), but raw media files are not mirrored locally.
- **`MEDIA_UNAVAILABLE`**: Standard text post/comment with no media attachments.

---

## 4. UI Components & Screens

1. **`ProvenanceViewer`** (`src/components/ui/ProvenanceViewer.tsx`):
   - Exposes Dataset Source, Reddit Fullname ID (`t3_...`, `t1_...`), Captured Timestamp, and Status Badge.
   - Renders chronological revision observations with diff patches when present, or "NO REVISION HISTORY AVAILABLE".
2. **`MediaStatusBadge` & `MediaReferenceViewer`** (`src/components/ui/MediaReferenceViewer.tsx`):
   - Clear badges and responsive media preview boxes explaining archive state.
3. **`ContentDetailModal`** (`src/components/modals/ContentDetailModal.tsx`):
   - Unified support for `POST` and `COMMENT` records with parent reply previews, direct Reddit links, and raw metadata.
4. **`EvidenceViewModal`** (`src/components/modals/EvidenceViewModal.tsx`):
   - Structured 4-tier layout: Source Record, Archival Metadata, Extracted Supporting Quote, and Full Context.
5. **JSON/CSV Export** (`GET /api/profile/[username]/export`):
   - Clean export of normalized historical records stripped of database internals.

---

## 5. Verification Results

### 5.1 Automated Test Suite (`scripts/test-milestone5.ts`)
- **Status Normalization**: `VISIBLE`, `DELETED`, `REMOVED`, `EDITED` (**Passed**).
- **Deleted Later**: Preserved body with deleted flag (**Passed**).
- **Initially Unavailable**: Empty observation handling (**Passed**).
- **Media Classification**: Image preview, thumbnail only, media reference only, text only (**Passed**).
- **Provenance Extraction**: Revisions and diff mapping (**Passed**).
- **Timeline Merging**: Chronological order and deterministic alphanumeric tie-breaking (**Passed**).
- **Filter Combinations**: Multi-parameter query matching (**Passed**).
- **Malformed Resilience**: Null/empty field recovery (**Passed**).

**Result**: `19/19 Tests Passed`.

### 5.2 Live Smoke Test (`scripts/smoke-test-milestone5.ts`)
- Live target: `u/spez`
- Verified live posts with `[EDITED]` and `[MEDIA_AVAILABLE]` flags.
- Verified live comments with parent context and scores.
- Verified timeline chronological streaming and tie-breaking.

**Result**: `ALL 5 STAGES PASSED`.

---

## 6. Commands Run

| Command | Exit Code | Result |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | `0` | **0 Errors** |
| `npm run lint` (`next lint`) | `0` | **0 Errors** |
| `npm run test` (`scripts/test-milestone5.ts`) | `0` | **19 Passed** |
| `npm run test:milestone4` (Regression) | `0` | **27 Passed** |
| `npm run test:smoke` (`scripts/smoke-test-milestone5.ts`) | `0` | **5 Stages Passed** |
| `npm run build` (`next build`) | `0` | **All routes compiled** |
