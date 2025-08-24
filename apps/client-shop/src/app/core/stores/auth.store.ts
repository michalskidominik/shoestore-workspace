import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService, LoginCredentials } from '../services/auth-api.service';
import { User } from '@shoestore/shared-models';

// Re-export types for components
export type { User, LoginCredentials };

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false
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
  withMethods((store, router = inject(Router), authApiService = inject(AuthApiService)) => ({
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
    }
  }))
);
