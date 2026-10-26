import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  clearSessionToken,
  getSessionToken,
} from "@/shared/session/session-token";
import type { DashboardData } from "../models/dashboard.model";
import {
  DashboardSessionError,
  obtenerDashboard,
} from "../services/dashboard-service";

export function useDashboardViewModel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const logoutInProgress = useRef(false);

  const cargarDashboard = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError(null);
    try {
      const token = await getSessionToken();
      if (request.signal.aborted) return;
      if (!token)
        throw new DashboardSessionError("No existe una sesión autenticada.");
      const result = await obtenerDashboard(token, request.signal);
      if (!request.signal.aborted) setData(result);
    } catch (cause) {
      if (request.signal.aborted) return;
      if (cause instanceof DashboardSessionError) {
        setData(null);
        try {
          await clearSessionToken();
        } catch {
          if (!request.signal.aborted)
            setError(
              "No fue posible limpiar la sesión expirada. Inténtalo nuevamente.",
            );
          return;
        }
        if (!request.signal.aborted) router.replace("/login");
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : "No fue posible cargar el Dashboard.",
        );
      }
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarDashboard();
      return () => {
        controller.current?.abort();
      };
    }, [cargarDashboard]),
  );

  const navigate = (route: Href) => {
    setMenuOpen(false);
    router.navigate(route);
  };

  const cerrarSesion = async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    setLoggingOut(true);
    controller.current?.abort();
    try {
      await clearSessionToken();
      setData(null);
      setMenuOpen(false);
      router.replace("/login");
    } catch {
      setMenuOpen(false);
      setLoading(false);
      setError("No fue posible cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      logoutInProgress.current = false;
      setLoggingOut(false);
    }
  };
  return {
    data,
    loading,
    error,
    menuOpen,
    loggingOut,
    setMenuOpen,
    navigate,
    cargarDashboard,
    cerrarSesion,
  };
}
