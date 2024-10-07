interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface AuthError {
  errors: FieldError[];
}

interface FieldError {
  name?: string;
  errorMessage: string;
}

export type {
  AuthResponse,
  AuthError,
  FieldError
};