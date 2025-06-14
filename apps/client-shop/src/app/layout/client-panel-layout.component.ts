import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiStateService } from '../core/services/ui-state.service';
import { HeaderComponent } from './components/header/header.component';
import { SidebarNavComponent } from './components/sidebar-nav/sidebar-nav.component';
import { MenuItem } from '../shared/models/menu-item.interface';

@Component({
  selector: 'app-client-panel-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarNavComponent],  template: `
    <div class="app-layout" [class.sidebar-collapsed]="!isSidebarVisible()">
      <!-- Semantic Header -->
      <header>
        <app-header
          [companyName]="companyName"
          (logout)="onLogout()">
        </app-header>
      </header>

      <div class="layout-content">
        <!-- Semantic Sidebar Navigation -->
        <aside
          class="app-sidebar"
          [class.hidden]="!isSidebarVisible()">
          <app-sidebar-nav [menuItems]="menuItems"></app-sidebar-nav>
        </aside>

        <!-- Semantic Main content area -->
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .layout-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .app-sidebar {
      width: 280px;
      background: var(--surface-card);
      border-right: 1px solid var(--surface-border);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .app-sidebar.hidden {
      width: 0;
      min-width: 0;
    }

    .app-main {
      flex: 1;
      overflow: auto;
      background: var(--surface-ground);
      padding: 1rem;
    }

    /* Responsive behavior */
    @media (max-width: 768px) {
      .app-sidebar {
        position: fixed;
        top: 60px;
        left: 0;
        height: calc(100vh - 60px);
        z-index: 999;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        transform: translateX(-100%);
      }

      .app-sidebar:not(.hidden) {
        transform: translateX(0);
      }

      .app-main {
        width: 100%;
        margin-left: 0;
      }
    }
  `]
})
export class ClientPanelLayoutComponent {
  private uiStateService = inject(UiStateService);

  readonly isSidebarVisible = this.uiStateService.isSidebarVisible;
  readonly companyName = 'ShoeStore Client';

  readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard'
    },
    {
      label: 'Products',
      icon: 'pi pi-shopping-bag',
      items: [
        {
          label: 'Browse Shoes',
          icon: 'pi pi-list',
          routerLink: '/products'
        },
        {
          label: 'My Favorites',
          icon: 'pi pi-heart',
          routerLink: '/favorites'
        }
      ]
    },
    {
      label: 'Orders',
      icon: 'pi pi-shopping-cart',
      items: [
        {
          label: 'My Orders',
          icon: 'pi pi-list',
          routerLink: '/orders'
        },
        {
          label: 'Order History',
          icon: 'pi pi-history',
          routerLink: '/orders/history'
        }
      ]
    },
    {
      label: 'Account',
      icon: 'pi pi-user',
      items: [
        {
          label: 'Profile',
          icon: 'pi pi-user-edit',
          routerLink: '/profile'
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          routerLink: '/settings'
        }
      ]
    }
  ];

  onLogout(): void {
    // Implement logout logic here
    console.log('Logout requested');
  }
}
