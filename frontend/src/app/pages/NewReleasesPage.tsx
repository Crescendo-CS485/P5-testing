import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Star, MessageSquare, Music } from "lucide-react";
import { Link } from "react-router";
import { AlbumCardSkeleton } from "../components/AlbumCardSkeleton";
import { ErrorState, EmptyState } from "../components/PageStates";
import { Button } from "../components/ui/button";
import { Album } from "../data/mockData";

interface AlbumsResponse {
  albums: Album[];
  total: number;
  page: number;
  pages: number;
}

type TimeFilter = "all-time" | "this-month" | "this-week" | "today" | "upcoming";
type DevState = "loading" | "error" | "empty";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all-time", label: "All Releases" },
  { value: "this-month", label: "This Month" },
  { value: "this-week", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

function groupByDate(albums: Album[]): Record<string, Album[]> {
  return albums.reduce<Record<string, Album[]>>((acc, album) => {
    const key = album.releaseDate ?? "Unknown Date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(album);
    return acc;
  }, {});
}

export default function NewReleasesPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [devState, setDevState] = useState<DevState | null>(null);

  const params = new URLSearchParams();
  params.set("sort", "release_date");
  params.set("per_page", "50");
  if (timeFilter !== "all-time") params.set("time_range", timeFilter);

  const { data, isLoading, isError, refetch } = useQuery<AlbumsResponse>({
    queryKey: ["albums-releases", { timeFilter }],
    queryFn: () =>
      fetch(`/api/albums?${params}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch releases");
        return r.json();
      }),
  });

  const albums = data?.albums ?? [];
  const grouped = groupByDate(albums);
  const dateKeys = Object.keys(grouped);

  const effectiveLoading = devState === "loading" || (devState === null && isLoading);
  const effectiveError = devState === "error" || (devState === null && isError);
  const effectiveEmpty =
    devState === "empty" ||
    (devState === null && !isLoading && !isError && albums.length === 0);
  const effectiveSuccess = !effectiveLoading && !effectiveError && !effectiveEmpty;

  // Stats
  const totalReviews = albums.reduce((s, a) => s + a.reviewCount, 0);
  const totalDiscussions = albums.reduce((s, a) => s + a.discussionCount, 0);
  const avgScore =
    albums.length > 0
      ? (albums.reduce((s, a) => s + a.userScore, 0) / albums.length).toFixed(1)
      : "—";

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 pb-5 border-b border-[#2a2a2a]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">New Releases</h1>
          <p className="text-sm text-[#999999]">
            {albums.length} {albums.length === 1 ? "release" : "releases"} • Grouped by release date
          </p>
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Calendar className="w-4 h-4 text-[#666666]" />
        {TIME_FILTERS.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeFilter(tf.value)}
            className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${
              timeFilter === tf.value
                ? "bg-[#5b9dd9] text-white"
                : "bg-[#252525] text-[#999999] border border-[#333333] hover:text-white hover:border-[#5b9dd9]"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {effectiveError && <ErrorState onRetry={() => refetch()} />}

      {/* Loading */}
      {effectiveLoading && (
        <div className="space-y-8">
          {[1, 2].map((s) => (
            <div key={s}>
              <div className="h-5 w-40 bg-[#333333] rounded animate-pulse mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <AlbumCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {effectiveEmpty && (
        <EmptyState
          title="No Releases Found"
          message="No albums match the selected time range. Try 'All Releases'."
          onAction={() => setTimeFilter("all-time")}
          actionLabel="Show All"
        />
      )}

      {/* Grouped Releases */}
      {effectiveSuccess && (
        <div className="space-y-8">
          {dateKeys.map((dateKey) => (
            <section key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-white">{dateKey}</h2>
                <span className="text-xs text-[#666666]">
                  {grouped[dateKey].length} {grouped[dateKey].length === 1 ? "release" : "releases"}
                </span>
                <div className="flex-1 border-t border-[#2a2a2a]" />
              </div>

              {/* Albums grid for this date */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {grouped[dateKey].map((album) => (
                  <Link
                    key={album.id}
                    to={`/artists/${album.artistId}`}
                    className="bg-[#252525] border border-[#333333] hover:border-[#5b9dd9] transition-colors flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden border-b border-[#333333]">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                          <Music className="w-12 h-12 text-[#444444]" />
                        </div>
                      )}
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 font-bold text-sm ${
                          album.userScore >= 9 ? "bg-[#5b9dd9] text-white" : "bg-[#444444] text-white"
                        }`}
                      >
                        {album.userScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-white line-clamp-1 mb-0.5 hover:text-[#5b9dd9] transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-xs text-[#999999] line-clamp-1 mb-2">{album.artistName}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#666666]">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>{album.reviewCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{album.discussionCount}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Stats Footer */}
          <div className="mt-10 pt-6 border-t border-[#2a2a2a] grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Releases", value: albums.length },
              { label: "Total Reviews", value: totalReviews.toLocaleString() },
              { label: "Total Discussions", value: totalDiscussions.toLocaleString() },
              { label: "Avg Score", value: avgScore },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#252525] border border-[#333333] p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-[#666666] uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
