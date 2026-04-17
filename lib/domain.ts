export type ReviewState = "Approved" | "Changes requested" | "Pending review";

export type Account = {
  id: number;
  name: string;
  role: string;
  email: string;
  handle?: string;
};

export type Comment = {
  id: number;
  author: string;
  postedAt: string;
  body: string;
  timestamp?: string;
};

export type Version = {
  id: number;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: ReviewState;
  summary: string;
  duration: string;
  audioUrl: string | null;
  comments: Comment[];
};

export type Song = {
  id: number;
  slug: string;
  name: string;
  status: ReviewState;
  version: string;
  note: string;
  comments: number;
  updatedAt: string;
  bpm: number;
  key: string;
  latestVersionId: number;
  versions: Version[];
};

export type Workspace = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  members: Account[];
  songs: Song[];
  activity: string[];
};
