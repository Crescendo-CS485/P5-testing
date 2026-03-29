import { MessageSquare, Users } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Artist } from "../data/mockData";

interface ArtistCardProps {
  artist: Artist;
  isActiveFilter: boolean;
}

export function ArtistCard({ artist, isActiveFilter }: ArtistCardProps) {
  const navigate = useNavigate();
  const isHighActivity = artist.activityScore >= 8.5;

  return (
    <Link
      to={`/artists/${artist.id}`}
      className="bg-[#252525] border border-[#333333] hover:border-[#5b9dd9] transition-colors duration-200 flex flex-col h-full"
    >
      {/* Artist Image - Square */}
      <div className="relative aspect-square overflow-hidden border-b border-[#333333]">
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
        {/* Activity Score Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 text-center font-bold text-sm ${
            isHighActivity ? 'bg-[#5b9dd9] text-white' : 'bg-[#444444] text-white'
          }`}
          aria-label={`Activity score: ${artist.activityScore.toFixed(1)}`}
        >
          <span aria-hidden="true">{artist.activityScore.toFixed(1)}</span>
        </div>
        {/* Active Indicator */}
        {isActiveFilter && isHighActivity && (
          <div className="absolute top-2 left-2 bg-[#ff6b35] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            Active
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Artist Name */}
        <h3 className="text-sm font-bold text-white mb-1 line-clamp-1 hover:text-[#5b9dd9] transition-colors cursor-pointer">
          {artist.name}
        </h3>

        {/* Genres */}
        <div className="flex flex-wrap gap-1 mb-2">
          {artist.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] text-[#999999] border border-[#333333] uppercase tracking-wide"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Bio */}
        <p className="text-xs text-[#999999] line-clamp-3 mb-3 flex-1">
          {artist.bio}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-[10px] text-[#666666] mb-3 pb-3 border-b border-[#333333]">
          <div className="flex items-center gap-1" aria-label={`${artist.discussionCount} discussions`}>
            <MessageSquare className="w-3 h-3" aria-hidden="true" />
            <span aria-hidden="true">{artist.discussionCount}</span>
          </div>
          <div className="flex items-center gap-1" aria-label={`${(artist.discussionCount * 3.4).toFixed(0)} listeners`}>
            <Users className="w-3 h-3" aria-hidden="true" />
            <span aria-hidden="true">{(artist.discussionCount * 3.4).toFixed(0)}</span>
          </div>
        </div>

        {/* Latest Thread Preview */}
        <div className="mb-3">
          <p className="text-xs text-[#e8e8e8] line-clamp-2 mb-1">
            {artist.latestThread.title}
          </p>
          <p className="text-[10px] text-[#666666]">{artist.latestThread.timestamp}</p>
        </div>

        {/* Join Button */}
        <Button
          className="w-full bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white font-medium rounded-sm h-8 text-xs mt-auto"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (artist.latestThread.id) {
              navigate(`/discussions/${artist.latestThread.id}`);
            } else {
              navigate(`/artists/${artist.id}`);
            }
          }}
        >
          Join Discussion
        </Button>
      </div>
    </Link>
  );
}
