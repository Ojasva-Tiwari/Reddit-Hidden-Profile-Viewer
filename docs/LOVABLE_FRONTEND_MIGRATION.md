# Lovable Frontend Migration

## 1. Executive Summary

This document records the visual identity replacement for **Reddit Profile Viewer**. The frontend was updated from the previous dense forensic terminal layout to a friendly, spacious, content-first user interface inspired by modern Lovable web applications and incorporating the official Reddit-style mascot.

All underlying architectural foundations—including **Arctic Shift data integration**, **PostgreSQL + Drizzle ORM data persistence**, **historical content normalization**, **deletion/removal detection**, **provenance and diff tracking**, **evidence verification**, and **Gemini-powered structured AI summarization**—remain completely intact.

---

## 2. Visual Identity & Brand System

### 2.1 Theme & Color Palette
- **Primary Brand Accent**: Warm Terracotta / Reddit Coral (`#D95B30` / `#C85A32`).
- **Dark Mode (`dark`)**: Soft charcoal background (`#141416`), surface cards (`#1E1E22` / `#222226`), borders (`#2E2E34`), soft text (`#F4F4F5` / `#A1A1AA`).
- **Light Mode (`light`)**: Clean warm white (`#FBFBFB`), surface cards (`#FFFFFF`), borders (`#EAEAEA`), soft text (`#18181B` / `#71717A`).
- **AMOLED Mode (`amoled`)**: True black background (`#000000`), surface cards (`#0C0C0E`), borders (`#1C1C20`).

### 2.2 Typography & Radius Tokens
- **Typography**: Modern, readable sans-serif (`-apple-system`, `BlinkMacSystemFont`, `Inter`, `Segoe UI`, `Roboto`).
- **Border Radii**: Generous, approachable rounded corners (`rounded-2xl` for cards, `rounded-3xl` for modals, `rounded-full` for search pills, navigation tabs, and badges).
- **Elevation**: Soft, subtle card shadows (`shadow-card`, `shadow-card-hover`, `shadow-modal`).

### 2.3 Mascot & Iconography
- **Mascot Placement**: Located at `/public/mascot.png` and positioned naturally in the upper-right area of the homepage hero section.
- **Brand Logo**: Circular warm terracotta badge with lowercase `r` + **Profile Viewer**.
- **Theme Switcher**: Clean 3-button pill toggle (🌙 Dark, ☀️ Light, ⚪ AMOLED).

---

## 3. Component Architecture & Page Layouts

### 3.1 Global Header & Navigation (`TopNavBar.tsx`)
- Minimalist sticky navigation bar with blurred background.
- Clean brand logo on the left, quick search bar in the center (on subpages), and theme switcher + repository link on the right.

### 3.2 Homepage (`src/app/page.tsx`)
- **Hero Title**: *"Look up a Reddit profile"*
- **Hero Subtitle**: *"Enter a username and get a clean profile page with its posts, comments and history — including content that has since disappeared."*
- **Search Console**: Pill-shaped input with search icon, placeholder `"username"`, and terracotta `"View"` action button.
- **Sample Profile**: Quick lookup link `"Try u/mossyroute"`.
- **Three Feature Cards**:
  1. 🕒 **Full history**: Posts and comments grouped by year and month, including ones that no longer show on the profile.
  2. 🖼️ **Media, properly sized**: Image posts get a large preview and a clean lightbox instead of a thumbnail.
  3. ✨ **Simple insights**: Thirty short, readable findings about how someone uses Reddit — each with evidence.

### 3.3 Profile Workbench & Layout (`u/[username]/layout.tsx`)
- Removed the dense forensic sidebar in favor of a clean, responsive layout.
- **Profile Header**: User monogram/avatar, username `u/username`, total karma, first active year, last active year, archival sync button, and JSON export button.
- **Horizontal Tab Navigation**:
  - **Posts** (`/u/[username]/posts`)
  - **Comments** (`/u/[username]/comments`)
  - **Activity** (`/u/[username]/activity`)
  - **History** (`/u/[username]/timeline`)
  - **Insights** (`/u/[username]/ai-summary`)

### 3.4 Content Feeds & Modals
- **Posts Feed**: Spacious rounded cards with large titles, body excerpts, score/comment counts, subtle status badges, and comfortable responsive media previews.
- **Comments Feed**: Clean thread-style cards with parent context quotes.
- **ContentDetailModal**: Content-first modal prioritizing full readability, large image previews with full-screen lightbox on click, upvote stats, and a collapsible "Technical details" section.
- **EvidenceViewModal**: Direct citation quote block, correlation notes, surrounding context, and a link to view full content.

---

## 4. Verification & Testing

All test suites and production build checks were run and passed:
1. **TypeScript Type Check**: `npm run typecheck` — 0 errors.
2. **ESLint**: `npm run lint` — 0 errors.
3. **Comprehensive Acceptance Tests**: `npm run test` — 30/30 passed.
4. **Milestone 6 AI & Grounding Suite**: `npm run test:milestone6` — 16/16 passed.
5. **Milestone 5 Provenance & Media Suite**: `npm run test:milestone5` — 19/19 passed.
6. **Milestone 4 API & Normalization Suite**: `npm run test:milestone4` — 27/27 passed.
7. **Milestone 3 Arctic Shift Suite**: `npm run test:milestone3` — 27/27 passed.
8. **Next.js Production Build**: `npm run build` — 100% compiled & optimized static/dynamic routes.
