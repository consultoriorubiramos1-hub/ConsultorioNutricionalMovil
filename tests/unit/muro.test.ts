import { postsFromApi, postLikeFromApi } from "@/modules/muro/adapters/muro-adapter";
import { applyConfirmedLike } from "@/modules/muro/utils/muro-like";

describe("Muro informativo", () => {
  test("acepta respuesta vacía, omite filas inválidas y deduplica identificadores", () => {
    expect(postsFromApi([])).toEqual([]);
    expect(postsFromApi([null, {}, { id: 1 }, { id: "1" }])).toHaveLength(1);
    expect(() => postsFromApi(null)).toThrow();
  });
  test("normaliza campos y filtra enlaces inseguros", () => {
    const [post] = postsFromApi([{ id: "7", title: null, likes_count: "3", user_has_liked: "true", content: " Texto\nLiteral ", links: [{ url: "javascript:alert(1)" }, { url: "https://example.test/info" }] }]);
    expect(post).toMatchObject({ id: 7, title: null, likesCount: 3, userHasLiked: true, content: " Texto\nLiteral " });
    expect(post.links).toHaveLength(1);
  });
  test("el like confirmado se aplica una sola vez y nunca produce conteos negativos", () => {
    const [post] = postsFromApi([{ id: 1, likes_count: 0 }]);
    const liked = applyConfirmedLike(post, true);
    expect(liked.likesCount).toBe(1);
    expect(applyConfirmedLike(liked, true)).toBe(liked);
    expect(applyConfirmedLike({ ...liked, likesCount: 0 }, false).likesCount).toBe(0);
    expect(post.likesCount).toBe(0);
    expect(() => postLikeFromApi({ liked: "true" })).toThrow();
  });
});
