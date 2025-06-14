import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="profile">
      <h2 class="text-2xl font-bold mb-4">My Profile</h2>
      <p-card>
        <p>Your profile information will appear here...</p>
      </p-card>
    </div>
  `
})
export class ProfileComponent {}
