import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="order-history">
      <h2 class="text-2xl font-bold mb-4">Order History</h2>
      <p-card>
        <p>Your order history will appear here...</p>
      </p-card>
    </div>
  `
})
export class OrderHistoryComponent {}
