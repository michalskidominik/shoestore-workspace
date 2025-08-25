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
  companyName: string;
  vatId: string;
  phoneNumber: string;
  deliveryAddress: Address;
  acceptsTerms: boolean;
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

// Registration Request Management
export interface RegistrationRequestDocument {
  id: string;
  email: string;
  companyName: string;
  vatId: string;
  phoneNumber: string;
  deliveryAddress: Address;
  acceptsTerms: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin user ID
  rejectionReason?: string;
  notes?: string;
}

export interface RegistrationRequestCreateDto {
  email: string;
  companyName: string;
  vatId: string;
  phoneNumber: string;
  deliveryAddress: Address;
  acceptsTerms: boolean;
}

export interface RegistrationRequestUpdateDto {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  notes?: string;
  reviewedBy: string;
}

export interface UserCredentials {
  email: string;
  temporaryPassword: string;
}

