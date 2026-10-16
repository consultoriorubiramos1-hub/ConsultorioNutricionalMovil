import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  clearSessionToken,
  getSessionToken,
} from "@/shared/session/session-token";
import {
  EMPTY_CUENTA_FORM,
  EMPTY_DATOS_FORM,
  type CuentaPerfilForm,
  type DatosPerfilForm,
  type Perfil,
  type PerfilTab,
} from "../models/perfil.model";
import {
  actualizarCuentaPerfil,
  actualizarDatosPerfil,
  obtenerPerfil,
} from "../services/perfil-service";

import { buildCuentaPatch, buildDatosPatch, toCuentaForm, toDatosForm, validateCuenta, validateDatos } from "../utils/perfil-form";

export function usePerfilViewModel() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [activeTab, setActiveTab] = useState<PerfilTab | null>("datos");

  const [datosForm, setDatosForm] = useState<DatosPerfilForm>(EMPTY_DATOS_FORM);

  const [cuentaForm, setCuentaForm] =
    useState<CuentaPerfilForm>(EMPTY_CUENTA_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutInProgress = useRef(false);

  const hydrateForms = useCallback((value: Perfil) => {
    setDatosForm(toDatosForm(value));
    setCuentaForm(toCuentaForm(value));
  }, []);

  const cargarPerfil = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getSessionToken();

      if (!token) {
        throw new Error("La sesión no está disponible.");
      }

      const data = await obtenerPerfil(token);

      setPerfil(data);
      hydrateForms(data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error al cargar el perfil.",
      );
    } finally {
      setLoading(false);
    }
  }, [hydrateForms]);

  useFocusEffect(
    useCallback(() => {
      void cargarPerfil();
    }, [cargarPerfil]),
  );

  const updateDatosField = useCallback(
    <K extends keyof DatosPerfilForm>(field: K, value: DatosPerfilForm[K]) => {
      setDatosForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const updateCuentaField = useCallback(
    <K extends keyof CuentaPerfilForm>(
      field: K,
      value: CuentaPerfilForm[K],
    ) => {
      setCuentaForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const guardarDatos = useCallback(async (): Promise<"saved" | "unchanged"> => {
    if (!perfil) {
      throw new Error("El perfil aún no está disponible.");
    }

    const validationError = validateDatos(datosForm);

    if (validationError) {
      throw new Error(validationError);
    }

    const payload = buildDatosPatch(perfil, datosForm);

    if (Object.keys(payload).length === 0) {
      return "unchanged";
    }

    try {
      setSaving(true);
      setError(null);

      const token = await getSessionToken();

      if (!token) {
        throw new Error("La sesión no está disponible.");
      }

      await actualizarDatosPerfil(token, payload);

      const refreshed = await obtenerPerfil(token);

      setPerfil(refreshed);
      hydrateForms(refreshed);

      return "saved";
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "No fue posible guardar los datos.";

      setError(message);

      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [datosForm, hydrateForms, perfil]);

  const guardarCuenta = useCallback(async (): Promise<
    "saved" | "unchanged"
  > => {
    if (!perfil) {
      throw new Error("El perfil aún no está disponible.");
    }

    const validationError = validateCuenta(cuentaForm);

    if (validationError) {
      throw new Error(validationError);
    }

    const payload = buildCuentaPatch(perfil, cuentaForm);

    if (Object.keys(payload).length === 0) {
      return "unchanged";
    }

    try {
      setSaving(true);
      setError(null);

      const token = await getSessionToken();

      if (!token) {
        throw new Error("La sesión no está disponible.");
      }

      await actualizarCuentaPerfil(token, payload);

      const refreshed = await obtenerPerfil(token);

      setPerfil(refreshed);
      hydrateForms(refreshed);

      return "saved";
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "No fue posible guardar la cuenta.";

      setError(message);

      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [cuentaForm, hydrateForms, perfil]);

  const initials = useMemo(() => {
    if (!perfil) {
      return "—";
    }

    const first = perfil.firstName.trim().charAt(0);
    const last = perfil.firstLastname.trim().charAt(0);

    return `${first}${last}`.toUpperCase() || "—";
  }, [perfil]);

  const navigate = (route: Href) => {
    if (saving || logoutInProgress.current) return;
    setMenuOpen(false);
    if (route !== "/perfil") router.navigate(route);
  };

  const cerrarSesion = async () => {
    if (saving || logoutInProgress.current) return;
    logoutInProgress.current = true;
    setLoggingOut(true);
    try {
      await clearSessionToken();
      setPerfil(null);
      setMenuOpen(false);
      router.replace("/login");
    } catch {
      setMenuOpen(false);
      setError("No fue posible cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      logoutInProgress.current = false;
      setLoggingOut(false);
    }
  };

  return {
    perfil,
    initials,
    activeTab,
    datosForm,
    cuentaForm,
    loading,
    saving,
    error,
    menuOpen,
    loggingOut,
    setMenuOpen,
    navigate,
    cerrarSesion,
    setActiveTab,
    updateDatosField,
    updateCuentaField,
    cargarPerfil,
    guardarDatos,
    guardarCuenta,
  };
}
