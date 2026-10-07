import type { Perfil } from "../models/perfil.model";

export interface PerfilApiDto {
  username?: string | null;
  email?: string | null;
  first_name?: string | null;
  second_name?: string | null;
  first_lastname?: string | null;
  second_lastname?: string | null;
  nombre_completo?: string | null;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  fecha_nacimiento?: string | null;
  estado_civil?: string | null;
  ocupacion?: string | null;
}

export interface PerfilApiResponse {
  ok: boolean;
  data?: PerfilApiDto | null;
  message?: string;
  error?: string;
}

export function perfilFromApi(data: PerfilApiDto): Perfil {
  const firstName = data.first_name?.trim() ?? "";
  const secondName = data.second_name?.trim() || null;
  const firstLastname = data.first_lastname?.trim() ?? "";
  const secondLastname = data.second_lastname?.trim() ?? "";

  const fallbackFullName = [
    firstName,
    secondName,
    firstLastname,
    secondLastname,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    username: data.username?.trim() ?? "",
    email: data.email?.trim() ?? "",
    firstName,
    secondName,
    firstLastname,
    secondLastname,
    nombreCompleto: data.nombre_completo?.trim() || fallbackFullName,
    age: typeof data.age === "number" ? data.age : null,
    gender: data.gender?.trim() || null,
    phone: data.phone?.trim() ?? "",
    fechaNacimiento: data.fecha_nacimiento?.trim() || null,
    estadoCivil: data.estado_civil?.trim() || null,
    ocupacion: data.ocupacion?.trim() || null,
  };
}
