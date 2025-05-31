import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ShoeService } from './pages/shoes/service/shoe.service';
import { MockShoeService } from './mocks/mock-shoe.service';

const useMocks = true; // Set to true to use mock services

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.app-dark' }
      },
    }),
    provideHttpClient(withFetch()),
    {
      provide: ShoeService,
      useClass: useMocks ? MockShoeService : ShoeService
    }
  ],
};

// todo:
// - dodać stronę empty, notfound, liste produktów, dodawanie-edycje produktu, autoryzacje
