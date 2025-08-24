import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { of, delay } from 'rxjs';

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
  withMethods((store) => ({
    // Submit registration request using rxMethod for proper async handling
    submitRegistrationRequest: rxMethod<RegistrationRequest>(
      pipe(
        tap(() => patchState(store, {
          loading: true,
          error: null,
          success: false
        })),
        switchMap((request) => 
          // Mock API call - replace with real HTTP service call
          of({
            success: true,
            message: 'Your registration request has been submitted successfully. Our team will review it and contact you soon.'
          }).pipe(
            delay(1500), // Simulate network delay
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
          )
        )
      )
    ),

    clearState(): void {
      patchState(store, {
        loading: false,
        error: null,
        success: false,
        lastSubmission: null
      });
    }
  }))
);