import type { Post, PostApiDto, PostImage, PostLikeResult, PostLink, PostMediaApiDto } from "../models/muro.model";
import { positiveId, safeHttpUrl } from "../utils/muro-format";

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function text(value: unknown, preserveWhitespace = false): string | null {
  return typeof value === "string" && value.trim()
    ? preserveWhitespace ? value : value.trim() : null;
}
function number(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function order(value: unknown): number | null {
  const parsed = number(value);
  return parsed !== null && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}
function byOrder(a: PostImage, b: PostImage): number {
  if (a.order === null) return b.order === null ? 0 : 1;
  if (b.order === null) return -1;
  return a.order - b.order;
}
export function postImagesFromApi(value: unknown): PostImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PostImage[] => {
    const dto: PostMediaApiDto | null = record(item);
    const url = safeHttpUrl(dto?.url);
    return dto && url ? [{ id: positiveId(dto.id), url, order: order(dto.order) }] : [];
  }).sort(byOrder);
}
export function postLinksFromApi(value: unknown): PostLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PostLink[] => {
    const dto: PostMediaApiDto | null = record(item);
    const url = safeHttpUrl(dto?.url);
    return dto && url ? [{ id: positiveId(dto.id), url, title: text(dto.title), order: order(dto.order) }] : [];
  }).sort(byOrder);
}
export function postsFromApi(value: unknown): Post[] {
  if (!Array.isArray(value)) throw new Error("La respuesta de publicaciones no es válida.");
  const ids = new Set<number>();
  return value.flatMap((item): Post[] => {
    const dto: PostApiDto | null = record(item);
    const id = positiveId(dto?.id);
    if (!dto || id === null || ids.has(id)) return [];
    ids.add(id);
    const count = number(dto.likes_count);
    return [{
      id, title: text(dto.title), description: text(dto.description, true), content: text(dto.content, true),
      createdAt: text(dto.created_at), images: postImagesFromApi(dto.images), links: postLinksFromApi(dto.links),
      likesCount: count === null ? 0 : Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(count))),
      userHasLiked: dto.user_has_liked === true || (typeof dto.user_has_liked === "string" && dto.user_has_liked.trim().toLowerCase() === "true"),
    }];
  });
}
export function postLikeFromApi(value: unknown): PostLikeResult {
  const raw = record(value);
  if (typeof raw?.liked !== "boolean") throw new Error("La respuesta del like no es válida.");
  return { liked: raw.liked };
}
