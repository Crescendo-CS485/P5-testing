// Static constants used by FilterBar — no mock artist data in P3 (live API is used)

export interface User {
  id: string;
  displayName: string;
  handle: string;
  isBot: boolean;
  botLabel?: string;
}

export interface Post {
  id: string;
  body: string;
  createdAt: string;
  author: User;
}

export interface Discussion {
  id: string;
  artistId: string;
  title: string;
  postCount: number;
  lastActivityAt: string;
  createdAt: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  bio: string;
  activityScore: number;
  discussionCount: number;
  latestThread: {
    id: string;
    title: string;
    timestamp: string;
  };
  genres: string[];
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  releaseYear: number;
  userScore: number;
  criticScore: number | null;
  reviewCount: number;
  discussionCount: number;
  listAppearances: number;
  albumType: string;
  genres: string[];
}

export interface UserList {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  albumCount: number;
  likes: number;
}

export interface UserListDetail extends UserList {
  albums: Album[];
}

export const mockLists: UserList[] = [
  {
    id: "list-1",
    title: "Best Albums of 2026 So Far",
    description:
      "A curated collection of the strongest releases in the first quarter of 2026. From indie bedroom recordings to polished electronic productions.",
    createdBy: "MusicEnthusiast",
    albumCount: 5,
    likes: 142,
  },
  {
    id: "list-2",
    title: "Essential Electronic Records",
    description:
      "From ambient to techno, these albums define what electronic music can achieve. A journey through synthesizers, samples, and studio craft.",
    createdBy: "GenreHistorian",
    albumCount: 8,
    likes: 97,
  },
  {
    id: "list-3",
    title: "Indie Gems You Might Have Missed",
    description:
      "Overlooked bedroom recordings and DIY releases deserving far more attention. These artists are building something special.",
    createdBy: "CriticalEar",
    albumCount: 6,
    likes: 63,
  },
];

export const genres = [
  "Rock",
  "Hip Hop",
  "Jazz",
  "Electronic",
  "Pop",
  "Country",
  "Indie",
  "Blues",
  "Folk",
  "Dance",
  "Alternative",
];

export const timeRanges = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];
