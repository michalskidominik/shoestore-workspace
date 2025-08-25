import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject, InjectionToken } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import {
  FirebaseAuthService,
  initializeFirebaseAuth,
  createAuthInterceptor,
  type FirebaseAuthConfig
} from '@shoestore/shared-auth';
import { User } from '@shoestore/shared-models';
import { Auth } from 'firebase/auth';
import { appRoutes } from './app.routes';
import { MockShoeService } from './mocks/mock-shoe.service';
import { MockSizeTemplateService } from './mocks/mock-size-template.service';
import { ShoeService } from './pages/shoes/service/shoe.service';
import { SizeTemplateService } from './pages/shoes/service/size-template.service';
import { OrderService } from './pages/orders/services/order.service';
import { MockOrderService } from './mocks/mock-order.service';
import { UserService } from './pages/users/services/user.service';
import { MockUserService } from './mocks/mock-user.service';
import { AuthStore } from './core/stores/auth.store';
import { environment } from '../environments/environment';

// Create injection token for Firebase Auth
export const FIREBASE_AUTH_TOKEN = new InjectionToken<Auth>('FIREBASE_AUTH_TOKEN');

const useMocks = true; // Set to true to use mock services

// Factory function for app initialization
function initializeApp(): () => Promise<void> {
  return () => {
    const authStore = inject(AuthStore);
    const firebaseAuthService = inject(FirebaseAuthService);
    const auth = inject(FIREBASE_AUTH_TOKEN);

    // Configure Firebase Auth service
    const config: FirebaseAuthConfig = {
      auth,
      apiUrl: environment.apiUrl,
      // Admin role validation for admin-panel
      roleValidation: (user: User) => user.role === 'admin'
    };

    firebaseAuthService.initialize(config);

    // Initialize auth
    authStore.initializeAuth();

    // Create a promise that resolves when auth is initialized
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
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      withEnabledBlockingInitialNavigation()
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.app-dark' },
      },
    }),
    provideHttpClient(withFetch(), withInterceptors([
      createAuthInterceptor({
        publicEndpoints: ['/api/auth/login', '/api/auth/verify-token']
      })
    ])),
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
      provide: ShoeService,
      useClass: useMocks ? MockShoeService : ShoeService,
    },
    {
      provide: SizeTemplateService,
      useClass: useMocks ? MockSizeTemplateService : SizeTemplateService,
    },
    {
      provide: OrderService,
      useClass: useMocks ? MockOrderService : OrderService,
    },
    {
      provide: UserService,
      useClass: useMocks ? MockUserService : UserService,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    }
  ],
};
