import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, switchMap, catchError } from 'rxjs';
import { FirebaseAuthService } from './firebase-auth.service';

export interface AuthInterceptorConfig {
  apiBaseUrl?: string;
  publicEndpoints?: string[];
  skipNonApiRequests?: boolean;
}

const DEFAULT_CONFIG: AuthInterceptorConfig = {
  publicEndpoints: ['/api/auth/login', '/api/auth/verify-token'],
  skipNonApiRequests: true
};

/**
 * Create an auth interceptor with configurable options
 */
export function createAuthInterceptor(config: AuthInterceptorConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const firebaseAuthService = inject(FirebaseAuthService);

    // Skip interceptor for non-API requests if configured
    if (finalConfig.skipNonApiRequests && !request.url.includes('/api/')) {
      return next(request);
    }

    // Skip interceptor for public endpoints
    if (finalConfig.publicEndpoints?.some(endpoint => request.url.includes(endpoint))) {
      return next(request);
    }

    // Get current ID token and add it to the request
    return firebaseAuthService.getCurrentIdToken().pipe(
      switchMap(idToken => {
        if (idToken) {
          const authRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${idToken}`
            }
          });
          return next(authRequest);
        } else {
          return next(request);
        }
      }),
      catchError(error => {
        console.error('Auth interceptor error:', error);
        return next(request);
      })
    );
  };
}
