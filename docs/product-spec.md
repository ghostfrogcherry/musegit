# Product Spec

## Product

`musegit` is a private web app for indie bands and remote collaborators to manage songs, mixes, and version history in one place.

## Problem

Bands and collaborators often manage files across `Drive`, `Dropbox`, email, and chat. That creates recurring confusion:

- nobody is sure which mix is the latest
- comments are separated from the actual file version
- approvals happen informally and get lost

## Target User

- indie bands working asynchronously
- remote producers, mixers, and songwriters
- small teams sharing demos, stems, and mixes

## Core Promise

Know which version of a song is current, what changed, and who approved it.

## MVP Scope

### In Scope

- user accounts
- private band workspaces
- member invites and roles
- songs as the main workspace object
- mix uploads with version history
- comments on specific versions
- review state: `pending`, `approved`, `changes requested`
- activity feed per song

### Out of Scope

- public artist pages
- fan discovery features
- music distribution
- real-time DAW collaboration
- mobile apps
- setlists, rehearsal notes, and broader project management

## Main Objects

- `Band`: private workspace with members
- `Song`: central collaboration unit
- `Asset`: a mix or related song file
- `Version`: a specific uploaded revision of an asset
- `Comment`: discussion attached to a version
- `Review`: approval state for a version

## Primary User Flow

1. A user creates a band workspace.
2. They invite collaborators.
3. A song is created.
4. A collaborator uploads a new mix version.
5. Other members listen, comment, and mark approval or request changes.
6. The latest approved version is visible at a glance.

## Success Criteria

- users can upload a new mix in seconds
- users can identify the latest approved version without opening chat history
- comments stay attached to the exact version being discussed
- each song has a clear audit trail of uploads and review decisions

## MVP Differentiator

`musegit` should feel simpler than a shared folder and clearer than a chat thread.

## Initial Technical Direction

- web-only application
- relational database for metadata and permissions
- object storage for uploaded media
- background jobs for audio metadata extraction and previews

## Open Questions

- should v1 support only mixes, or also stems and lyrics uploads?
- do comments need timestamped playback markers in the first release?
- should band owners be able to share read-only private review links later?
