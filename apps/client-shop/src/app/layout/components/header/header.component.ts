import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { UiStateService } from '../../../core/services/ui-state.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private uiStateService = inject(UiStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  companyName = input<string>('SGATS SHOES SHOP');
  logout = output<void>();

  // Authentication state
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;

  // Navigation items based on auth status
  readonly guestNavItems = [
    { label: 'Landing Page', route: '/dashboard', exact: true },
    { label: 'Catalog', route: '/products' },
    { label: 'About Us', route: '/about-us' },
    { label: 'Contact', route: '/contact' }
  ];

  readonly authNavItems = [
    { label: 'Catalog', route: '/products' },
    { label: 'Orders', route: '/orders' },
    { label: 'Account Settings', route: '/profile' },
    { label: 'Contact', route: '/contact' }
  ];

  readonly navigationItems = computed(() => {
    return this.isAuthenticated() ? this.authNavItems : this.guestNavItems;
  });

  onToggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  onLogout(): void {
    this.authService.logout();
    this.logout.emit();
  }

  onSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}
