import { Injectable, signal } from '@angular/core';

export interface RegistrationRequest {
  email: string;
  companyName: string;
  vatId: string;
  phoneNumber: string;
  deliveryAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  acceptsTerms: boolean;
}

export interface RegistrationRequestState {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastSubmission: RegistrationRequest | null;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationRequestService {
  private readonly _state = signal<RegistrationRequestState>({
    loading: false,
    error: null,
    success: false,
    lastSubmission: null
  });

  // Public readonly state
  readonly state = this._state.asReadonly();
  readonly loading = () => this._state().loading;
  readonly error = () => this._state().error;
  readonly success = () => this._state().success;
  readonly lastSubmission = () => this._state().lastSubmission;

  async submitRegistrationRequest(request: RegistrationRequest): Promise<{ success: boolean; message: string }> {
    this._state.update(state => ({
      ...state,
      loading: true,
      error: null,
      success: false
    }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful submission - in real app, this would call the backend
      this._state.update(state => ({
        ...state,
        loading: false,
        success: true,
        lastSubmission: request
      }));

      return {
        success: true,
        message: 'Your registration request has been submitted successfully. Our team will review it and contact you soon.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit registration request';
      
      this._state.update(state => ({
        ...state,
        loading: false,
        error: errorMessage,
        success: false
      }));

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  clearState(): void {
    this._state.set({
      loading: false,
      error: null,
      success: false,
      lastSubmission: null
    });
  }
}