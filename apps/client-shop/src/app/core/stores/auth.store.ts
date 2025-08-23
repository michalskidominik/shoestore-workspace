import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, delay, throwError } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  name: string;
  type: 'b2b';
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

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
    userPermissions: computed(() => user()?.permissions || []),
    userType: computed(() => user()?.type || null)
  })),
  withMethods((store, router = inject(Router)) => ({
    // Initialize authentication from localStorage
    initializeAuth: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() => {
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              return of(user).pipe(delay(300));
            } catch {
              return of(null).pipe(delay(300));
            }
          }
          return of(null).pipe(delay(300));
        }),
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
        switchMap((credentials) => {
          return of(credentials).pipe(
            delay(800), // Simulate API call
            switchMap((creds) => {
              // Mock authentication - accept specific credentials or any email with password 'password'
              if (creds.password === 'password' ||
                  (creds.email === 'admin@sgats.com' && creds.password === 'admin123') ||
                  (creds.email === 'user@sgats.com' && creds.password === 'user123') ||
                  (creds.email === 'b2b-test@sgats.com' && creds.password === 'b2b123')) {
                
                const user: User = {
                  id: 1,
                  email: creds.email,
                  name: creds.email.split('@')[0],
                  type: 'b2b',
                  permissions: ['order:create', 'order:view', 'products:view']
                };
                localStorage.setItem('authUser', JSON.stringify(user));
                return of({ success: true, user });
              }
              return throwError(() => new Error('Invalid email or password'));
            })
          );
        }),
        tapResponse({
          next: (result) => {
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
      localStorage.removeItem('authUser');
      patchState(store, { user: null, error: null });
      router.navigate(['/dashboard']);
    },

    // Password reset with proper error handling
    requestPasswordReset: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => of({ success: true }).pipe(delay(500))),
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
        switchMap(() => of({ success: true }).pipe(delay(500))),
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