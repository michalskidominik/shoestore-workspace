import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="settings">
      <h2 class="text-2xl font-bold mb-4">Settings</h2>
      <p-card>
        <p>Application settings will appear here...</p>
      </p-card>
    </div>
  `
})
export class SettingsComponent {}
