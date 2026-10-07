import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { getSessionToken } from "@/shared/session/session-token";
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
  type ActualizarCuentaPerfilPayload,
  type ActualizarDatosPerfilPayload,
} from "../services/perfil-service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatIsoDateForDisplay(value: string | null): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim();

  // Acepta tanto:
  // 2005-02-08
  // como:
  // 2005-02-08T00:00:00.000Z
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized);

  if (!match) {
    return normalized;
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

function parseDisplayDate(value: string): string | null {
  const normalized = value.trim();

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function toDatosForm(perfil: Perfil): DatosPerfilForm {
  return {
    firstName: perfil.firstName,
    secondName: perfil.secondName ?? "",
    firstLastname: perfil.firstLastname,
    secondLastname: perfil.secondLastname,
    fechaNacimiento: formatIsoDateForDisplay(perfil.fechaNacimiento),
    phone: perfil.phone,
  };
}

function toCuentaForm(perfil: Perfil): CuentaPerfilForm {
  return {
    username: perfil.username,
    email: perfil.email,
  };
}

function validateDatos(form: DatosPerfilForm): string | null {
  if (!form.firstName.trim()) {
    return "El nombre es obligatorio.";
  }

  if (!form.firstLastname.trim()) {
    return "El apellido paterno es obligatorio.";
  }

  if (!form.secondLastname.trim()) {
    return "El apellido materno es obligatorio.";
  }

  if (!parseDisplayDate(form.fechaNacimiento)) {
    return "La fecha de nacimiento debe tener el formato DD/MM/AAAA.";
  }

  const phone = form.phone.trim();

  if (!/^\d{10}$/.test(phone)) {
    return "El teléfono debe contener 10 dígitos.";
  }

  return null;
}

function validateCuenta(form: CuentaPerfilForm): string | null {
  if (!form.username.trim()) {
    return "El nombre de usuario es obligatorio.";
  }

  if (!EMAIL_REGEX.test(form.email.trim())) {
    return "Ingresa un correo electrónico válido.";
  }

  return null;
}

function buildDatosPatch(
  perfil: Perfil,
  form: DatosPerfilForm,
): ActualizarDatosPerfilPayload {
  const payload: ActualizarDatosPerfilPayload = {};

  const isoDate = parseDisplayDate(form.fechaNacimiento);
  const secondName = form.secondName.trim() || null;

  if (form.firstName.trim() !== perfil.firstName) {
    payload.first_name = form.firstName.trim();
  }

  if (secondName !== perfil.secondName) {
    payload.second_name = secondName;
  }

  if (form.firstLastname.trim() !== perfil.firstLastname) {
    payload.first_lastname = form.firstLastname.trim();
  }

  if (form.secondLastname.trim() !== perfil.secondLastname) {
    payload.second_lastname = form.secondLastname.trim();
  }

  const currentBirthDate = perfil.fechaNacimiento
    ? perfil.fechaNacimiento.slice(0, 10)
    : null;

  if (isoDate && isoDate !== currentBirthDate) {
    payload.fecha_nacimiento = isoDate;
  }

  if (form.phone.trim() !== perfil.phone) {
    payload.phone = form.phone.trim();
  }

  return payload;
}

function buildCuentaPatch(
  perfil: Perfil,
  form: CuentaPerfilForm,
): ActualizarCuentaPerfilPayload {
  const payload: ActualizarCuentaPerfilPayload = {};

  if (form.username.trim() !== perfil.username) {
    payload.username = form.username.trim();
  }

  if (form.email.trim() !== perfil.email) {
    payload.email = form.email.trim();
  }

  return payload;
}

export function usePerfilViewModel() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [activeTab, setActiveTab] = useState<PerfilTab | null>(null);

  const [datosForm, setDatosForm] = useState<DatosPerfilForm>(EMPTY_DATOS_FORM);

  const [cuentaForm, setCuentaForm] =
    useState<CuentaPerfilForm>(EMPTY_CUENTA_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return {
    perfil,
    initials,
    activeTab,
    datosForm,
    cuentaForm,
    loading,
    saving,
    error,
    setActiveTab,
    updateDatosField,
    updateCuentaField,
    cargarPerfil,
    guardarDatos,
    guardarCuenta,
  };
}
