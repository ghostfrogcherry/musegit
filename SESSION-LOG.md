# ChuneUp Session Log

## Date
Started during this session.

## What We Built

### Foundation
- Created a GitHub repo called `musegit` at https://github.com/ghostfrogcherry/musegit
- Scaffolded a Next.js 16 app with TypeScript
- Initial landing page with MVP product spec

### Authentication & Band Workspaces
- Cookie-based sign-in flow (later improved to account picker)
- Private workspace for bands (protected routes via proxy.ts)
- Band workspace page showing members, songs, and activity

### SQLite Data Layer
- Replaced in-memory mock data with SQLite-backed persistence
- Database: `data/musegit.db` (gitignored)
- Tables: users, workspaces, workspace_members, songs, versions, comments
- Seeded the Dazed Days band with real accounts:
  - Nathan (Bass player) — ghostfrogcherry — hoppinghosts@proton.me
  - Landon (Band Manager / Singer / Guitarist)
  - Austin (Guitarist)
  - Emmerson (Drummer)

### Real Comments System
- REST API endpoints:
  - POST `/api/versions/[versionId]/comments` — create comment
  - PATCH `/api/versions/[versionId]/status` — update review state
  - POST `/api/songs/[songId]/versions` — upload new audio version
  - GET `/api/audio/[versionId]` — stream protected audio file
- Comments persist to SQLite
- Review states: Approved, Changes requested, Pending review
- Timestamps supported (stored as seconds)

### Audio Uploads
- File upload form on song page
- Audio stored in `uploads/audio/` (gitignored)
- Protected by session cookie (private to signed-in users)

### Waveform Visualization
- Web Audio API-based waveform rendering
- Clickable waveform to seek playback
- Timestamp markers from comments appear as buttons
- Clicking a timestamp jumps playback to that position

### Account Picker
- Updated sign-in page to show account dropdown
- Can sign in as any band member
- Each user's actions are attributed to their account

## File Changes Summary
- Added: lib/domain.ts, lib/data.ts, lib/auth.ts, lib/session.ts
- Added: app/api/* (audio, versions, songs endpoints)
- Added: app/(workspace)/app/bands/[slug]/songs/[songSlug]/waveform-player.tsx
- Updated: app/sign-in/*, app/(workspace)/app/*, app/globals.css
- Deleted: lib/mock-data.ts

## Git Commits (pushed to origin/master)
- Initial README and MVP product spec
- Scaffold Next.js shell
- Add private workspace auth flow
- Add interactive song review demo
- Add SQLite-backed comments and audio uploads
- Add account picker on sign-in
- Add waveform visualization with timestamp markers
- Wire WaveformPlayer into song review

## Running the App

```bash
cd /home/gfc/musegit
npm run dev
```

Then open http://localhost:3000 (or http://192.168.20.13:3000)

## Tomorrow's Pickup Points

### High Priority
1. **Real auth** — Replace cookie-based demo auth with real authentication (passwords, invites, accounts)
2. **Add more songs** — Seed more than one song into the workspace (currently only Dazed Days)
3. **Activity feed polish** — Make the workspace activity feed show more than 3-4 items
4. **Mobile UI** — The app is responsive but could use touch-friendly waveform controls

### Medium Priority
5. **Waveform improvements** — Add zoom, selection, and better loading states
6. **Comment threading** — Reply-to-comment support
7. **Upload progress** — Visual progress bar on audio uploads
8. **Multiple file upload** — Upload stems, project files, PDFs alongside audio

### Future Architecture
9. **Multi-workspace support** — Allow creating/removing workspaces
10. **Migrate to Postgres** — When deploying to cloud (Vercel, Railway)
11. **Object storage** — S3/R2 for audio files in production
12. **Invite system** — How new band members join a workspace

## Notes
- SQLite DB lives at `data/musegit.db` and is gitignored
- Uploaded audio lives at `uploads/audio/` and is gitignored
- Audio API route checks session cookie to protect playback
- All timestamps in comments are optional and stored as seconds (displayed as mm:ss)