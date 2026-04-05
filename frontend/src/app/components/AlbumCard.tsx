import { MessageSquare, Music, Star } from "lucide-react";
import { Link } from "react-router";
import { Album } from "../data/mockData";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const isHighScore = album.userScore >= 9.0;

  return (
    <Link
      to={`/artists/${album.artistId}`}
      className="bg-[#252525] border border-[#333333] hover:border-[#5b9dd9] transition-colors duration-200 flex flex-col h-full"
    >
      {/* Cover Art */}
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
        {/* Score Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 text-center font-bold text-sm ${
            isHighScore ? "bg-[#5b9dd9] text-white" : "bg-[#444444] text-white"
          }`}
        >
          {album.userScore.toFixed(1)}
        </div>
        {/* Album Type Badge */}
        {album.albumType !== "studio" && (
          <div className="absolute top-2 left-2 bg-[#7c3aed] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {album.albumType}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1 hover:text-[#5b9dd9] transition-colors">
          {album.title}
        </h3>

        {/* Artist Name */}
        <p className="text-xs text-[#999999] mb-2 line-clamp-1">{album.artistName}</p>

        {/* Genres */}
        <div className="flex flex-wrap gap-1 mb-2">
          {album.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] text-[#999999] border border-[#333333] uppercase tracking-wide"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Release Date */}
        <p className="text-[10px] text-[#666666] mb-3 flex-1">{album.releaseDate}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-[10px] text-[#666666] pt-2 border-t border-[#333333]">
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
  );
}
