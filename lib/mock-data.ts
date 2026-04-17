export type ReviewState = "Approved" | "Changes requested" | "Pending review";

export type Song = {
  name: string;
  status: ReviewState;
  version: string;
  note: string;
  comments: number;
  updatedAt: string;
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
        name: "Velvet Static",
        status: "Approved",
        version: "mix-v12.wav",
        note: "Master candidate signed off by all 4 members.",
        comments: 14,
        updatedAt: "2 hours ago"
      },
      {
        name: "Night Window",
        status: "Changes requested",
        version: "mix-v7.wav",
        note: "Vocals need to come forward in the second chorus.",
        comments: 8,
        updatedAt: "yesterday"
      },
      {
        name: "Ghost Signal",
        status: "Pending review",
        version: "demo-v3.wav",
        note: "New rhythm guitar pass uploaded 18 minutes ago.",
        comments: 3,
        updatedAt: "18 minutes ago"
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
        name: "Moth Light",
        status: "Pending review",
        version: "mix-v4.wav",
        note: "Fresh rough mix after the new cello stack.",
        comments: 5,
        updatedAt: "40 minutes ago"
      },
      {
        name: "Northbound",
        status: "Approved",
        version: "mix-v9.wav",
        note: "Approved for the acoustic session release.",
        comments: 11,
        updatedAt: "3 days ago"
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
  name: "ghostfrogcherry",
  email: "hoppinghosts@proton.me",
  role: "Band owner"
};

export const totalSongs = workspaces.reduce((count, workspace) => count + workspace.songs.length, 0);

export const pendingReviews = workspaces.reduce(
  (count, workspace) => count + workspace.songs.filter((song) => song.status === "Pending review").length,
  0
);

export function getWorkspace(slug: string) {
  return workspaces.find((workspace) => workspace.slug === slug);
}
