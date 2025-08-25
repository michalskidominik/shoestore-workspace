import { User } from '@shoestore/shared-models';

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface TokenResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface UserValidationResponse {
  success: boolean;
  user?: User;
  valid?: boolean;
  message?: string;
}
