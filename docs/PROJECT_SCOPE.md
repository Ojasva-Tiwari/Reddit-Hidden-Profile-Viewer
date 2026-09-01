# Reddit Hidden Profile Viewer — Project Scope

## Project Overview
**Reddit Hidden Profile Viewer** is a tool designed to search, reconstruct, and inspect historical Reddit profiles, activity, and provenance data, followed by an evidence-backed AI profiling layer.

- **GitHub Repository**: [https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer.git](https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer.git)
- **Author**: Ojasva Tiwari

---

## Planned Phases

### PHASE 1 — Historical Reddit Profile Viewer
Focuses on reconstructing historical and removed/edited activity in an intuitive, in-site viewer format.

- **User Experience**: Ghostddit-style user experience.
- **Username Lookup**: Fast lookup and retrieval for Reddit usernames.
- **Profile Hub**:
  - Comprehensive user profile overview.
  - Historical / provenance information.
- **Content Exploration**:
  - Posts feed & detailed post view.
  - Comments feed & context trees.
  - Activity breakdowns & engagement metrics.
  - Chronological activity timeline.
- **Discovery & Navigation**:
  - Search within user's content.
  - Multi-attribute filtering (subreddit, date range, status, score).
  - Flexible sorting options (date, score, comment count).
- **Status & Provenance Tracking**:
  - Deleted, removed, and edited status detection.
  - Original vs edited revisions & provenance history.
  - Media availability and recovery states.
- **Consumption Models**:
  - Primary: In-site interactive browsing and reading experience.
  - Secondary: Structured JSON and CSV export capabilities.

---

### PHASE 2 — AI Profile Summary
Focuses on synthesizing raw historical data into structured, explainable, and verifiable profile insights.

- **"30 Things About This Profile"**: Structured breakdown highlighting core interests, communication patterns, recurring themes, expertise areas, and behavioral trends.
- **Evidence-Backed Insights**: Every insight is strictly grounded in raw historical data.
- **Confidence Levels**: Assigned confidence metrics for generated attributes and conclusions.
- **Source Citations**: Direct links back to exact source posts and comments for full verifiability.
- **Strict Separation**: Explicit information vs. inferred conclusions are clearly demarcated.
- **Zero Hallucination / Unsupported Claims Policy**: No assertions without corresponding source records.

---

## Global UI & Design System Requirements
Prepared for integration with a Stitch-generated frontend and design system.

- **Theme Modes**:
  - **Dark Mode** (Default)
  - **Light Mode**
  - **AMOLED Mode** (Pure black `#000000` base)
- **Visual Design**:
  - Minimal, clean, non-overwhelming layout.
  - High scannability and content clarity.
  - Consistent typographic hierarchy and subtle micro-interactions.
- **Footer Specifications**:
  - Text: `"Made by Ojasva Tiwari"`
  - Link: GitHub repository link ([https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer.git](https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer.git))
