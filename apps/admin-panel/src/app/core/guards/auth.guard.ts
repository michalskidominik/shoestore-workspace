import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

/**
 * Auth guard that uses the admin-panel auth store
 * Waits for auth store initialization before checking authentication
 * Requires admin role for access
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Wait for auth store to be initialized
  await waitForAuthInitialization(authStore);

  // Check if user is authenticated with admin role
  if (authStore.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guest guard that prevents authenticated users from accessing certain routes
 */
export const guestGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Wait for auth store to be initialized
  await waitForAuthInitialization(authStore);

  // If user is authenticated with admin role, redirect to dashboard
  if (authStore.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

/**
 * Utility function to wait for auth store initialization
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function waitForAuthInitialization(authStore: any, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    // If already initialized, resolve immediately
    if (authStore.isInitialized()) {
      resolve();
      return;
    }

    const start = Date.now();
    const checkInitialized = () => {
      if (authStore.isInitialized() || Date.now() - start > timeoutMs) {
        resolve();
      } else {
        setTimeout(checkInitialized, 50);
      }
    };

    checkInitialized();
  });
}
