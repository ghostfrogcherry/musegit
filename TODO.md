# ChuneUp - Music Review Workspace

## What We've Built

### Core Features
- **User Authentication** - Sign up/login with password hashing (scrypt), session cookies
- **Workspaces/Albums** - Create and manage music albums/projects
- **Songs** - Track songs within albums with BPM, key, notes
- **Versions** - Upload audio versions of songs with summaries

### Review & Collaboration
- **Band Member Approvals** - Manager can approve solo OR require all members to approve
- **A/B Version Comparison** - Compare two versions side by side with sync playback
- **Timeline Comments** - Timestamp comments on versions
- **Workspace Members** - Invite/manage band members with roles (member/manager)

### Audio Features
- **Waveform Display** - Visual waveform rendering for versions
- **Persistent Player** - Bottom bar player that stays across pages
  - Waveform visualization
  - Progress scrubbing with handle
  - Skip forward/back (-15, -5, +5, +15 seconds)
  - Volume slider with mute
  - Playback speed (0.5x to 2x)
- **Stems Support** - Upload individual track stems per version
  - Mute/Solo controls per stem
  - Smart playback (solo overrides mute)
  - Instrument tagging

### UI/UX
- **Mardi Gras Theme** - Green, gold, purple colors
- **JetBrains Mono** - Monospace font throughout
- **Responsive Design** - Works on desktop and mobile

### Security
- **Auth on All APIs** - All file/audio routes require authentication
- **Logout Cleanup** - Audio stops on logout, session cleared

## What's Left to Do

1. **Threaded Comments** - Replies, @mentions on comments
2. **Mobile Polish** - Touch-friendly controls, responsive tweaks
3. **Profile/Settings** - User preferences, password change
4. **Dark/Light Theme Toggle** - Switch between themes
5. **Notifications** - Email or in-app notifications for updates
6. **Export/Download** - Download versions, stems as zip
7. **Version History** - Full diff view of changes over time
8. **Search** - Find songs, versions, comments across albums
9. **Tags/Labels** - Categorize songs (verse, chorus, bridge, etc.)
10. **Mobile App** - Native iOS/Android apps

## Tech Stack
- Next.js 16 (App Router)
- SQLite (better-sqlite3)
- TypeScript
- Web Audio API (waveform, stem playback)
- CSS Modules / Global CSS
