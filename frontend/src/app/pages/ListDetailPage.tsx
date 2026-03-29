import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Music, Loader2, Plus, X } from "lucide-react";
import { AlbumCard } from "../components/AlbumCard";
import { AlbumCardSkeleton } from "../components/AlbumCardSkeleton";
import { AddAlbumModal } from "../components/AddAlbumModal";
import { useAuth } from "../context/AuthContext";
import { UserListDetail } from "../data/mockData";

interface ListDetailResponse {
  list: UserListDetail;
}

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<ListDetailResponse>({
    queryKey: ["list", id],
    queryFn: () =>
      fetch(`/api/lists/${id}`).then((r) => {
        if (!r.ok) throw new Error("List not found");
        return r.json();
      }),
    enabled: !!id,
  });

  const list = data?.list;

  async function handleRemove(albumId: string) {
    setRemoving(albumId);
    try {
      await fetch(`/api/lists/${id}/albums/${albumId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["list", id] });
    } finally {
      setRemoving(null);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="h-6 w-20 bg-[#252525] mb-6" />
        <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
          <div className="h-8 w-64 bg-[#252525] mb-2" />
          <div className="h-4 w-32 bg-[#252525]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <AlbumCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !list) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-[#999999] mb-4">List not found.</p>
        <Link to="/lists" className="text-[#5b9dd9] hover:underline text-sm">
          Back to Lists
        </Link>
      </div>
    );
  }

  const existingAlbumIds = list.albums.map((a) => a.id);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Back nav */}
      <Link
        to="/lists"
        className="inline-flex items-center gap-1.5 text-sm text-[#999999] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Lists
      </Link>

      {/* List header */}
      <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{list.title}</h1>
            <p className="text-sm text-[#5b9dd9] mb-2">by {list.createdBy}</p>
            {list.description && (
              <p className="text-sm text-[#999999] max-w-2xl leading-relaxed">
                {list.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-4 text-sm text-[#666666]">
              <div className="flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                <span>{list.albumCount} albums</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                <span>{list.likes}</span>
              </div>
            </div>
            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white text-sm font-medium rounded-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Albums
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Albums */}
      {list.albums.length === 0 ? (
        <div className="text-center py-16 bg-[#252525] border border-[#333333]">
          <Music className="w-10 h-10 text-[#444444] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No albums yet</p>
          {user ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white text-sm font-medium rounded-sm transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Albums
            </button>
          ) : (
            <p className="text-sm text-[#666666]">Sign in to add albums.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {list.albums.map((album) => (
            <div key={album.id} className="relative group">
              <AlbumCard album={album} />
              {user && (
                <button
                  onClick={() => handleRemove(album.id)}
                  disabled={removing === album.id}
                  className="absolute top-2 left-2 w-6 h-6 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-sm z-10"
                  title="Remove from list"
                >
                  {removing === album.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddAlbumModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        listId={id!}
        existingAlbumIds={existingAlbumIds}
      />
    </div>
  );
}
