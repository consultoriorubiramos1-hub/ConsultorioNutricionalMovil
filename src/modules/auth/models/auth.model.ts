export type AuthUser = {
  id: string;
  username: string;
  email: string;
  rol_id: 2;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginApiSuccess = {
  ok: true;
  data: {
    token: string;
    user: AuthUser;
  };
};

export type LoginApiError = {
  ok: false;
  message: string;
};

export type LoginApiResponse = LoginApiSuccess | LoginApiError;

export type LoginResult =
  | {
      success: true;
      token: string;
      user: AuthUser;
    }
  | {
      success: false;
      message: string;
      status?: number;
    };
