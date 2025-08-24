import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { 
  AuthApiService, 
  LoginCredentials, 
  PasswordChangeRequest, 
  AddressUpdateRequest
} from '../services/auth-api.service';
import { User, Address } from '@shoestore/shared-models';
import { ToastStore } from '../../shared/stores/toast.store';

// Re-export types for components
export type { User, LoginCredentials, Address, PasswordChangeRequest, AddressUpdateRequest };

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  // Profile update loading states
  addressUpdateLoading: boolean;
  passwordChangeLoading: boolean;
  emailChangeLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  addressUpdateLoading: false,
  passwordChangeLoading: false,
  emailChangeLoading: false
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    userContactName: computed(() => user()?.contactName || null),
    userCompanyName: computed(() => user()?.invoiceInfo?.companyName || null),
    userVatNumber: computed(() => user()?.invoiceInfo?.vatNumber || null)
  })),
  withMethods((store, router = inject(Router), authApiService = inject(AuthApiService), toastStore = inject(ToastStore)) => ({
    // Initialize authentication from localStorage
    initializeAuth: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() => authApiService.validateSession()),
        tapResponse({
          next: (user: User | null) => patchState(store, {
            user,
            isLoading: false,
            isInitialized: true,
            error: null
          }),
          error: () => patchState(store, {
            user: null,
            isLoading: false,
            isInitialized: true,
            error: 'Failed to initialize authentication'
          })
        })
      )
    ),

    // Login with proper error handling
    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) => authApiService.login(credentials)),
        tapResponse({
          next: (result) => {
            authApiService.storeUserSession(result.user);
            patchState(store, {
              user: result.user,
              isLoading: false,
              error: null
            });
            router.navigate(['/dashboard']);
          },
          error: (error: Error) => patchState(store, {
            isLoading: false,
            error: error.message || 'Login failed'
          })
        })
      )
    ),

    // Logout method
    logout(): void {
      authApiService.clearUserSession();
      patchState(store, { user: null, error: null });
      router.navigate(['/dashboard']);
    },

    // Password reset with proper error handling
    requestPasswordReset: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((email) => authApiService.requestPasswordReset(email)),
        tapResponse({
          next: () => patchState(store, { isLoading: false }),
          error: () => patchState(store, {
            isLoading: false,
            error: 'Failed to send password reset email'
          })
        })
      )
    ),

    // Access request for new users
    requestAccess: rxMethod<{ email: string; company: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((request) => authApiService.requestAccess(request)),
        tapResponse({
          next: () => patchState(store, { isLoading: false }),
          error: () => patchState(store, {
            isLoading: false,
            error: 'Failed to submit access request'
          })
        })
      )
    ),

    clearError(): void {
      patchState(store, { error: null });
    },

    // Update user address
    updateAddress: rxMethod<AddressUpdateRequest>(
      pipe(
        tap(() => patchState(store, { addressUpdateLoading: true, error: null })),
        switchMap((addressUpdate) => authApiService.updateAddress(addressUpdate)),
        tapResponse({
          next: (updatedUser) => {
            patchState(store, { 
              user: updatedUser, 
              addressUpdateLoading: false 
            });
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

    // Email change methods will be handled in the component due to multi-step flow
    setEmailChangeLoading(loading: boolean): void {
      patchState(store, { emailChangeLoading: loading });
    },

    updateUserEmail(newEmail: string): void {
      const currentUser = store.user();
      if (currentUser) {
        const updatedUser = { ...currentUser, email: newEmail };
        patchState(store, { user: updatedUser });
        // Update localStorage as well
        authApiService.storeUserSession(updatedUser);
      }
    }
  }))
);
