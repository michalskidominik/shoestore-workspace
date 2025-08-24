import { Component, inject, input, output, computed, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { PopoverModule } from 'primeng/popover';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { MenuItem } from 'primeng/api';
import { filter, map, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../../core/stores/auth.store';
import { CartStore } from '../../../features/cart/stores/cart.store';
import { CartPanelComponent } from './components/cart-panel/cart-panel.component';

interface NavigationItem {
  label: string;
  route: string;
  icon?: string;
  requiresAuth?: boolean;
  exact?: boolean;
  ariaLabel?: string;
  badge?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    BadgeModule,
    MenuModule,
    PopoverModule,
    OverlayPanelModule,
    AvatarModule,
    DividerModule,
    RouterLink,
    CartPanelComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block w-full',
    'role': 'banner'
  }
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly authStore = inject(AuthStore);
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  // Input/Output properties
  readonly companyName = input<string>('MANDRAIME');
  readonly logout = output<void>();

  // State signals
  protected readonly isMobileMenuOpen = signal(false);

  // Authentication state
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly currentUser = this.authStore.user;
  // All users are B2B - no need for isB2BUser property

  // Cart state
  readonly cartItemCount = this.cartStore.totalItems;
  readonly cartItems = this.cartStore.entities;
  readonly cartSummary = this.cartStore.cartSummary;

  // Current route tracking for active navigation
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url),
      takeUntil(this.destroy$)
    ),
    { initialValue: this.router.url }
  );

  // Navigation items configuration for B2B
  private readonly allNavigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'pi-th-large',
      exact: true,
      requiresAuth: true, // Only show for authenticated users
      ariaLabel: 'Navigate to business dashboard'
    },
    {
      label: 'Products', // Changed from Inventory to Products
      route: '/products',
      icon: 'pi-box',
      ariaLabel: 'Browse product catalog'
    },
    {
      label: 'Orders',
      route: '/orders',
      icon: 'pi-shopping-cart',
      requiresAuth: true,
      ariaLabel: 'Manage your orders'
    }
  ];

  ngOnInit(): void {
    // Authentication is now initialized during app bootstrap in app.config.ts

    // Close menus when clicking outside
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

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
        styleClass: 'text-slate-700 hover:text-blue-600'
      },
      {
        label: 'Order History',
        icon: 'pi pi-history',
        command: () => this.navigateToOrders(),
        styleClass: 'text-slate-700 hover:text-blue-600'
      },
      // {
      //   label: 'Notifications',
      //   icon: 'pi pi-bell',
      //   command: () => {
      //     // Notification panel is now handled by PrimeNG OverlayPanel
      //     // No need to close user menu as OverlayPanel handles this
      //   },
      //   styleClass: 'text-slate-700 hover:text-blue-600'
      // },
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

  // Notification count for business context
  readonly notificationCount = signal(3);

  // Check if route is active
  protected isRouteActive(route: string, exact = false): boolean {
    const currentUrl = this.currentUrl();
    return exact ? currentUrl === route : currentUrl?.startsWith(route) || false;
  }

  // Navigation methods
  protected onToggleMobileMenu(): void {
    this.isMobileMenuOpen.update(isOpen => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected closeAllMenus(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected navigateToProfile(): void {
    this.router.navigate(['/profile']);
    // PrimeNG OverlayPanel will close automatically
  }

  protected navigateToOrders(): void {
    this.router.navigate(['/orders']);
    // PrimeNG OverlayPanel will close automatically
  }

  protected onLogout(): void {
    this.authStore.logout();
    this.logout.emit();
    // PrimeNG OverlayPanel will close automatically
  }

  protected onSignIn(): void {
    this.router.navigate(['/sign-in']);
    this.closeMobileMenu();
  }

  protected navigateToLanding(): void {
    this.router.navigate(['/landing']);
  }

  // Handle keyboard navigation
  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAllMenus();
    }
  }

  // Handle outside clicks to close menus
  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mobile-menu') &&
        !target.closest('.user-menu') &&
        !target.closest('.notification-panel') &&
        !target.closest('[data-menu-trigger]')) {
      this.closeAllMenus();
    }
  }

  // Get user initials for avatar
  protected getUserInitials(): string {
    const user = this.currentUser();
    if (!user?.contactName) return 'U';

    return user.contactName
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  // Get greeting based on time of day
  protected getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // Cart navigation methods
  protected navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  protected onRemoveCartItem(productId: number, size: number): void {
    this.cartStore.removeItem({ productId, size });
  }

  protected onUpdateCartQuantity(productId: number, size: number, quantity: number): void {
    if (quantity <= 0) {
      this.cartStore.removeItem({ productId, size });
    } else {
      this.cartStore.updateQuantity({ productId, size, newQuantity: quantity });
    }
  }
}
