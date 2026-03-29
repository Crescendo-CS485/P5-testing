import { Skeleton } from "./ui/skeleton";

export function ArtistCardSkeleton() {
  return (
    <div className="bg-[#252525] border border-[#333333] flex flex-col h-full">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-square bg-[#1a1a1a] border-b border-[#333333]" />

      {/* Content Skeleton */}
      <div className="p-3 flex flex-col flex-1">
        {/* Name */}
        <Skeleton className="h-4 w-3/4 bg-[#1a1a1a] mb-1" />

        {/* Genres */}
        <div className="flex gap-1 mb-2">
          <Skeleton className="h-4 w-12 bg-[#1a1a1a]" />
          <Skeleton className="h-4 w-16 bg-[#1a1a1a]" />
        </div>

        {/* Bio */}
        <div className="space-y-1 mb-3 flex-1">
          <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-3 w-4/5 bg-[#1a1a1a]" />
        </div>

        {/* Stats */}
        <div className="flex justify-between mb-3 pb-3 border-b border-[#333333]">
          <Skeleton className="h-3 w-12 bg-[#1a1a1a]" />
          <Skeleton className="h-3 w-12 bg-[#1a1a1a]" />
        </div>

        {/* Thread */}
        <div className="mb-3 space-y-1">
          <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-3 w-3/4 bg-[#1a1a1a]" />
          <Skeleton className="h-2 w-16 bg-[#1a1a1a]" />
        </div>

        {/* Button */}
        <Skeleton className="h-8 w-full bg-[#1a1a1a]" />
      </div>
    </div>
  );
}
