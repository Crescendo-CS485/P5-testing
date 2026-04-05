import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Artist, Discussion } from "../data/mockData";
import { Button } from "../components/ui/button";

interface ArtistResponse {
  artist: Artist;
}

interface DiscussionsResponse {
  discussions: Discussion[];
  total: number;
}

type DevState = "loading" | "not-found";

export function formatTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const [triggering, setTriggering] = useState(false);
  const [devState, setDevState] = useState<DevState | null>(null);

  const { data: artistData, isLoading: artistLoading } = useQuery<ArtistResponse>({
    queryKey: ["artist", id],
    queryFn: () =>
      fetch(`/api/artists/${id}`).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
    enabled: !!id,
  });

  const artist = artistData?.artist;

  const { data: discussionData, isLoading: discLoading, refetch: refetchDiscussions } =
    useQuery<DiscussionsResponse>({
      queryKey: ["discussions", id],
      queryFn: () =>
        fetch(`/api/artists/${id}/discussions`).then((r) => {
          if (!r.ok) throw new Error("Failed to fetch discussions");
          return r.json();
        }),
      enabled: !!id,
      refetchInterval: 8000,
    });

  const discussions = discussionData?.discussions ?? [];

  async function handleTrigger() {
    if (!id) return;
    setTriggering(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "page_activation", artistId: id }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Scheduled ${result.job_count} LLM comment job(s). Check back in 10–120s!`);
        setTimeout(() => refetchDiscussions(), 5000);
      } else {
        toast.error(result.error ?? "Failed to trigger LLM activity");
      }
    } catch {
      toast.error("Network error — could not reach the server");
    } finally {
      setTriggering(false);
    }
  }

  const showLoading = devState === "loading" || (devState === null && artistLoading);
  const showNotFound = devState === "not-found" || (devState === null && !artistLoading && !artist);
  const showContent = !showLoading && !showNotFound;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {showLoading && (
        <div role="status" aria-live="polite" className="flex items-center justify-center py-24 text-[#666666]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" aria-hidden="true" />
          <span>Loading artist...</span>
        </div>
      )}

      {showNotFound && (
        <div className="py-12 text-center">
          <p className="text-[#999999] mb-4">Artist not found.</p>
          <Link to="/" className="text-[#5b9dd9] hover:underline text-sm">
            Back to Discovery
          </Link>
        </div>
      )}

      {showContent && artist && (
        <>
          {/* Back nav */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#999999] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </Link>

          {/* Hero */}
          <div className="flex gap-6 mb-8">
            <div className="w-40 h-40 flex-shrink-0 overflow-hidden border border-[#333333]">
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1 mb-2">
                {artist.genres.map((g) => (
                  <span
                    key={g}
                    className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] text-[#999999] border border-[#333333] uppercase tracking-wide"
                  >
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{artist.name}</h1>
              <p className="text-sm text-[#999999] mb-4 leading-relaxed">{artist.bio}</p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-[#666666]">Activity</span>
                  <span
                    className={`ml-2 font-bold ${
                      artist.activityScore >= 8.5 ? "text-[#5b9dd9]" : "text-white"
                    }`}
                  >
                    {artist.activityScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-[#666666]">Discussions</span>
                  <span className="ml-2 font-bold text-white">{discussions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger button */}
          <div className="mb-8">
            <Button
              onClick={handleTrigger}
              disabled={triggering}
              className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-semibold rounded-sm h-9 px-4 text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {triggering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Trigger LLM Activity
            </Button>
            <p className="text-[11px] text-[#888888] mt-1.5">
              Schedules 3–5 synthetic fan comments across discussions (10–120s delay)
            </p>
          </div>

          {/* Discussions */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#5b9dd9]" />
              Discussions
            </h2>

            {discLoading && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 text-[#666666] py-4">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span className="text-sm">Loading discussions...</span>
              </div>
            )}

            {!discLoading && discussions.length === 0 && (
              <p className="text-sm text-[#666666] py-4">
                No discussions yet. Trigger LLM activity to generate some!
              </p>
            )}

            {!discLoading && discussions.length > 0 && (
              <div className="space-y-2">
                {discussions.map((disc) => (
                  <Link
                    key={disc.id}
                    to={`/discussions/${disc.id}`}
                    className="block bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#5b9dd9] p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1 line-clamp-2">{disc.title}</p>
                        <p className="text-[11px] text-[#888888]">
                          {disc.postCount} {disc.postCount === 1 ? "post" : "posts"} ·{" "}
                          {formatTime(disc.lastActivityAt)}
                        </p>
                      </div>
                      <MessageSquare className="w-4 h-4 text-[#444444] flex-shrink-0 mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
            onClick={() => setDevState(null)}
            variant={devState === null ? "default" : "outline"}
            className={
              devState === null
                ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-7 text-xs"
                : "border-[#333333] text-[#999999] hover:bg-[#1a1a1a] hover:text-white rounded-sm h-7 text-xs"
            }
          >
            Live
          </Button>
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
            onClick={() => setDevState("not-found")}
            variant={devState === "not-found" ? "default" : "outline"}
            className={
              devState === "not-found"
                ? "bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-7 text-xs"
                : "border-[#333333] text-[#999999] hover:bg-[#1a1a1a] hover:text-white rounded-sm h-7 text-xs"
            }
          >
            Not Found State
          </Button>
        </div>
      </div>
    </div>
  );
}
