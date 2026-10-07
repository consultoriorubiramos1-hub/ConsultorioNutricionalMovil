import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { clearSessionToken, getSessionToken } from "@/shared/session/session-token";
import type { HistorialTab, InitialSectionKey, MedicalHistory } from "../models/historial.model";
import { getMedicalHistory, HistorialApiError } from "../services/historial-service";
import { initialSections, progressIndicators, weightChange } from "../utils/historial-presentation";

function toggleSet<T>(current: Set<T>, key: T): Set<T> {
  const next = new Set(current);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function useHistorialViewModel() {
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [activeTab, setActiveTab] = useState<HistorialTab>("initial");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedInitialSections, setExpandedInitialSections] = useState<Set<InitialSectionKey>>(() => new Set());
  const [expandedEvaluationIds, setExpandedEvaluationIds] = useState<Set<string>>(() => new Set());
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
      setHistory(result);
      setSessionRequired(false);
      // Preserve expanded records only when they have an unambiguous server ID.
      // Index-based fallback keys can refer to a different row after refresh.
      const keys = new Set(result.followUpEvaluations
        .filter((evaluation) => evaluation.key.startsWith('["id",'))
        .map((evaluation) => evaluation.key));
      setExpandedEvaluationIds((current) => new Set([...current].filter((key) => keys.has(key))));
      const initialKeys = new Set(result.initialEvaluation ? initialSections(result.initialEvaluation).map((section) => section.key) : []);
      setExpandedInitialSections((current) => new Set([...current].filter((key) => initialKeys.has(key))));
      loaded.current = true;
    } catch (cause) {
      if (!isCurrent()) return;
      setError(cause instanceof HistorialApiError
        ? cause.message : "No fue posible consultar tu historial médico. Inténtalo nuevamente.");
      if (cause instanceof HistorialApiError && (cause.status === 401 || cause.status === 403)) {
        setSessionRequired(true);
        setHistory(null);
        setMenuOpen(false);
        setExpandedInitialSections(new Set());
        setExpandedEvaluationIds(new Set());
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
        setHistory(null);
        setExpandedInitialSections(new Set());
        setExpandedEvaluationIds(new Set());
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

  const sections = useMemo(() => history?.initialEvaluation ? initialSections(history.initialEvaluation) : [], [history]);
  const indicators = useMemo(() => progressIndicators(history?.followUpEvaluations ?? []), [history]);
  const weightDifference = useMemo(() => weightChange(history?.followUpEvaluations ?? []), [history]);

  return {
    history, loading, refreshing, error, sessionRequired, activeTab,
    menuOpen, setMenuOpen, loggingOut, expandedInitialSections, expandedEvaluationIds,
    sections, indicators, weightDifference, refreshHistory, navigate, logout,
    changeTab: (tab: HistorialTab) => {
      if (!logoutLock.current && !sessionRequired) setActiveTab(tab);
    },
    toggleInitialSection: (key: InitialSectionKey) => {
      if (!logoutLock.current && !sessionRequired) setExpandedInitialSections((current) => toggleSet(current, key));
    },
    toggleEvaluation: (key: string) => {
      if (!logoutLock.current && !sessionRequired) setExpandedEvaluationIds((current) => toggleSet(current, key));
    },
    goToLogin: () => router.replace("/login"),
  };
}
