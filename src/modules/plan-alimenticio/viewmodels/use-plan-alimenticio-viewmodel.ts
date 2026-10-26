import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { clearSessionToken, getSessionToken } from "@/shared/session/session-token";
import { MENU_TYPES, type NutritionPlan, type MenuType } from "../models/plan-alimenticio.model";
import { getActiveNutritionPlan, PlanAlimenticioApiError } from "../services/plan-alimenticio-service";
import { todayMenu } from "../utils/plan-alimenticio-format";

export function usePlanAlimenticioViewModel() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuType | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOfToday, setMenuOfToday] = useState<MenuType | null>(null);
  const focused = useRef(false);
  const loaded = useRef(false);
  const logoutLock = useRef(false);
  const request = useRef<AbortController | null>(null);

  const refreshPlan = useCallback(async () => {
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
      if (!token?.trim()) throw new PlanAlimenticioApiError("Tu sesión no es válida o ha expirado.", 401);
      const result = await getActiveNutritionPlan(token, controller.signal);
      if (!isCurrent()) return;
      setPlan(result);
      setSessionRequired(false);
      const today = result ? todayMenu(result.menus) : null;
      setMenuOfToday(today);
      setSelectedMenu((current) => current && result?.menus[current]
        ? current : today ?? MENU_TYPES.find((key) => result?.menus[key]) ?? null);
      loaded.current = true;
    } catch (cause) {
      if (!isCurrent()) return;
      setError(cause instanceof PlanAlimenticioApiError
        ? cause.message : "No fue posible consultar tu plan alimenticio. Inténtalo nuevamente.");
      if (cause instanceof PlanAlimenticioApiError && (cause.status === 401 || cause.status === 403)) {
        setSessionRequired(true);
        setPlan(null);
        setSelectedMenu(null);
        setMenuOfToday(null);
        setMenuOpen(false);
        loaded.current = false;
        await clearSessionToken().catch(() => {
          if (isCurrent()) setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
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
    void refreshPlan();
    return () => {
      focused.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, [refreshPlan]));

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
        setPlan(null);
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

  return {
    plan, loading, refreshing, error, sessionRequired, menuOpen, loggingOut,
    selectedMenu, menuOfToday, setMenuOpen, refreshPlan, navigate, logout,
    selectMenu: (menu: MenuType) => {
      if (!logoutLock.current && !sessionRequired && plan?.menus[menu]) setSelectedMenu(menu);
    },
    goToLogin: () => router.replace("/login"),
  };
}
