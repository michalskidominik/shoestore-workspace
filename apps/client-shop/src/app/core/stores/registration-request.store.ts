import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject } from '@angular/core';
import { User, AccessRequest } from '@shoestore/shared-models';
import { AuthApiService } from '../services/auth-api.service';

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

interface RegistrationRequestState {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastSubmission: RegistrationRequest | null;
}

const initialState: RegistrationRequestState = {
  loading: false,
  error: null,
  success: false,
  lastSubmission: null
};

export const RegistrationRequestStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const authApiService = inject(AuthApiService);

    return {
      // Submit registration request using rxMethod for proper async handling
      submitRegistrationRequest: rxMethod<RegistrationRequest>(
        pipe(
          tap(() => patchState(store, {
            loading: true,
            error: null,
            success: false
          })),
          switchMap((request) => {
            // Convert RegistrationRequest to AccessRequest format for API
            const accessRequest: AccessRequest = {
              email: request.email,
              companyName: request.companyName,
              vatId: request.vatId,
              phoneNumber: request.phoneNumber,
              deliveryAddress: request.deliveryAddress,
              acceptsTerms: request.acceptsTerms
            };

            return authApiService.requestAccess(accessRequest).pipe(
              tapResponse({
                next: (response) => patchState(store, {
                  loading: false,
                  success: response.success,
                  lastSubmission: request
                }),
                error: (error: Error) => patchState(store, {
                  loading: false,
                  error: error.message || 'Failed to submit registration request',
                  success: false
                })
              })
            );
          })
        )
      ),

      clearState(): void {
        patchState(store, {
          loading: false,
          error: null,
          success: false,
          lastSubmission: null
        });
      },

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
    };
  })
);
