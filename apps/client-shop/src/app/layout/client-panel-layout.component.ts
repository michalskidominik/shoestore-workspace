import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastComponent } from '../shared/components/toast/toast.component';

@Component({
  selector: 'app-client-panel-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastComponent
  ],
  templateUrl: './client-panel-layout.component.html',
  styleUrl: './client-panel-layout.component.scss',
})
export class ClientPanelLayoutComponent {
  private router = inject(Router);

  readonly companyName = 'MANDRAIME SUPPLY';
  readonly currentYear = new Date().getFullYear();

  // Track current route for different content wrapper styling
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Computed class for content wrapper based on current route
  readonly contentWrapperClass = computed(() => {
    const url = this.currentUrl();

    if (url === '/products' || url.startsWith('/products/')) {
      return 'p-6 max-w-none'; // Products page - full width content with integrated sidebar
    } else {
      return 'p-6 max-w-6xl mx-auto'; // Other pages - centered with moderate width
    }
  });

  onLogout(): void {
    // Implement logout logic here
    console.log('Logout requested');
  }
}
