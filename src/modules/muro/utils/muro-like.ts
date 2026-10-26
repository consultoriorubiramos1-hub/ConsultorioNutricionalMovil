import type { Post } from "../models/muro.model";

// Only apply the state confirmed by POST; leave the previous state intact on failure.
export function applyConfirmedLike(post: Post, liked: boolean): Post {
  if (post.userHasLiked === liked) return post;
  const delta = liked ? 1 : -1;
  return {
    ...post,
    userHasLiked: liked,
    likesCount: Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, post.likesCount + delta)),
  };
}
