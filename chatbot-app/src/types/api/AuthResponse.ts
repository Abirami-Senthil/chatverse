interface AuthResponse {
    access_token: string;
    token_type: string;
  }

interface AuthError {
    errorMessage: string;
  }

export type {
  AuthResponse,
  AuthError
}