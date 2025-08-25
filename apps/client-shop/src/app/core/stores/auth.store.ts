import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthService, SessionManager } from '@shoestore/shared-auth';
import { AuthApiService } from '../services/auth-api.service';
import {
  User,
  Address,
  LoginCredentials,
  PasswordChangeRequest,
  AddressUpdateRequest,
  AccessRequest
} from '@shoestore/shared-models';
import { ToastStore } from '../../shared/stores/toast.store';
import { environment } from '../../../environments/environment';

// Re-export types for components
export type { User, LoginCredentials, Address, PasswordChangeRequest, AddressUpdateRequest, AccessRequest };

// Complete auth state for client-shop
interface ClientAuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  addressUpdateLoading: boolean;
  passwordChangeLoading: boolean;
  emailChangeLoading: boolean;
}

const initialState: ClientAuthState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  addressUpdateLoading: false,
  passwordChangeLoading: false,
  emailChangeLoading: false
};

// Create auth store with both base and client-shop specific features
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    userEmail: computed(() => user()?.email || null),
    userRole: computed(() => user()?.role || null),
    userName: computed(() => user()?.contactName || user()?.email || null),
    userContactName: computed(() => user()?.contactName || null),
    userCompanyName: computed(() => user()?.invoiceInfo?.companyName || null),
    userVatNumber: computed(() => user()?.invoiceInfo?.vatNumber || null)
  })),
  withMethods((store) => {
    const router = inject(Router);
    const firebaseAuthService = inject(FirebaseAuthService);
    const authApiService = inject(AuthApiService);
    const toastStore = inject(ToastStore);

    // Create session manager for this store
    const sessionManager = new SessionManager({
      storageKey: 'authSession',
      sessionHours: environment.authSessionHours ?? 8
    });

    return {
      /**
       * Initialize authentication - hydrate from storage then listen to Firebase auth state
       */
      initializeAuth: rxMethod<void>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true });

            // Attempt hydration from localStorage (fast sync path)
            const cachedUser = sessionManager.getSession();
            if (cachedUser) {
              patchState(store, {
                user: cachedUser,
                isInitialized: true,
                isLoading: false
              });
            }
          }),
          switchMap(() => firebaseAuthService.userProfile$),
          tapResponse({
            next: (user: User | null) => {
              // If we already hydrated a user and Firebase emits null first, don't wipe it
              const existingUser = store.user();
              const finalUser = user || existingUser;

              patchState(store, {
                user: finalUser,
                isLoading: false,
                isInitialized: true,
                error: null
              });

              if (finalUser) {
                sessionManager.persistSession(finalUser);
              } else {
                sessionManager.clearSession();
              }
            },
            error: (error: Error) => {
              patchState(store, {
                // keep possibly hydrated user even if listener errored
                isLoading: false,
                isInitialized: true,
                error: error.message || 'Failed to initialize authentication'
              });
            }
          })
        )
      ),

      /**
       * Login with Firebase Authentication
       */
      login: rxMethod<LoginCredentials>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((credentials) => firebaseAuthService.login(credentials)),
          tapResponse({
            next: (result) => {
              if (result.success && result.user) {
                patchState(store, {
                  user: result.user,
                  isLoading: false,
                  error: null
                });
                sessionManager.persistSession(result.user);
                router.navigate(['/dashboard']);
              } else {
                patchState(store, {
                  isLoading: false,
                  error: result.message || 'Login failed'
                });
              }
            },
            error: (error: Error) => {
              patchState(store, {
                isLoading: false,
                error: error.message || 'Login failed'
              });
            }
          })
        )
      ),

      /**
       * Logout with Firebase Authentication
       */
      logout: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() => firebaseAuthService.logout()),
          tapResponse({
            next: () => {
              patchState(store, {
                user: null,
                error: null,
                isLoading: false
              });
              sessionManager.clearSession();
              router.navigate(['/']);
            },
            error: (error: Error) => {
              // Even if logout fails, clear local session
              patchState(store, {
                user: null,
                error: null,
                isLoading: false
              });
              sessionManager.clearSession();
              router.navigate(['/']);
              console.error('Logout error:', error);
            }
          })
        )
      ),

      /**
       * Clear error state
       */
      clearError(): void {
        patchState(store, { error: null });
      },

      /**
       * Update user data in store and session
       */
      updateUser(user: User): void {
        patchState(store, { user });
        sessionManager.updateSession(user);
      },

      /**
       * Set loading state
       */
      setLoading(loading: boolean): void {
        patchState(store, { isLoading: loading });
      },

      /**
       * Get session manager for additional session operations
       */
      getSessionManager(): SessionManager {
        return sessionManager;
      },

      // Client-shop specific methods
      updateAddress: rxMethod<AddressUpdateRequest>(
        pipe(
          tap(() => patchState(store, { addressUpdateLoading: true, error: null })),
          switchMap((addressUpdate) => authApiService.updateAddress(addressUpdate)),
          tapResponse({
            next: (updatedUser) => {
              patchState(store, { user: updatedUser, addressUpdateLoading: false });
              sessionManager.updateSession(updatedUser);
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

      requestAccess: rxMethod<AccessRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((request) => authApiService.requestAccess(request)),
          tapResponse({
            next: () => {
              patchState(store, { isLoading: false });
              toastStore.showSuccess('Access request submitted successfully');
            },
            error: (error: Error) => {
              patchState(store, {
                isLoading: false,
                error: error.message || 'Failed to submit access request'
              });
              toastStore.showError(error.message || 'Failed to submit access request');
            }
          })
        )
      ),

      requestPasswordReset: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((email) => authApiService.requestPasswordReset(email)),
          tapResponse({
            next: () => patchState(store, { isLoading: false }),
            error: () => {
              patchState(store, {
                isLoading: false,
                error: 'Failed to send password reset email'
              });
            }
          })
        )
      ),

      setEmailChangeLoading(loading: boolean): void {
        patchState(store, { emailChangeLoading: loading });
      },

      updateUserEmail(newEmail: string): void {
        const currentUser = store.user();
        if (currentUser) {
          const updatedUser = { ...currentUser, email: newEmail };
          patchState(store, { user: updatedUser });
          sessionManager.updateSession(updatedUser);
        }
      }
    };
  })
);
