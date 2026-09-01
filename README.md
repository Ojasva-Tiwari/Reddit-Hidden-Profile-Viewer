# Reddit Profile Viewer

A minimal Reddit profile viewer that lets users explore historical public Reddit activity, including posts, comments, activity, deleted/removed/edited records when historical data is available, and evidence-backed profile insights.

## Features
- Reddit profile lookup
- Historical posts and comments
- Search, filtering, and sorting
- Activity and history views
- Deleted, removed, and edited status where supported by historical data
- Media previews and media availability states
- Evidence/provenance viewing
- "30 Things About This Profile" AI summary with evidence links
- Dark, Light, and AMOLED themes

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- Arctic Shift
- Google Gemini API

## How It Works
1. User enters a Reddit username.
2. The app retrieves historical Reddit data through Arctic Shift.
3. Data is normalized and stored/cached through PostgreSQL.
4. The website presents the profile, posts, comments, activity, history, provenance and media information.
5. The optional AI summary uses Gemini and links generated insights back to stored evidence.

## Important Notes
- Historical coverage is not guaranteed to be complete.
- Deleted content can only be shown when historical data exists.
- Media references do not necessarily mean the original media file is recoverable.
- AI insights are evidence-backed observations, not guaranteed facts.

## Author
Made by Ojasva Tiwari

## Repository
https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer
