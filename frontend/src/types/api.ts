export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  username: string;
  email: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserInfoResponse {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface UploadMetadata {
  title?: string;
  description?: string;
  tags?: string[];
}