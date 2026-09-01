# Production Deployment Guide

**Application**: Reddit Hidden Profile Viewer  
**Target Environments**: Vercel (Frontend/API) + PostgreSQL (Database) + Google Gemini (AI Engine)  
**Status**: Production Ready

---

## 1. Architecture Summary

```
                       ┌────────────────────────────────────────────────────────┐
                       │                     Vercel Platform                    │
                       │   - Next.js 14 App Router (React Server Components)    │
                       │   - Internal REST APIs with Sliding-Window Limiter     │
                       │   - Stitch Forensic UI (Dark/Light/AMOLED themes)      │
                       └──────────────┬──────────────────────────┬──────────────┘
                                      │                          │
                 ┌────────────────────┴────────┐        ┌────────┴────────────────────┐
                 │                             │        │                             │
                 ▼                             ▼        ▼                             ▼
┌─────────────────────────────────┐ ┌──────────────────────┐ ┌────────────────────────────────┐
│       Arctic Shift API          │ │  PostgreSQL Database │ │       Google Gemini API        │
│ Historical Reddit Submissions   │ │ Profiles, Posts,     │ │ gemini-2.5-flash               │
│ & Comments Archive              │ │ Comments, AI Cache   │ │ Evidence-Backed "30 Things"    │
└─────────────────────────────────┘ └──────────────────────┘ └────────────────────────────────┘
```

---

## 2. Environment Variables

Configure these variables in your Vercel Project Settings or container environment:

| Variable Name | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Optional* | `None` | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`). If omitted, app operates in live upstream fallback mode. |
| `GEMINI_API_KEY` | Optional* | `None` | Google Gemini API Key for Phase 2 AI summary synthesis. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model name for structured synthesis (e.g. `gemini-2.5-flash`, `gemini-2.0-flash`). |
| `ARCTIC_SHIFT_BASE_URL` | Optional | `https://arctic-shift.photon-reddit.com` | Base URL for historical Reddit archive API. |
| `API_RATE_LIMIT_PER_MINUTE` | Optional | `60` | Public API rate limit per IP per minute. |
| `AI_SUMMARY_RATE_LIMIT_PER_MINUTE` | Optional | `10` | AI profile synthesis rate limit per IP per minute. |
| `AI_SUMMARY_REFRESH_RATE_LIMIT_PER_MINUTE` | Optional | `5` | AI summary re-synthesis rate limit per IP per minute. |

*\*The application gracefully degrades if `DATABASE_URL` or `GEMINI_API_KEY` are not provided.*

---

## 3. Database Setup (PostgreSQL)

If using a managed PostgreSQL provider (e.g., Neon, Supabase, Railway, AWS RDS):

1. **Provision Database**: Create a standard PostgreSQL instance (v14+ recommended).
2. **Execute Migrations**:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
3. **Verify Schema**: Drizzle ORM creates all 10 core tables, indexes, and foreign keys.

---

## 4. Vercel Deployment

1. **Connect Repository**: Import `https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer.git` into Vercel.
2. **Framework Preset**: Select **Next.js**.
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next` (default)
5. **Environment Variables**: Add `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, etc.
6. **Deploy**: Trigger initial deployment.

---

## 5. How to Disable AI Features

To run the application in **Phase 1 Historical-Only Mode** without AI costs:
- Leave `GEMINI_API_KEY` unset or empty.
- The AI Summary screen will cleanly display the informative `AI_UNAVAILABLE` banner without crashing or making upstream model calls.

---

## 6. Production Data Policy & Archival Limitations

- **Coverage Disclaimer**: Upstream archive coverage is historical and not guaranteed 100% exhaustive. Missing records do not conclusively prove non-existence.
- **Media Preservation**: No raw media scraping or downloads are conducted. Direct references without archival bytes remain classified as `MEDIA_REFERENCE_ONLY`.
- **AI Grounding**: All generated findings require verifiable citation records. Sensitive personal attributes (medical, political, sexual orientation, precise location) are strictly prohibited from synthesis.
