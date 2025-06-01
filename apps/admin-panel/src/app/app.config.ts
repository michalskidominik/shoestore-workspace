import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { MockShoeService } from './mocks/mock-shoe.service';
import { MockSizeTemplateService } from './mocks/mock-size-template.service';
import { ShoeService } from './pages/shoes/service/shoe.service';
import { SizeTemplateService } from './pages/shoes/service/size-template.service';
import { OrderService } from './pages/orders/services/order.service';
import { MockOrderService } from './mocks/mock-order.service';
import { UserService } from './pages/users/services/user.service';
import { MockUserService } from './mocks/mock-user.service';

const useMocks = true; // Set to true to use mock services

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
    provideHttpClient(withFetch()),
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
    }
  ],
};

// todo:
// - dodać stronę empty, notfound, liste produktów, dodawanie-edycje produktu, autoryzacje
