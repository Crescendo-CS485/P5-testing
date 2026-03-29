import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3 } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { ArtistCard } from "../components/ArtistCard";
import { ArtistCardSkeleton } from "../components/ArtistCardSkeleton";
import { EmptyState, ErrorState } from "../components/PageStates";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Artist } from "../data/mockData";

interface ArtistsResponse {
  artists: Artist[];
  total: number;
  page: number;
  pages: number;
}

type SortOption = "activity" | "recent";
type DevState = "loading" | "error" | "empty";

function buildParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === false || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, String(v)));
    } else {
      sp.set(key, String(value));
    }
  }
  return sp.toString();
}

const PER_PAGE = 12;

export default function DiscoveryPage() {
  const navigate = useNavigate();
  const [activeDiscussions, setActiveDiscussions] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [sort, setSort] = useState<SortOption>("activity");
  const [page, setPage] = useState(1);
  const [devState, setDevState] = useState<DevState | null>(null);

  const queryParams = buildParams({
    active_discussions: activeDiscussions || undefined,
    genre: selectedGenres.length > 0 ? selectedGenres : undefined,
    time_range: selectedTimeRange !== "all" ? selectedTimeRange : undefined,
    sort,
    page,
    per_page: PER_PAGE,
  });

  const { data, isLoading, isError, refetch } = useQuery<ArtistsResponse>({
    queryKey: ["artists", { activeDiscussions, selectedGenres, selectedTimeRange, sort, page }],
    queryFn: () =>
      fetch(`/api/artists?${queryParams}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch artists");
        return r.json();
      }),
  });

  const artists = data?.artists ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 0;
  const firstArtistId = data?.artists[0]?.id;

  const effectiveLoading = devState === "loading" || (devState === null && isLoading);
  const effectiveError = devState === "error" || (devState === null && isError);
  const effectiveEmpty =
    devState === "empty" ||
    (devState === null && !isLoading && !isError && artists.length === 0);
  const effectiveSuccess = !effectiveLoading && !effectiveError && !effectiveEmpty;

  const handleReset = () => {
    setActiveDiscussions(false);
    setSelectedGenres([]);
    setSelectedTimeRange("all");
    setSort("activity");
    setPage(1);
    setDevState(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 pb-5 border-b border-[#2a2a2a]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Artist Discovery
          </h1>
          <p className="text-sm text-[#999999]">
            {total} {total === 1 ? "artist" : "artists"} •{" "}
            Discover and engage with independent artists
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#666666]" />
          <span className="text-xs text-[#999999] uppercase tracking-wide">Sort:</span>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortOption);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-[#252525] border-[#333333] text-white rounded-sm h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-[#333333] text-white rounded-sm">
              <SelectItem value="activity" className="text-white focus:bg-[#252525] focus:text-white text-sm">
                Activity Score
              </SelectItem>
              <SelectItem value="recent" className="text-white focus:bg-[#252525] focus:text-white text-sm">
                Most Recent
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        activeDiscussions={activeDiscussions}
        onActiveDiscussionsChange={(v) => {
          setActiveDiscussions(v);
          setPage(1);
        }}
        selectedGenres={selectedGenres}
        onGenresChange={(g) => {
          setSelectedGenres(g);
          setPage(1);
        }}
        selectedTimeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
        onReset={handleReset}
      />

      {/* Error */}
      {effectiveError && <ErrorState onRetry={() => refetch()} />}

      {/* Loading */}
      {effectiveLoading && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
          <div role="status" aria-live="polite" className="flex items-center justify-center mt-8 text-[#666666]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
            <span className="text-sm">Loading artist data...</span>
          </div>
        </div>
      )}

      {/* Empty */}
      {effectiveEmpty && <EmptyState onAction={handleReset} />}

      {/* Success */}
      {effectiveSuccess && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isActiveFilter={activeDiscussions}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between mt-8 pt-6 border-t border-[#2a2a2a]">
              <div className="text-sm text-[#999999]" aria-live="polite" aria-atomic="true">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="border-[#333333] text-white hover:bg-[#252525] disabled:opacity-30 rounded-sm h-8 px-3 text-sm"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }

                    return (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={page === p ? "page" : undefined}
                        className={
                          page === p
                            ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white border-[#5b9dd9] rounded-sm h-8 w-8 p-0"
                            : "border-[#333333] text-[#999999] hover:bg-[#252525] hover:text-white rounded-sm h-8 w-8 p-0"
                        }
                        size="sm"
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="border-[#333333] text-white hover:bg-[#252525] disabled:opacity-30 rounded-sm h-8 px-3 text-sm"
                >
                  Next
                </Button>
              </div>

              <div className="text-sm text-[#999999] hidden sm:block">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
              </div>
            </nav>
          )}
        </>
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
          {firstArtistId && (
            <Button
              onClick={() => navigate(`/artists/${firstArtistId}`)}
              variant="outline"
              className="border-[#7c3aed] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white rounded-sm h-7 text-xs"
            >
              Go to Artist →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
