import { inject } from '@angular/core';
import { Router, type CanActivateFn, UrlTree } from '@angular/router';
import { FirebaseAuthService } from './firebase-auth.service';

export interface AuthGuardConfig {
  loginRoute: string;
  redirectRoute?: string; // For authenticated users in guest guard
  timeout?: number; // Timeout for auth initialization
}

/**
 * Utility function to wait for auth service initialization
 */
function waitForInit(authService: FirebaseAuthService, timeoutMs = 3000): Promise<void> {
  // Check if we have a user profile (indicates initialization is complete)
  const checkInitialized = () => {
    return authService.getCurrentUserProfile() !== undefined;
  };

  if (checkInitialized()) return Promise.resolve();

  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (checkInitialized() || Date.now() - start > timeoutMs) {
        resolve();
      } else {
        setTimeout(tick, 30);
      }
    };
    tick();
  });
}

/**
 * Create an auth guard with configurable routes
 */
export function createAuthGuard(config: AuthGuardConfig): CanActivateFn {
  return (route, state) => {
    const authService = inject(FirebaseAuthService);
    const router = inject(Router);

    // Fast path: check if already authenticated
    if (authService.isAuthenticated()) {
      return true;
    }

    // If user profile is null (not undefined), we know initialization is complete
    const userProfile = authService.getCurrentUserProfile();
    if (userProfile === null) {
      // Not authenticated and initialization complete
      return router.createUrlTree([config.loginRoute], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Wait for initialization to complete
    return waitForInit(authService, config.timeout).then(() => {
      return authService.isAuthenticated()
        ? true
        : (router.createUrlTree([config.loginRoute], {
            queryParams: { returnUrl: state.url }
          }) as UrlTree | boolean);
    });
  };
}

/**
 * Create a guest guard (prevents authenticated users from accessing certain routes)
 */
export function createGuestGuard(config: Pick<AuthGuardConfig, 'redirectRoute'>): CanActivateFn {
  return () => {
    const authService = inject(FirebaseAuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return true;
    }

    // Redirect authenticated users
    if (config.redirectRoute) {
      router.navigate([config.redirectRoute]);
    }
    return false;
  };
}

/**
 * Pre-configured auth guard for common use cases
 */
export const createStandardAuthGuard = (loginRoute = '/login', timeout = 3000) =>
  createAuthGuard({ loginRoute, timeout });

/**
 * Pre-configured guest guard for common use cases
 */
export const createStandardGuestGuard = (redirectRoute = '/dashboard') =>
  createGuestGuard({ redirectRoute });
