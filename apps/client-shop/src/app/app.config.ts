import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { AuthStore } from './core/stores/auth.store';
import { CartStore } from './features/cart/stores/cart.store';

// Factory function for app initialization
function initializeApp(): () => Promise<void> {
  return () => {
    const authStore = inject(AuthStore);
    const cartStore = inject(CartStore);

    // Initialize auth first
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
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false, // Explicitly disable dark mode
        }
      },
    }),
    provideRouter(appRoutes),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    }
  ],
};
