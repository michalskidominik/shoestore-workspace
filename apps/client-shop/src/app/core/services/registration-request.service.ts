import { Injectable, signal } from '@angular/core';
import { User } from '@shoestore/shared-models';

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

  /**
   * Convert a RegistrationRequest to a User object
   * This can be used when creating a user account from registration data
   */
  convertToUser(request: RegistrationRequest, userId: number): User {
    return {
      id: userId,
      email: request.email,
      contactName: request.companyName, // Use company name as contact name for B2B
      phone: request.phoneNumber,
      shippingAddress: {
        street: request.deliveryAddress.street,
        city: request.deliveryAddress.city,
        postalCode: request.deliveryAddress.postalCode,
        country: request.deliveryAddress.country
      },
      billingAddress: {
        street: request.deliveryAddress.street,
        city: request.deliveryAddress.city,
        postalCode: request.deliveryAddress.postalCode,
        country: request.deliveryAddress.country
      },
      invoiceInfo: {
        companyName: request.companyName,
        vatNumber: request.vatId
      }
    };
  }
}
