import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="orders">
      <h2 class="text-2xl font-bold mb-4">My Orders</h2>
      <p-card>
        <p>Your current orders will appear here...</p>
      </p-card>
    </div>
  `
})
export class OrdersComponent {}
