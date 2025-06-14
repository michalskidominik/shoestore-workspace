import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="favorites">
      <h2 class="text-2xl font-bold mb-4">My Favorites</h2>
      <p-card>
        <p>Your favorite shoes will appear here...</p>
      </p-card>
    </div>
  `
})
export class FavoritesComponent {}
