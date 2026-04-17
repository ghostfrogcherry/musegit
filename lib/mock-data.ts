export type ReviewState = "Approved" | "Changes requested" | "Pending review";

export type Comment = {
  author: string;
  postedAt: string;
  body: string;
  timestamp?: string;
};

export type Version = {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: ReviewState;
  summary: string;
  duration: string;
  comments: Comment[];
};

export type Song = {
  slug: string;
  name: string;
  status: ReviewState;
  version: string;
  note: string;
  comments: number;
  updatedAt: string;
  bpm: number;
  key: string;
  latestVersionId: string;
  versions: Version[];
};

export type Workspace = {
  slug: string;
  name: string;
  genre: string;
  members: { name: string; role: string }[];
  songs: Song[];
  activity: string[];
};

export const workspaces: Workspace[] = [
  {
    slug: "moonlit-receiver",
    name: "Moonlit Receiver",
    genre: "Dream pop / nocturnal synth rock",
    members: [
      { name: "Rin", role: "Owner" },
      { name: "Noah", role: "Guitar + production" },
      { name: "Ivy", role: "Vocals" },
      { name: "Ari", role: "Drums" }
    ],
    songs: [
      {
        slug: "velvet-static",
        name: "Velvet Static",
        status: "Approved",
        version: "mix-v12.wav",
        note: "Master candidate signed off by all 4 members.",
        comments: 14,
        updatedAt: "2 hours ago",
        bpm: 94,
        key: "F minor",
        latestVersionId: "v12",
        versions: [
          {
            id: "v12",
            fileName: "mix-v12.wav",
            uploadedBy: "Rin",
            uploadedAt: "2 hours ago",
            status: "Approved",
            summary: "Final vocal ride pass and tighter low-end on the outro.",
            duration: "4:18",
            comments: [
              {
                author: "Noah",
                postedAt: "1 hour ago",
                timestamp: "03:42",
                body: "Outro finally breathes. Kick and bass are glued without eating the vocal."
              },
              {
                author: "Ivy",
                postedAt: "54 minutes ago",
                body: "This is the first pass that feels release-ready front to back."
              }
            ]
          },
          {
            id: "v11",
            fileName: "mix-v11.wav",
            uploadedBy: "Rin",
            uploadedAt: "yesterday",
            status: "Pending review",
            summary: "Adjusted chorus compression and softened the synth wash in verse two.",
            duration: "4:18",
            comments: [
              {
                author: "Ari",
                postedAt: "yesterday",
                timestamp: "01:36",
                body: "Snare bloom is nice here, but the chorus still feels a hair too pinned."
              }
            ]
          },
          {
            id: "v10",
            fileName: "mix-v10.wav",
            uploadedBy: "Noah",
            uploadedAt: "3 days ago",
            status: "Changes requested",
            summary: "First pass after re-amping guitars and replacing the bridge vocal stack.",
            duration: "4:18",
            comments: [
              {
                author: "Ivy",
                postedAt: "3 days ago",
                timestamp: "02:11",
                body: "Bridge doubles are cleaner, but the lead lost a little urgency."
              }
            ]
          }
        ]
      },
      {
        slug: "night-window",
        name: "Night Window",
        status: "Changes requested",
        version: "mix-v7.wav",
        note: "Vocals need to come forward in the second chorus.",
        comments: 8,
        updatedAt: "yesterday",
        bpm: 118,
        key: "A major",
        latestVersionId: "v7",
        versions: [
          {
            id: "v7",
            fileName: "mix-v7.wav",
            uploadedBy: "Noah",
            uploadedAt: "yesterday",
            status: "Changes requested",
            summary: "Pulled the guitars wider and added a brighter plate to the hook vocal.",
            duration: "3:51",
            comments: [
              {
                author: "Ivy",
                postedAt: "22 hours ago",
                timestamp: "02:28",
                body: "Second chorus lyric is getting swallowed when the guitars open up."
              },
              {
                author: "Rin",
                postedAt: "20 hours ago",
                body: "This is close. Keep the width, just bring the lead up and maybe carve 2k from the synth pad."
              }
            ]
          },
          {
            id: "v6",
            fileName: "mix-v6.wav",
            uploadedBy: "Noah",
            uploadedAt: "2 days ago",
            status: "Pending review",
            summary: "First pass with the new gang vocal stack and tighter tom edits.",
            duration: "3:51",
            comments: []
          }
        ]
      },
      {
        slug: "ghost-signal",
        name: "Ghost Signal",
        status: "Pending review",
        version: "demo-v3.wav",
        note: "New rhythm guitar pass uploaded 18 minutes ago.",
        comments: 3,
        updatedAt: "18 minutes ago",
        bpm: 102,
        key: "D minor",
        latestVersionId: "v3",
        versions: [
          {
            id: "v3",
            fileName: "demo-v3.wav",
            uploadedBy: "Noah",
            uploadedAt: "18 minutes ago",
            status: "Pending review",
            summary: "Added the new rhythm guitar pass and nudged the bridge into half-time.",
            duration: "4:42",
            comments: [
              {
                author: "Ari",
                postedAt: "9 minutes ago",
                body: "Half-time bridge is working. Want to hear one pass with the floor tom drier."
              }
            ]
          }
        ]
      }
    ],
    activity: [
      "Rin uploaded mix-v12.wav to Velvet Static",
      "Noah approved version 12 and marked it release-ready",
      "Ivy commented on Night Window: try less delay on the bridge vocal",
      "Ari invited Jules to the band workspace"
    ]
  },
  {
    slug: "glass-harbor",
    name: "Glass Harbor",
    genre: "Indie folk / remote writing sessions",
    members: [
      { name: "Jules", role: "Owner" },
      { name: "Mina", role: "Cello + vocals" },
      { name: "Pax", role: "Mix engineer" }
    ],
    songs: [
      {
        slug: "moth-light",
        name: "Moth Light",
        status: "Pending review",
        version: "mix-v4.wav",
        note: "Fresh rough mix after the new cello stack.",
        comments: 5,
        updatedAt: "40 minutes ago",
        bpm: 76,
        key: "C major",
        latestVersionId: "v4",
        versions: [
          {
            id: "v4",
            fileName: "mix-v4.wav",
            uploadedBy: "Pax",
            uploadedAt: "40 minutes ago",
            status: "Pending review",
            summary: "New cello stack is tucked under the vocal with gentler bus compression.",
            duration: "4:57",
            comments: [
              {
                author: "Mina",
                postedAt: "12 minutes ago",
                timestamp: "01:54",
                body: "Love the cello texture here. Verse two could still open up a little more."
              }
            ]
          }
        ]
      },
      {
        slug: "northbound",
        name: "Northbound",
        status: "Approved",
        version: "mix-v9.wav",
        note: "Approved for the acoustic session release.",
        comments: 11,
        updatedAt: "3 days ago",
        bpm: 88,
        key: "G major",
        latestVersionId: "v9",
        versions: [
          {
            id: "v9",
            fileName: "mix-v9.wav",
            uploadedBy: "Pax",
            uploadedAt: "3 days ago",
            status: "Approved",
            summary: "Final acoustic session master with room noise cleaned and stereo image narrowed.",
            duration: "3:28",
            comments: [
              {
                author: "Jules",
                postedAt: "3 days ago",
                body: "Calling this done. It still feels live, just cleaner."
              }
            ]
          }
        ]
      }
    ],
    activity: [
      "Mina uploaded harmonies-v2.wav to Moth Light",
      "Pax requested changes on Moth Light mix-v4.wav",
      "Jules approved Northbound for release"
    ]
  }
];

export const demoUser = {
  name: "Lando Taylor",
  email: "hoppinghosts@proton.me",
  role: "Band Manager"
};

export const totalSongs = workspaces.reduce((count, workspace) => count + workspace.songs.length, 0);

export const pendingReviews = workspaces.reduce(
  (count, workspace) => count + workspace.songs.filter((song) => song.status === "Pending review").length,
  0
);

export function getWorkspace(slug: string) {
  return workspaces.find((workspace) => workspace.slug === slug);
}

export function getSong(workspaceSlug: string, songSlug: string) {
  const workspace = getWorkspace(workspaceSlug);

  if (!workspace) {
    return undefined;
  }

  const song = workspace.songs.find((entry) => entry.slug === songSlug);

  if (!song) {
    return undefined;
  }

  const currentVersion = song.versions.find((version) => version.id === song.latestVersionId) ?? song.versions[0];

  return { workspace, song, currentVersion };
}
