import { Component, inject, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiStateService } from '../../../core/services/ui-state.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavigationItem {
  label: string;
  route: string;
  icon?: string;
  requiresAuth?: boolean;
  exact?: boolean;
  ariaLabel?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    BadgeModule,
    MenuModule,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block w-full',
    'role': 'banner'
  }
})
export class HeaderComponent {
  private readonly uiStateService = inject(UiStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Input/Output properties
  readonly companyName = input<string>('MANDRAIME');
  readonly logout = output<void>();

  // State signals
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isUserMenuOpen = signal(false);

  // Authentication state
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;

  // Current route tracking for active navigation
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url)
    ),
    { initialValue: this.router.url }
  );

  // Navigation items configuration
  private readonly allNavigationItems: NavigationItem[] = [
    { 
      label: 'Home', 
      route: '/dashboard', 
      icon: 'pi-home',
      exact: true,
      ariaLabel: 'Navigate to home dashboard'
    },
    { 
      label: 'Products', 
      route: '/products', 
      icon: 'pi-shopping-bag',
      ariaLabel: 'Browse product catalog'
    },
    { 
      label: 'Orders', 
      route: '/orders', 
      icon: 'pi-list',
      requiresAuth: true,
      ariaLabel: 'View your orders'
    },
    { 
      label: 'About Us', 
      route: '/about-us', 
      icon: 'pi-info-circle',
      ariaLabel: 'Learn about our company'
    },
    { 
      label: 'Contact', 
      route: '/contact', 
      icon: 'pi-envelope',
      ariaLabel: 'Contact us for support'
    }
  ];

  // Computed navigation items based on authentication
  readonly navigationItems = computed(() => {
    return this.allNavigationItems.filter(item => 
      !item.requiresAuth || this.isAuthenticated()
    );
  });

  // User menu items for authenticated users
  readonly userMenuItems = computed<MenuItem[]>(() => {
    if (!this.isAuthenticated()) return [];
    
    return [
      {
        label: 'Account Settings',
        icon: 'pi pi-user',
        command: () => this.navigateToProfile(),
        styleClass: 'text-slate-700 hover:text-purple-600'
      },
      {
        label: 'Order History',
        icon: 'pi pi-history',
        command: () => this.navigateToOrders(),
        styleClass: 'text-slate-700 hover:text-purple-600'
      },
      {
        separator: true
      },
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: () => this.onLogout(),
        styleClass: 'text-red-600 hover:text-red-700'
      }
    ];
  });

  // Check if route is active
  protected isRouteActive(route: string, exact = false): boolean {
    const currentUrl = this.currentUrl();
    return exact ? currentUrl === route : currentUrl?.startsWith(route) || false;
  }

  // Navigation methods
  protected onToggleMobileMenu(): void {
    this.isMobileMenuOpen.update(isOpen => !isOpen);
    // Close user menu when mobile menu opens
    if (this.isMobileMenuOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }

  protected onToggleUserMenu(): void {
    this.isUserMenuOpen.update(isOpen => !isOpen);
    // Close mobile menu when user menu opens
    if (this.isUserMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  protected navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeUserMenu();
  }

  protected navigateToOrders(): void {
    this.router.navigate(['/orders']);
    this.closeUserMenu();
  }

  protected onLogout(): void {
    this.authService.logout();
    this.logout.emit();
    this.closeUserMenu();
  }

  protected onSignIn(): void {
    this.router.navigate(['/sign-in']);
    this.closeMobileMenu();
  }

  // Toggle sidebar for products page
  protected onToggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  // Handle keyboard navigation
  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isMobileMenuOpen.set(false);
      this.isUserMenuOpen.set(false);
    }
  }

  // Handle outside clicks to close menus
  protected onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mobile-menu') && !target.closest('.user-menu')) {
      this.isMobileMenuOpen.set(false);
      this.isUserMenuOpen.set(false);
    }
  }
}
