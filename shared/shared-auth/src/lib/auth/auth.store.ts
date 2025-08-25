import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthService } from './firebase-auth.service';
import { SessionManager } from './auth-session.types';
import {
  User,
  LoginCredentials
} from '@shoestore/shared-models';

// Re-export types for convenience
export type { User, LoginCredentials };

export interface BaseAuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthStoreConfig {
  loginSuccessRoute?: string;
  logoutRoute?: string;
  sessionConfig?: {
    storageKey?: string;
    sessionHours?: number;
  };
  showToasts?: boolean;
}

const initialState: BaseAuthState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false
};

/**
 * Create a base auth store with configurable behavior
 */
export function createBaseAuthStore(config: AuthStoreConfig = {}) {
  const defaultConfig: Required<AuthStoreConfig> = {
    loginSuccessRoute: '/dashboard',
    logoutRoute: '/',
    sessionConfig: {
      storageKey: 'authSession',
      sessionHours: 8
    },
    showToasts: false
  };

  const finalConfig = { ...defaultConfig, ...config };
  const sessionManager = new SessionManager(finalConfig.sessionConfig);

  return signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ user }) => ({
      isAuthenticated: computed(() => !!user()),
      userEmail: computed(() => user()?.email || null),
      userRole: computed(() => user()?.role || null),
      userName: computed(() => user()?.contactName || user()?.email || null)
    })),
    withMethods((store,
      router = inject(Router),
      firebaseAuthService = inject(FirebaseAuthService)
    ) => ({
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
                router.navigate([finalConfig.loginSuccessRoute]);
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
              router.navigate([finalConfig.logoutRoute]);
            },
            error: (error: Error) => {
              // Even if logout fails, clear local session
              patchState(store, {
                user: null,
                error: null,
                isLoading: false
              });
              sessionManager.clearSession();
              router.navigate([finalConfig.logoutRoute]);
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
      }
    }))
  );
}
