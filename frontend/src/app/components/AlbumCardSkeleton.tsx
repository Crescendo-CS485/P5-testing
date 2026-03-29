import { Skeleton } from "./ui/skeleton";

export function AlbumCardSkeleton() {
  return (
    <div className="bg-[#252525] border border-[#333333] flex flex-col h-full">
      {/* Cover Skeleton */}
      <Skeleton className="w-full aspect-square bg-[#1a1a1a] border-b border-[#333333]" />

      {/* Content Skeleton */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title */}
        <Skeleton className="h-3.5 w-3/4 bg-[#1a1a1a] mb-1.5" />
        {/* Artist */}
        <Skeleton className="h-3 w-1/2 bg-[#1a1a1a] mb-3" />
        {/* Genres */}
        <div className="flex gap-1 mb-3">
          <Skeleton className="h-4 w-12 bg-[#1a1a1a]" />
          <Skeleton className="h-4 w-16 bg-[#1a1a1a]" />
        </div>
        {/* Date */}
        <Skeleton className="h-2.5 w-24 bg-[#1a1a1a] mb-3 flex-1" />
        {/* Stats */}
        <div className="flex justify-between pt-2 border-t border-[#333333]">
          <Skeleton className="h-2.5 w-14 bg-[#1a1a1a]" />
          <Skeleton className="h-2.5 w-10 bg-[#1a1a1a]" />
        </div>
      </div>
    </div>
  );
}
