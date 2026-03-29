import { useState, useEffect } from "react";
import { X, Search, Plus, Check, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Album } from "../data/mockData";

interface AlbumsResponse {
  albums: Album[];
}

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  existingAlbumIds: string[];
}

export function AddAlbumModal({
  isOpen,
  onClose,
  listId,
  existingAlbumIds,
}: AddAlbumModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set(existingAlbumIds));

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setAdded(new Set(existingAlbumIds));
    }
  }, [isOpen, existingAlbumIds]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const { data, isLoading } = useQuery<AlbumsResponse>({
    queryKey: ["albums-picker"],
    queryFn: () =>
      fetch("/api/albums?per_page=100&sort=user_score").then((r) => r.json()),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const albums = data?.albums ?? [];

  const filtered = search.trim()
    ? albums.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.artistName.toLowerCase().includes(search.toLowerCase())
      )
    : albums;

  async function handleAdd(albumId: string) {
    setAdding(albumId);
    try {
      const res = await fetch(`/api/lists/${listId}/albums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      if (!res.ok) throw new Error("Failed to add album");
      setAdded((prev) => new Set([...prev, albumId]));
      queryClient.invalidateQueries({ queryKey: ["list", listId] });
    } catch {
      // silently fail — button stays clickable for retry
    } finally {
      setAdding(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] w-full max-w-xl mx-4 z-10 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2a2a2a] flex-shrink-0">
          <span className="text-white font-bold text-base">Add Albums</span>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search albums or artists..."
              className="w-full bg-[#252525] border border-[#333333] text-white text-sm pl-9 pr-3 py-2 rounded-sm outline-none focus:border-[#5b9dd9] transition-colors placeholder:text-[#555555]"
            />
          </div>
        </div>

        {/* Album list */}
        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-1">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-[#666666]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading albums...</span>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-sm text-[#666666] py-10">No albums found.</p>
          )}

          {filtered.map((album) => {
            const isAdded = added.has(album.id);
            const isAddingThis = adding === album.id;

            return (
              <div
                key={album.id}
                className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-[#252525] transition-colors"
              >
                {/* Cover */}
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-10 h-10 object-cover flex-shrink-0 border border-[#333333]"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-1">{album.title}</p>
                  <p className="text-xs text-[#999999] line-clamp-1">{album.artistName}</p>
                </div>

                {/* Score */}
                <span className="text-xs text-[#666666] flex-shrink-0 w-8 text-right">
                  {album.userScore.toFixed(1)}
                </span>

                {/* Add button */}
                <button
                  onClick={() => !isAdded && handleAdd(album.id)}
                  disabled={isAdded || isAddingThis}
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm border transition-colors ${
                    isAdded
                      ? "border-[#5b9dd9] text-[#5b9dd9] bg-[#5b9dd9]/10 cursor-default"
                      : "border-[#444444] text-[#666666] hover:border-[#5b9dd9] hover:text-[#5b9dd9]"
                  }`}
                >
                  {isAddingThis ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isAdded ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2a2a2a] flex-shrink-0 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#999999] hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
