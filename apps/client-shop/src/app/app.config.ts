import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject, InjectionToken } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {
  FirebaseAuthService,
  initializeFirebaseAuth,
  createAuthInterceptor,
  type FirebaseAuthConfig
} from '@shoestore/shared-auth';
import { AuthStore } from './core/stores/auth.store';
import { CartStore } from './features/cart/stores/cart.store';
import { Auth } from 'firebase/auth';
import { environment } from '../environments/environment';

// Create injection token for Firebase Auth
export const FIREBASE_AUTH_TOKEN = new InjectionToken<Auth>('FIREBASE_AUTH_TOKEN');

// Factory function for app initialization
function initializeApp(): () => Promise<void> {
  return () => {
    const authStore = inject(AuthStore);
    const cartStore = inject(CartStore);
    const firebaseAuthService = inject(FirebaseAuthService);
    const auth = inject(FIREBASE_AUTH_TOKEN);

    // Configure Firebase Auth service
    const config: FirebaseAuthConfig = {
      auth,
      apiUrl: environment.apiUrl,
      // No role validation for client-shop (all authenticated users allowed)
    };

    firebaseAuthService.initialize(config);

    // Initialize auth first - call as function with void parameter
    authStore.initializeAuth();

    // Initialize cart after auth
    cartStore.initializeCart();

    // Create a promise that resolves when both are initialized
    return new Promise<void>((resolve) => {
      const checkInitialized = () => {
        if (authStore.isInitialized()) {
          resolve();
        } else {
          // Check again after a short delay
          setTimeout(checkInitialized, 50);
        }
      };

      // Start checking immediately
      checkInitialized();
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([
      createAuthInterceptor({
        publicEndpoints: ['/api/auth/login', '/api/auth/verify-token', '/api/auth/request-access']
      })
    ])),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false, // Explicitly disable dark mode
        }
      },
    }),
    provideRouter(appRoutes),
    // Initialize Firebase Auth service
    {
      provide: FIREBASE_AUTH_TOKEN,
      useFactory: () => {
        return initializeFirebaseAuth({
          config: environment.firebase
        });
      }
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    }
  ],
};
