import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiStateService } from '../core/services/ui-state.service';
import { HeaderComponent } from './components/header/header.component';
import { SidebarNavComponent } from './components/sidebar-nav/sidebar-nav.component';
import { MenuItem } from '../shared/models/menu-item.interface';

@Component({
  selector: 'app-client-panel-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarNavComponent
  ],
  templateUrl: './client-panel-layout.component.html',
  styleUrl: './client-panel-layout.component.scss',
})
export class ClientPanelLayoutComponent {
  private uiStateService = inject(UiStateService);
  private router = inject(Router);

  readonly isSidebarVisible = this.uiStateService.isSidebarVisible;
  readonly companyName = 'MANDRAIME';

  // Track current route to show sidebar only on /products page
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly showSidebar = computed(() => {
    const url = this.currentUrl();
    return url === '/products' || url.startsWith('/products/');
  });

  // Categories for product filtering - shown only on products page
  readonly menuItems: MenuItem[] = [
    {
      label: 'Sneakers',
      icon: 'pi pi-star',
      routerLink: '/products?category=sneakers',
    },
    {
      label: 'Shoes',
      icon: 'pi pi-briefcase',
      routerLink: '/products?category=shoes',
    },
    {
      label: 'Heels',
      icon: 'pi pi-angle-up',
      routerLink: '/products?category=heels',
    },
    {
      label: 'Slippers',
      icon: 'pi pi-home',
      routerLink: '/products?category=slippers',
    },
  ];
  // Computed class for content wrapper based on current route
  readonly contentWrapperClass = computed(() => {
    const url = this.currentUrl();

    if (url === '/products' || url.startsWith('/products/')) {
      return 'p-6 max-w-none'; // Products page with sidebar - full width content
    } else if (url === '/dashboard') {
      return 'p-8 max-w-7xl mx-auto'; // Dashboard - centered with max width
    } else {
      return 'p-6 max-w-6xl mx-auto'; // Other pages - centered with moderate width
    }
  });

  onLogout(): void {
    // Implement logout logic here
    console.log('Logout requested');
  }

  closeSidebar(): void {
    this.uiStateService.setSidebarVisibility(false);
  }
}
