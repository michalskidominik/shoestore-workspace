import { Route } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  // Landing page (public)
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  // Sign in page (for guests only)
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/sign-in/sign-in.component').then(m => m.SignInComponent)
  },
  // Main layout with auth protection for some routes
  {
    path: '',
    loadComponent: () => import('./layout/client-panel-layout.component').then(m => m.ClientPanelLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: '/landing',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'payment-instructions',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/payment-instructions/payment-instructions.component').then(m => m.PaymentInstructionsComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      // Placeholder routes for header navigation
      {
        path: 'about-us',
        loadComponent: () => import('./pages/about-us/about-us.component').then(m => m.AboutUsComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
