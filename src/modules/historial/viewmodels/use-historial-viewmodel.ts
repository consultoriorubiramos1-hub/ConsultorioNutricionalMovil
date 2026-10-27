import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { clearSessionToken, getSessionToken } from "@/shared/session/session-token";
import type { NutritionProgressCard } from "../models/historial.model";
import { getMedicalHistory, HistorialApiError } from "../services/historial-service";
import { descriptiveWeightEvolution, latestNutritionIndicators, nutritionProgressCards } from "../utils/nutrition-measurements";

export function useHistorialViewModel() {
  const [cards, setCards] = useState<NutritionProgressCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const focused = useRef(false);
  const loaded = useRef(false);
  const logoutLock = useRef(false);
  const request = useRef<AbortController | null>(null);

  const refreshHistory = useCallback(async () => {
    if (!focused.current || logoutLock.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () => focused.current && !controller.signal.aborted && request.current === controller;
    setLoading(!loaded.current);
    setRefreshing(loaded.current);
    setError(null);
    try {
      const token = await getSessionToken();
      if (!isCurrent()) return;
      if (!token?.trim()) throw new HistorialApiError("Tu sesión no es válida o ha expirado.", 401);
      const result = await getMedicalHistory(token, controller.signal);
      if (!isCurrent()) return;
      setCards(nutritionProgressCards(result));
      setSessionRequired(false);
      loaded.current = true;
    } catch (cause) {
      if (!isCurrent()) return;
      setError(cause instanceof HistorialApiError
        ? cause.message : "No fue posible consultar tu progreso nutricional. Inténtalo nuevamente.");
      if (cause instanceof HistorialApiError && (cause.status === 401 || cause.status === 403)) {
        setSessionRequired(true);
        setCards([]);
        setMenuOpen(false);
        loaded.current = false;
        void clearSessionToken().catch(() => {
          if (focused.current) setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
        });
      }
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setRefreshing(false);
        request.current = null;
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    setLoggingOut(logoutLock.current);
    void refreshHistory();
    return () => {
      focused.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, [refreshHistory]));

  const navigate = (route: Href) => {
    if (logoutLock.current) return;
    setMenuOpen(false);
    router.navigate(route);
  };
  const logout = async () => {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLoggingOut(true);
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setRefreshing(false);
    try {
      await clearSessionToken();
      if (focused.current) {
        setCards([]);
        setMenuOpen(false);
      }
      router.replace("/login");
    } catch {
      if (focused.current) {
        setMenuOpen(false);
        setError("No fue posible cerrar la sesión. Inténtalo nuevamente.");
      }
    } finally {
      logoutLock.current = false;
      if (focused.current) setLoggingOut(false);
    }
  };

  const measurements = useMemo(() => cards.map((card) => card.measurement), [cards]);
  const indicators = useMemo(() => latestNutritionIndicators(measurements), [measurements]);
  const evolution = useMemo(() => descriptiveWeightEvolution(measurements), [measurements]);

  return {
    cards, indicators, evolution, loading, refreshing, error, sessionRequired,
    menuOpen, setMenuOpen, loggingOut, refreshHistory, navigate, logout,
    goToLogin: () => router.replace("/login"),
  };
}
