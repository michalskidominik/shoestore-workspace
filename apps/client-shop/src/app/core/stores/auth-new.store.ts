import { withMethods, withState, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject } from '@angular/core';
import { createBaseAuthStore } from '@shoestore/shared-auth';
import { AuthApiService } from '../services/auth-api.service';
import {
  User,
  Address,
  LoginCredentials,
  PasswordChangeRequest,
  AddressUpdateRequest
} from '@shoestore/shared-models';
import { ToastStore } from '../../shared/stores/toast.store';
import { environment } from '../../../environments/environment';

// Re-export types for components
export type { User, LoginCredentials, Address, PasswordChangeRequest, AddressUpdateRequest };

// Additional state for client-shop specific features
interface ClientAuthState {
  addressUpdateLoading: boolean;
  passwordChangeLoading: boolean;
  emailChangeLoading: boolean;
}

const clientInitialState: ClientAuthState = {
  addressUpdateLoading: false,
  passwordChangeLoading: false,
  emailChangeLoading: false
};

// Create the base auth store with client-shop specific configuration
const BaseClientAuthStore = createBaseAuthStore({
  loginSuccessRoute: '/dashboard',
  logoutRoute: '/',
  sessionConfig: {
    storageKey: 'authSession',
    sessionHours: environment.authSessionHours ?? 8
  }
});

// Extend with client-shop specific features for profile management
export const AuthStore = BaseClientAuthStore.extend(
  withState(clientInitialState),
  withMethods((store) => {
    const authApiService = inject(AuthApiService);
    const toastStore = inject(ToastStore);

    return {
      // Update user address
      updateAddress: rxMethod<AddressUpdateRequest>(
        pipe(
          tap(() => patchState(store, { addressUpdateLoading: true, error: null })),
          switchMap((addressUpdate) => authApiService.updateAddress(addressUpdate)),
          tapResponse({
            next: (updatedUser) => {
              store.updateUser(updatedUser);
              patchState(store, { addressUpdateLoading: false });
              toastStore.showSuccess('Address updated successfully');
            },
            error: (error: Error) => {
              patchState(store, {
                addressUpdateLoading: false,
                error: error.message || 'Failed to update address'
              });
              toastStore.showError(error.message || 'Failed to update address');
            }
          })
        )
      ),

      // Change password
      changePassword: rxMethod<PasswordChangeRequest>(
        pipe(
          tap(() => patchState(store, { passwordChangeLoading: true, error: null })),
          switchMap((passwordChange) => authApiService.changePassword(passwordChange)),
          tapResponse({
            next: () => {
              patchState(store, { passwordChangeLoading: false });
              toastStore.showSuccess('Password changed successfully');
            },
            error: (error: Error) => {
              patchState(store, {
                passwordChangeLoading: false,
                error: error.message || 'Failed to change password'
              });
              toastStore.showError(error.message || 'Failed to change password');
            }
          })
        )
      ),

      // Request access for new users (client-shop specific)
      requestAccess: rxMethod<{ email: string; company: string }>(
        pipe(
          tap(() => store.setLoading(true)),
          switchMap((request) => authApiService.requestAccess(request)),
          tapResponse({
            next: () => {
              store.setLoading(false);
              toastStore.showSuccess('Access request submitted successfully');
            },
            error: (error: Error) => {
              store.setLoading(false);
              patchState(store, { error: error.message || 'Failed to submit access request' });
              toastStore.showError(error.message || 'Failed to submit access request');
            }
          })
        )
      ),

      // Password reset with proper error handling
      requestPasswordReset: rxMethod<string>(
        pipe(
          tap(() => store.setLoading(true)),
          switchMap((email) => authApiService.requestPasswordReset(email)),
          tapResponse({
            next: () => store.setLoading(false),
            error: () => {
              store.setLoading(false);
              patchState(store, { error: 'Failed to send password reset email' });
            }
          })
        )
      ),

      // Email change methods will be handled in the component due to multi-step flow
      setEmailChangeLoading(loading: boolean): void {
        patchState(store, { emailChangeLoading: loading });
      },

      updateUserEmail(newEmail: string): void {
        const currentUser = store.user();
        if (currentUser) {
          const updatedUser = { ...currentUser, email: newEmail };
          store.updateUser(updatedUser);
        }
      },

      // Additional computed properties for client-shop
      userContactName: () => store.user()?.contactName || null,
      userCompanyName: () => store.user()?.invoiceInfo?.companyName || null,
      userVatNumber: () => store.user()?.invoiceInfo?.vatNumber || null
    };
  })
);
