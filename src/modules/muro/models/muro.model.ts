export const MAX_SEARCH_LENGTH = 100;

export interface PostImage {
  id: number | null;
  url: string;
  order: number | null;
}
export interface PostLink extends PostImage { title: string | null }
export interface Post {
  id: number;
  title: string | null;
  description: string | null;
  content: string | null;
  createdAt: string | null;
  images: PostImage[];
  links: PostLink[];
  likesCount: number;
  userHasLiked: boolean;
}
export interface PostApiDto {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  content?: unknown;
  created_at?: unknown;
  images?: unknown;
  links?: unknown;
  likes_count?: unknown;
  user_has_liked?: unknown;
}
export interface PostMediaApiDto {
  id?: unknown;
  url?: unknown;
  title?: unknown;
  order?: unknown;
}
export interface MuroResponseDto { ok?: unknown; data?: unknown }
export interface PostLikeResult { liked: boolean }
