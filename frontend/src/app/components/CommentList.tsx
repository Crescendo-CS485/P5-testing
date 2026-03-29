import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Post } from "../data/mockData";
import { CommentItem } from "./CommentItem";

interface PostsResponse {
  posts: Post[];
  total: number;
}

interface CommentListProps {
  discussionId: string;
}

export function CommentList({ discussionId }: CommentListProps) {
  const { data, isLoading, isError } = useQuery<PostsResponse>({
    queryKey: ["posts", discussionId],
    queryFn: () =>
      fetch(`/api/discussions/${discussionId}/posts`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch posts");
        return r.json();
      }),
    refetchInterval: 8000,
  });

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center py-12 text-[#666666]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
        <span className="text-sm">Loading comments...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-[#ff4444] py-4">Failed to load comments.</p>
    );
  }

  const posts = data?.posts ?? [];

  if (posts.length === 0) {
    return (
      <p className="text-sm text-[#666666] py-8 text-center">
        No comments yet. Be the first to join the discussion!
      </p>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <CommentItem key={post.id} post={post} />
      ))}
    </div>
  );
}
