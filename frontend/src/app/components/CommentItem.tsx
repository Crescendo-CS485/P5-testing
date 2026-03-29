import { Post } from "../data/mockData";
import { UserBadge } from "./UserBadge";

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CommentItemProps {
  post: Post;
}

export function CommentItem({ post }: CommentItemProps) {
  return (
    <div className="py-4 border-b border-[#2a2a2a] last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <UserBadge
          displayName={post.author.displayName}
          handle={post.author.handle}
          isBot={post.author.isBot}
          botLabel={post.author.botLabel}
        />
        <span className="text-[11px] text-[#888888]">{formatRelativeTime(post.createdAt)}</span>
      </div>
      <p className="text-sm text-[#cccccc] leading-relaxed">{post.body}</p>
    </div>
  );
}
