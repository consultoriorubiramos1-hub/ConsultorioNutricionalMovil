import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { clearSessionToken, getSessionToken } from "@/shared/session/session-token";
import { MAX_SEARCH_LENGTH, type Post } from "../models/muro.model";
import { openExternalLink } from "../services/external-link-service";
import { getPosts, MuroApiError, togglePostLike } from "../services/muro-service";
import { applyConfirmedLike } from "../utils/muro-like";

export function useMuroViewModel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [likingPostIds, setLikingPostIds] = useState<Set<number>>(() => new Set());
  const [postErrors, setPostErrors] = useState<Record<number, string>>({});
  const focused = useRef(false);
  const generation = useRef(0);
  const loaded = useRef(false);
  const logoutLock = useRef(false);
  const invalidSession = useRef(false);
  const postsRef = useRef<Post[]>([]);
  const searchRef = useRef("");
  const listRequest = useRef<AbortController | null>(null);
  const likeRequests = useRef(new Map<number, number>());
  const openingLinks = useRef(new Set<string>());
  const reloadAfterLikes = useRef(false);

  const expireSession = useCallback(() => {
    if (!focused.current) return;
    invalidSession.current = true;
    listRequest.current?.abort();
    listRequest.current = null;
    postsRef.current = [];
    loaded.current = false;
    setPosts([]);
    setLoading(false);
    setRefreshing(false);
    setSessionRequired(true);
    setMenuOpen(false);
    setPostErrors({});
    setError("Tu sesión no es válida o ha expirado.");
    void clearSessionToken().catch(() => {
      if (focused.current && invalidSession.current) setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
    });
  }, []);

  const loadPosts = useCallback(async (query: string) => {
    if (!focused.current || logoutLock.current || invalidSession.current) return;
    // Serialize GET against pending POSTs so an older list cannot overwrite a confirmed like.
    if (likeRequests.current.size > 0) { reloadAfterLikes.current = true; return; }
    reloadAfterLikes.current = false;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    const isCurrent = () => focused.current && !controller.signal.aborted && listRequest.current === controller;
    setLoading(!loaded.current);
    setRefreshing(loaded.current);
    setError(null);
    try {
      const token = await getSessionToken();
      if (!isCurrent()) return;
      if (!token?.trim()) throw new MuroApiError("Tu sesión no es válida o ha expirado.", 401);
      const result = await getPosts(token, query, controller.signal);
      if (!isCurrent()) return;
      postsRef.current = result;
      setPosts(result);
      setSessionRequired(false);
      loaded.current = true;
    } catch (cause) {
      if (!isCurrent()) return;
      if (cause instanceof MuroApiError && (cause.status === 401 || cause.status === 403)) expireSession();
      else setError(cause instanceof MuroApiError ? cause.message : "No se pudieron consultar las publicaciones. Inténtalo nuevamente.");
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setRefreshing(false);
        listRequest.current = null;
      }
    }
  }, [expireSession]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    generation.current += 1;
    invalidSession.current = false;
    setLoggingOut(logoutLock.current);
    setLikingPostIds(new Set(likeRequests.current.keys()));
    void loadPosts(searchRef.current);
    return () => {
      focused.current = false;
      generation.current += 1;
      listRequest.current?.abort();
      listRequest.current = null;
      // A toggle POST is not idempotent. Let it finish, then refetch on return;
      // cancelling/retrying a possibly committed POST could toggle the like twice.
      if (likeRequests.current.size > 0) reloadAfterLikes.current = true;
    };
  }, [loadPosts]));

  const toggleLike = async (postId: number) => {
    if (!focused.current || logoutLock.current || invalidSession.current || listRequest.current || likeRequests.current.has(postId)) return;
    if (!postsRef.current.some((post) => post.id === postId)) return;
    const epoch = generation.current;
    likeRequests.current.set(postId, epoch);
    setLikingPostIds(new Set(likeRequests.current.keys()));
    setPostErrors((current) => { const next = { ...current }; delete next[postId]; return next; });
    const canApply = () => focused.current && generation.current === epoch && !invalidSession.current && !logoutLock.current;
    try {
      const token = await getSessionToken();
      if (!canApply()) return;
      if (!token?.trim()) throw new MuroApiError("Tu sesión no es válida o ha expirado.", 401);
      const result = await togglePostLike(token, postId);
      if (!canApply()) return;
      const next = postsRef.current.map((post) => post.id === postId ? applyConfirmedLike(post, result.liked) : post);
      postsRef.current = next;
      setPosts(next);
    } catch (cause) {
      reloadAfterLikes.current = true;
      if (!canApply()) return;
      if (cause instanceof MuroApiError && (cause.status === 401 || cause.status === 403)) expireSession();
      else setPostErrors((current) => ({
        ...current,
        [postId]: cause instanceof MuroApiError ? cause.message : "No se pudo procesar el like. Inténtalo nuevamente.",
      }));
    } finally {
      likeRequests.current.delete(postId);
      if (focused.current) {
        setLikingPostIds(new Set(likeRequests.current.keys()));
        if (reloadAfterLikes.current && likeRequests.current.size === 0 && !invalidSession.current && !logoutLock.current) {
          reloadAfterLikes.current = false;
          void loadPosts(searchRef.current);
        }
      }
    }
  };

  const applySearch = (query: string) => {
    if (!focused.current || logoutLock.current || invalidSession.current || likeRequests.current.size > 0) return;
    const trimmed = query.trim();
    if (trimmed.length > MAX_SEARCH_LENGTH) { setError("La búsqueda no puede superar 100 caracteres."); return; }
    if (searchRef.current !== trimmed) {
      postsRef.current = [];
      loaded.current = false;
      setPosts([]);
    }
    searchRef.current = trimmed;
    setActiveSearch(trimmed);
    setSearchInput(trimmed);
    setPostErrors({});
    void loadPosts(trimmed);
  };

  const openLink = async (postId: number, url: string) => {
    if (!focused.current || logoutLock.current || invalidSession.current || openingLinks.current.has(url)) return;
    const epoch = generation.current;
    openingLinks.current.add(url);
    try { await openExternalLink(url); }
    catch {
      if (focused.current && generation.current === epoch) setPostErrors((current) => ({ ...current, [postId]: "No se pudo abrir el enlace. Inténtalo nuevamente." }));
    } finally { openingLinks.current.delete(url); }
  };

  const navigate = (route: Href) => {
    if (logoutLock.current) return;
    setMenuOpen(false);
    router.navigate(route);
  };
  const logout = async () => {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLoggingOut(true);
    listRequest.current?.abort();
    listRequest.current = null;
    setLoading(false);
    setRefreshing(false);
    try {
      await clearSessionToken();
      postsRef.current = [];
      if (focused.current) { setPosts([]); setMenuOpen(false); }
      router.replace("/login");
    } catch {
      if (focused.current) { setMenuOpen(false); setError("No fue posible cerrar la sesión. Inténtalo nuevamente."); }
    } finally {
      logoutLock.current = false;
      if (focused.current) setLoggingOut(false);
    }
  };

  return {
    posts, loading, refreshing, error, sessionRequired, searchInput, activeSearch,
    menuOpen, setMenuOpen, loggingOut, likingPostIds, postErrors,
    searchBusy: loading || refreshing || loggingOut || likingPostIds.size > 0,
    updateSearchInput: (value: string) => { if (!logoutLock.current) setSearchInput(value.slice(0, MAX_SEARCH_LENGTH)); },
    search: () => applySearch(searchInput),
    clearSearch: () => applySearch(""),
    refreshPosts: () => loadPosts(searchRef.current),
    toggleLike, openLink, navigate, logout,
    goToLogin: () => router.replace("/login"),
  };
}
