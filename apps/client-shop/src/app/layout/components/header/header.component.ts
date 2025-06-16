import { Component, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UiStateService } from '../../../core/services/ui-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
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
