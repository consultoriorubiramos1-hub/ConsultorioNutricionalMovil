export type PerfilTab = "datos" | "cuenta" | "seguridad";

export interface Perfil {
  username: string;
  email: string;
  firstName: string;
  secondName: string | null;
  firstLastname: string;
  secondLastname: string;
  nombreCompleto: string;
  age: number | null;
  gender: string | null;
  phone: string;
  fechaNacimiento: string | null;
  estadoCivil: string | null;
  ocupacion: string | null;
}

export interface DatosPerfilForm {
  firstName: string;
  secondName: string;
  firstLastname: string;
  secondLastname: string;
  fechaNacimiento: string;
  phone: string;
}

export interface CuentaPerfilForm {
  username: string;
  email: string;
}

export const EMPTY_DATOS_FORM: DatosPerfilForm = {
  firstName: "",
  secondName: "",
  firstLastname: "",
  secondLastname: "",
  fechaNacimiento: "",
  phone: "",
};

export const EMPTY_CUENTA_FORM: CuentaPerfilForm = {
  username: "",
  email: "",
};
