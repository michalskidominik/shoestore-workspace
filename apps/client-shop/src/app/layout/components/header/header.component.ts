import { Component, input, output, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { UiStateService } from '../../../core/services/ui-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonModule, ToolbarModule],
  template: `
    <header class="app-header">
      <p-toolbar styleClass="border-none shadow-2">
        <div class="flex align-items-center gap-2">
          <p-button
            icon="pi pi-bars"
            severity="secondary"
            [text]="true"
            (onClick)="onToggleSidebar()"
            aria-label="Toggle sidebar"
            size="large">
          </p-button>
          <h1 class="text-xl font-semibold text-primary m-0">
            {{ companyName() }}
          </h1>
        </div>

        <div class="flex align-items-center gap-2">
          <p-button
            icon="pi pi-sign-out"
            severity="secondary"
            [text]="true"
            (onClick)="onLogout()"
            aria-label="Logout"
            size="large">
          </p-button>
        </div>
      </p-toolbar>
    </header>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
  `]
})
export class HeaderComponent {
  private uiStateService = inject(UiStateService);

  companyName = input<string>('ShoeStore');
  logout = output<void>();

  onToggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
