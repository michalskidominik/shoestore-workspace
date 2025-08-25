import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthService, SessionManager } from '@shoestore/shared-auth';
import {
  User,
  LoginCredentials
} from '@shoestore/shared-models';

// Re-export types for components
export type { User, LoginCredentials };

// Admin auth state
interface AdminAuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AdminAuthState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false
};

// Create auth store with admin-specific features
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    // Admin-specific authentication - requires admin role
    isAuthenticated: computed(() => {
      const currentUser = user();
      return !!currentUser && currentUser.role === 'admin';
    }),
    userEmail: computed(() => user()?.email || null),
    userRole: computed(() => user()?.role || null),
    userName: computed(() => user()?.contactName || user()?.email || null)
  })),
  withMethods((store) => {
    const router = inject(Router);
    const firebaseAuthService = inject(FirebaseAuthService);

    // Create session manager for admin with shorter session
    const sessionManager = new SessionManager({
      storageKey: 'adminAuthSession',
      sessionHours: 4 // Shorter session for admin
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
            if (cachedUser && cachedUser.role === 'admin') {
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
              // Validate admin role
              if (user && user.role !== 'admin') {
                // Non-admin user trying to access admin panel
                patchState(store, {
                  user: null,
                  isLoading: false,
                  isInitialized: true,
                  error: 'Access denied. Admin privileges required.'
                });
                sessionManager.clearSession();
                router.navigate(['/login']);
                return;
              }

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
                // Check admin role
                if (result.user.role !== 'admin') {
                  patchState(store, {
                    isLoading: false,
                    error: 'Access denied. Admin privileges required.'
                  });
                  return;
                }

                patchState(store, {
                  user: result.user,
                  isLoading: false,
                  error: null
                });
                sessionManager.persistSession(result.user);
                router.navigate(['/']);
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
              router.navigate(['/login']);
            },
            error: (error: Error) => {
              // Even if logout fails, clear local session
              patchState(store, {
                user: null,
                error: null,
                isLoading: false
              });
              sessionManager.clearSession();
              router.navigate(['/login']);
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
        // Ensure user still has admin role
        if (user.role !== 'admin') {
          this.logout();
          return;
        }
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

      /**
       * Refresh authentication (admin-specific)
       */
      refreshAuth: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() => firebaseAuthService.getCurrentIdToken()),
          tapResponse({
            next: (token) => {
              if (token) {
                // Token refresh successful, user profile will be updated automatically
                patchState(store, { isLoading: false });
              } else {
                // No token available, logout
                patchState(store, {
                  user: null,
                  error: 'Session expired. Please login again.',
                  isLoading: false
                });
                sessionManager.clearSession();
                router.navigate(['/login']);
              }
            },
            error: (error: Error) => {
              console.error('Token refresh error:', error);
              // If refresh fails, clear session and redirect to login
              patchState(store, {
                user: null,
                error: 'Session expired. Please login again.',
                isLoading: false
              });
              sessionManager.clearSession();
              router.navigate(['/login']);
            }
          })
        )
      )
    };
  })
);
