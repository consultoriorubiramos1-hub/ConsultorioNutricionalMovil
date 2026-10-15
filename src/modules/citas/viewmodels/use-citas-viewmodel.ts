import { router, useFocusEffect, type Href } from "expo-router";
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  clearSessionToken,
  getSessionToken,
} from "@/shared/session/session-token";
import { validateReceipt } from "../adapters/receipt-adapter";
import { BANK_TRANSFER_DETAILS } from "../config/bank-transfer";
import {
  MAX_NOTES_LENGTH,
  type Appointment,
  type AppointmentConfirmation,
  type Availability,
  type CitasTab,
  type Receipt,
} from "../models/citas.model";
import {
  cancelAppointment,
  CitasApiError,
  createAppointment,
  getAppointments,
  getAvailability,
  rescheduleAppointment,
} from "../services/citas-service";
import { selectReceipt } from "../services/receipt-service";
import {
  canModifyAppointment,
  isBookableDate,
  isFutureSlot,
} from "../utils/citas-date";

type Mutation = "create" | "cancel" | "reschedule" | "logout" | null;

async function requireToken(): Promise<string> {
  const token = await getSessionToken();
  if (!token)
    throw new CitasApiError("Inicia sesión para gestionar tus citas.", 401);
  return token;
}

export function useCitasViewModel() {
  const [tab, setTab] = useState<CitasTab>("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [sessionRequired, setSessionRequired] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<Availability>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [selectingReceipt, setSelectingReceipt] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [confirmation, setConfirmation] =
    useState<AppointmentConfirmation | null>(null);
  const [mutation, setMutation] = useState<Mutation>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const mutationLock = useRef<Mutation>(null);
  const pickerLock = useRef(false);
  const focused = useRef(false);
  const loaded = useRef(false);
  const dateRef = useRef("");
  const listRequest = useRef<AbortController | null>(null);
  const availabilityRequest = useRef<AbortController | null>(null);

  const reportError = useCallback(
    (cause: unknown, setter: Dispatch<SetStateAction<string | null>>) => {
      if (!focused.current) return;
      setter(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un problema. Inténtalo nuevamente.",
      );
      if (
        cause instanceof CitasApiError &&
        (cause.status === 401 || cause.status === 403)
      ) {
        setSessionRequired(true);
        setAppointments([]);
        setMenuOpen(false);
        setConfirmation(null);
        void clearSessionToken().catch(() => {
          if (focused.current)
            setter("Tu sesión no está disponible. Inicia sesión nuevamente.");
        });
      }
    },
    [],
  );

  const refreshAppointments = useCallback(async () => {
    if (!focused.current) return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(!loaded.current);
    setRefreshing(loaded.current);
    setListError(null);
    try {
      const token = await requireToken();
      if (controller.signal.aborted) return;
      const result = await getAppointments(token, controller.signal);
      if (!controller.signal.aborted && focused.current) {
        setAppointments(result);
        setSessionRequired(false);
        loaded.current = true;
      }
    } catch (cause) {
      if (!controller.signal.aborted) reportError(cause, setListError);
    } finally {
      if (!controller.signal.aborted && focused.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [reportError]);

  const loadAvailability = useCallback(
    async (date: string) => {
      availabilityRequest.current?.abort();
      setAvailability([]);
      setSelectedTime("");
      setAvailabilityError(null);
      if (!isBookableDate(date)) {
        setAvailabilityLoading(false);
        if (date)
          setAvailabilityError(
            "Selecciona una fecha válida que no esté en el pasado.",
          );
        return;
      }
      const controller = new AbortController();
      availabilityRequest.current = controller;
      setAvailabilityLoading(true);
      try {
        const token = await requireToken();
        if (controller.signal.aborted) return;
        const slots = await getAvailability(token, date, controller.signal);
        if (!controller.signal.aborted && focused.current)
          setAvailability(slots);
      } catch (cause) {
        if (!controller.signal.aborted)
          reportError(cause, setAvailabilityError);
      } finally {
        if (!controller.signal.aborted && focused.current)
          setAvailabilityLoading(false);
      }
    },
    [reportError],
  );

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void refreshAppointments();
      if (dateRef.current) void loadAvailability(dateRef.current);
      return () => {
        focused.current = false;
        listRequest.current?.abort();
        availabilityRequest.current?.abort();
      };
    }, [loadAvailability, refreshAppointments]),
  );

  const resetForm = () => {
    availabilityRequest.current?.abort();
    dateRef.current = "";
    setSelectedDate("");
    setSelectedTime("");
    setAvailability([]);
    setAvailabilityLoading(false);
    setAvailabilityError(null);
    setFormError(null);
    setNotes("");
    setReceipt(null);
    setRescheduling(null);
  };

  const changeTab = (value: CitasTab) => {
    if (mutationLock.current || pickerLock.current) return;
    if (rescheduling) resetForm();
    setTab(value);
  };

  const selectDate = (value: string) => {
    if (mutationLock.current || pickerLock.current || sessionRequired) return;
    dateRef.current = value;
    setSelectedDate(value);
    setFormError(null);
    void loadAvailability(value);
  };

  const selectTime = (value: string) => {
    if (
      mutationLock.current ||
      availabilityLoading ||
      sessionRequired ||
      !availability.includes(value)
    )
      return;
    if (!isFutureSlot(selectedDate, value)) {
      setFormError(
        "Este horario ya no está disponible. Selecciona otro horario.",
      );
      void loadAvailability(selectedDate);
      return;
    }
    setSelectedTime(value);
    setFormError(null);
  };

  const pickReceipt = async () => {
    if (mutationLock.current || pickerLock.current || sessionRequired) return;
    pickerLock.current = true;
    setSelectingReceipt(true);
    setFormError(null);
    try {
      const selected = await selectReceipt();
      if (selected && focused.current) setReceipt(selected);
    } catch (cause) {
      reportError(cause, setFormError);
    } finally {
      pickerLock.current = false;
      setSelectingReceipt(false);
    }
  };

  const validateSchedule = (): string | null => {
    if (!isBookableDate(selectedDate))
      return "Selecciona una fecha válida que no esté en el pasado.";
    if (
      availabilityLoading ||
      !selectedTime ||
      !availability.includes(selectedTime) ||
      !isFutureSlot(selectedDate, selectedTime)
    )
      return "Selecciona un horario disponible.";
    return null;
  };

  const submitAppointment = async () => {
    if (mutationLock.current || pickerLock.current || sessionRequired) return;
    const validation = validateSchedule();
    if (validation) {
      setFormError(validation);
      return;
    }
    if (!receipt) {
      setFormError("Selecciona el comprobante del anticipo.");
      return;
    }
    try {
      validateReceipt(receipt);
    } catch (cause) {
      reportError(cause, setFormError);
      return;
    }
    if (notes.length > MAX_NOTES_LENGTH) {
      setFormError("Las notas no pueden superar 500 caracteres.");
      return;
    }
    mutationLock.current = "create";
    setMutation("create");
    setFormError(null);
    setNotice(null);
    try {
      const token = await requireToken();
      const result = await createAppointment(token, {
        appointmentDate: selectedDate,
        startTime: selectedTime,
        notes,
        receipt,
      });
      resetForm();
      setTab("upcoming");
      setNotice(result.message);
      await refreshAppointments();
    } catch (cause) {
      reportError(cause, setFormError);
      if (
        cause instanceof CitasApiError &&
        (cause.status === 400 || cause.status === 409)
      )
        await loadAvailability(selectedDate);
    } finally {
      mutationLock.current = null;
      setMutation(null);
    }
  };

  const startReschedule = (appointment: Appointment) => {
    if (
      mutationLock.current ||
      sessionRequired ||
      !canModifyAppointment(appointment)
    )
      return;
    resetForm();
    setRescheduling(appointment);
    setTab("upcoming");
    setNotice(null);
  };

  const requestReschedule = () => {
    if (mutationLock.current || !rescheduling || sessionRequired) return;
    const validation = validateSchedule();
    if (validation) {
      setFormError(validation);
      return;
    }
    setConfirmation({
      kind: "reschedule",
      appointment: rescheduling,
      input: { date: selectedDate, startTime: selectedTime },
    });
  };

  const requestCancel = (appointment: Appointment) => {
    if (
      mutationLock.current ||
      sessionRequired ||
      !canModifyAppointment(appointment)
    )
      return;
    setListError(null);
    setConfirmation({ kind: "cancel", appointment });
  };

  const confirmAction = async () => {
    if (mutationLock.current || !confirmation || sessionRequired) return;
    const action = confirmation;
    if (!canModifyAppointment(action.appointment)) {
      setConfirmation(null);
      (action.kind === "cancel" ? setListError : setFormError)(
        "Esta cita ya no se puede modificar. Actualiza tus citas.",
      );
      return;
    }
    if (
      action.kind === "reschedule" &&
      (!availability.includes(action.input.startTime) ||
        !isFutureSlot(action.input.date, action.input.startTime))
    ) {
      setConfirmation(null);
      setFormError("Selecciona nuevamente un horario disponible.");
      void loadAvailability(selectedDate);
      return;
    }
    mutationLock.current = action.kind;
    setMutation(action.kind);
    setNotice(null);
    try {
      const token = await requireToken();
      if (action.kind === "cancel") {
        await cancelAppointment(token, action.appointment.id);
        setAppointments((current) =>
          current.filter(
            (appointment) => appointment.id !== action.appointment.id,
          ),
        );
        setNotice("Tu cita se canceló correctamente.");
      } else {
        await rescheduleAppointment(token, action.appointment.id, action.input);
        resetForm();
        setNotice("Tu cita se reprogramó correctamente.");
      }
      setConfirmation(null);
      setTab("upcoming");
      await refreshAppointments();
    } catch (cause) {
      setConfirmation(null);
      reportError(
        cause,
        action.kind === "cancel" ? setListError : setFormError,
      );
      if (
        action.kind === "reschedule" &&
        cause instanceof CitasApiError &&
        (cause.status === 400 || cause.status === 409)
      )
        await loadAvailability(action.input.date);
    } finally {
      mutationLock.current = null;
      setMutation(null);
    }
  };

  const navigate = (route: Href) => {
    if (mutationLock.current || pickerLock.current) return;
    setMenuOpen(false);
    router.navigate(route);
  };

  const logout = async () => {
    if (mutationLock.current || pickerLock.current) return;
    mutationLock.current = "logout";
    setMutation("logout");
    try {
      await clearSessionToken();
      listRequest.current?.abort();
      availabilityRequest.current?.abort();
      setMenuOpen(false);
      router.replace("/login");
    } catch {
      setMenuOpen(false);
      setListError("No fue posible cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      mutationLock.current = null;
      setMutation(null);
    }
  };

  return {
    bankTransferDetails: BANK_TRANSFER_DETAILS,
    tab,
    appointments,
    loading,
    refreshing,
    listError,
    formError,
    availabilityError,
    sessionRequired,
    notice,
    selectedDate,
    selectedTime,
    availability,
    availabilityLoading,
    notes,
    receipt,
    selectingReceipt,
    rescheduling,
    confirmation,
    mutation,
    menuOpen,
    setMenuOpen,
    busy: mutation !== null || selectingReceipt,
    changeTab,
    selectDate,
    selectTime,
    refreshAppointments,
    loadAvailability,
    pickReceipt,
    updateNotes: (value: string) => {
      if (!mutationLock.current) setNotes(value.slice(0, MAX_NOTES_LENGTH));
    },
    removeReceipt: () => {
      if (!mutationLock.current && !pickerLock.current) setReceipt(null);
    },
    cancelReschedule: () => {
      if (!mutationLock.current) resetForm();
    },
    closeConfirmation: () => {
      if (!mutationLock.current) setConfirmation(null);
    },
    submitAppointment,
    startReschedule,
    requestReschedule,
    requestCancel,
    confirmAction,
    navigate,
    logout,
    goToLogin: () => router.replace("/login"),
  };
}
