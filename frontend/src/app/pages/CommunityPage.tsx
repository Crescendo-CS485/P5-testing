import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, TrendingUp, Clock, Bot, Users, Info } from "lucide-react";
import { Link } from "react-router";
import { ErrorState, EmptyState } from "../components/PageStates";
import { Button } from "../components/ui/button";

interface Discussion {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  postCount: number;
  lastActivityAt: string;
  createdAt: string;
}

interface DiscussionsResponse {
  discussions: Discussion[];
  total: number;
  page: number;
  pages: number;
}

type SortOption = "recent" | "popular";
type DevState = "loading" | "error" | "empty";

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DiscussionCard({ discussion }: { discussion: Discussion }) {
  return (
    <Link
      to={`/discussions/${discussion.id}`}
      className="bg-[#252525] border border-[#333333] hover:border-[#5b9dd9] transition-colors p-4 flex gap-4"
    >
      {/* Post Count */}
      <div className="flex-shrink-0 text-center w-12">
        <div className="text-lg font-bold text-white">{discussion.postCount}</div>
        <div className="text-[10px] text-[#666666] uppercase tracking-wide">posts</div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#5b9dd9] mb-1 font-medium">{discussion.artistName}</p>
        <h3 className="text-sm font-bold text-white line-clamp-2 mb-2 hover:text-[#5b9dd9] transition-colors">
          {discussion.title}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-[#666666]">
          <Clock className="w-3 h-3" />
          <span>Active {formatRelativeTime(discussion.lastActivityAt)}</span>
        </div>
      </div>

      {/* Message icon */}
      <div className="flex-shrink-0 flex items-start pt-1">
        <MessageSquare className="w-4 h-4 text-[#444444]" />
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [devState, setDevState] = useState<DevState | null>(null);

  const PER_PAGE = 20;

  const { data, isLoading, isError, refetch } = useQuery<DiscussionsResponse>({
    queryKey: ["discussions", { sort, page }],
    queryFn: () =>
      fetch(`/api/discussions?sort=${sort}&page=${page}&per_page=${PER_PAGE}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch discussions");
        return r.json();
      }),
  });

  const { data: stats } = useQuery<{ artistCount: number; userCount: number }>({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
    staleTime: 60_000,
  });

  const discussions = data?.discussions ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 0;

  const effectiveLoading = devState === "loading" || (devState === null && isLoading);
  const effectiveError = devState === "error" || (devState === null && isError);
  const effectiveEmpty =
    devState === "empty" ||
    (devState === null && !isLoading && !isError && discussions.length === 0);
  const effectiveSuccess = !effectiveLoading && !effectiveError && !effectiveEmpty;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-5 pb-5 border-b border-[#2a2a2a]">
        <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
        <p className="text-sm text-[#999999]">
          {total} discussions across all artists
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Column */}
        <div className="flex-1 min-w-0">
          {/* Sort Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setSort("recent"); setPage(1); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm transition-colors ${
                sort === "recent"
                  ? "bg-[#5b9dd9] text-white"
                  : "bg-[#252525] text-[#999999] border border-[#333333] hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Recent
            </button>
            <button
              onClick={() => { setSort("popular"); setPage(1); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm transition-colors ${
                sort === "popular"
                  ? "bg-[#5b9dd9] text-white"
                  : "bg-[#252525] text-[#999999] border border-[#333333] hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Popular
            </button>
          </div>

          {/* Error */}
          {effectiveError && <ErrorState onRetry={() => refetch()} />}

          {/* Loading */}
          {effectiveLoading && (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-20 bg-[#252525] border border-[#333333] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty */}
          {effectiveEmpty && (
            <EmptyState
              title="No Discussions Yet"
              message="Discussions will appear here as activity grows."
            />
          )}

          {/* Discussion List */}
          {effectiveSuccess && (
            <>
              <div className="space-y-2">
                {discussions.map((d) => (
                  <DiscussionCard key={d.id} discussion={d} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#2a2a2a]">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm bg-[#252525] border border-[#333333] text-[#999999] hover:text-white rounded-sm disabled:opacity-30 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#666666]">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm bg-[#252525] border border-[#333333] text-[#999999] hover:text-white rounded-sm disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:w-72 flex-shrink-0 space-y-4">
          {/* Community Stats */}
          <div className="bg-[#252525] border border-[#333333] p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5b9dd9]" />
              Community Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#999999]">Total Discussions</span>
                <span className="text-white font-bold">{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#999999]">Active Artists</span>
                <span className="text-white font-bold">{stats?.artistCount ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#999999]">Community Members</span>
                <span className="text-white font-bold">{stats?.userCount ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Bot Transparency */}
          <div className="bg-[#252525] border border-[#333333] p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#7c3aed]" />
              Bot Transparency
            </h2>
            <p className="text-xs text-[#999999] mb-3 leading-relaxed">
              Crescendo uses AI-powered synthetic community members to seed authentic music
              discussions. All bot accounts are clearly labeled to maintain transparency.
            </p>
            <div className="space-y-2">
              {[
                { name: "MusicEnthusiast", label: "Synthetic Fan" },
                { name: "GenreHistorian", label: "Synthetic Fan" },
                { name: "CriticalEar", label: "Synthetic Fan" },
                { name: "NewListener", label: "Synthetic Fan" },
              ].map((bot) => (
                <div
                  key={bot.name}
                  className="flex items-center justify-between bg-[#1a1a1a] px-2.5 py-1.5"
                >
                  <span className="text-xs text-white">{bot.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/30 uppercase tracking-wide">
                    {bot.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 text-[10px] text-[#666666]">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                Bot comments are generated by Claude Haiku and are always disclosed in the UI.
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Developer Controls */}
      <div className="mt-8 p-5 bg-[#252525] border border-[#333333]">
        <h3 className="text-white font-bold mb-2 text-sm flex items-center gap-2">
          <span>🛠</span> Developer Controls
        </h3>
        <p className="text-xs text-[#999999] mb-3">
          Test different UI states and interface behaviors
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setDevState("loading")}
            variant={devState === "loading" ? "default" : "outline"}
            className={
              devState === "loading"
                ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-7 text-xs"
                : "border-[#333333] text-[#999999] hover:bg-[#1a1a1a] hover:text-white rounded-sm h-7 text-xs"
            }
          >
            Loading State
          </Button>
          <Button
            onClick={() => setDevState(null)}
            variant={devState === null ? "default" : "outline"}
            className={
              devState === null
                ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-7 text-xs"
                : "border-[#333333] text-[#999999] hover:bg-[#1a1a1a] hover:text-white rounded-sm h-7 text-xs"
            }
          >
            Live (Success)
          </Button>
          <Button
            onClick={() => setDevState("error")}
            variant={devState === "error" ? "default" : "outline"}
            className={
              devState === "error"
                ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-7 text-xs"
                : "border-[#333333] text-[#999999] hover:bg-[#1a1a1a] hover:text-white rounded-sm h-7 text-xs"
            }
          >
            Error State
          </Button>
          <Button
            onClick={() => setDevState("empty")}
            variant={devState === "empty" ? "default" : "outline"}
            className={
              devState === "empty"
                ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-7 text-xs"
                : "border-[#333333] text-[#999999] hover:bg-[#1a1a1a] hover:text-white rounded-sm h-7 text-xs"
            }
          >
            Empty State
          </Button>
        </div>
      </div>
    </div>
  );
}
