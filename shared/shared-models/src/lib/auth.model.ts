import { User, Address } from './user.model';

// Firebase Authentication Related Interfaces

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface VerifyTokenDto {
  idToken: string;
}

export interface UserValidationResponse {
  success: boolean;
  user?: User;
  valid?: boolean;
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}

// Feature-specific interfaces (TODO endpoints)

export interface AccessRequest {
  email: string;
  company: string;
}

export interface AccessRequestResponse {
  success: boolean;
  message?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
}

export interface EmailChangeStepRequest {
  step: 1 | 2 | 3;
  token?: string;
  newEmail?: string;
}

export interface AddressUpdateRequest {
  shippingAddress: Address;
  billingAddress: Address;
}

export interface TokenResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  message?: string;
}

