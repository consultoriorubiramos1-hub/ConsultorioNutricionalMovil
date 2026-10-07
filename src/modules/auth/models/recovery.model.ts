export type RecoveryStep = "username" | "code" | "password" | "success";

export type SendCodeResponse =
  | {
      success: true;
      email: string;
    }
  | {
      success?: false;
      error: string;
    };

export type VerifyCodeResponse =
  | {
      success: true;
      token: string;
    }
  | {
      success: false;
      error: string;
      tipo?: "codigo" | "expirado";
    };

export type VerifyTokenResponse = {
  valid: boolean;
  error?: string;
};

export type ChangePasswordResponse =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };
