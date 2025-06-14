import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="products">
      <h2 class="text-2xl font-bold mb-4">Browse Shoes</h2>
      <p-card>
        <p>Product catalog coming soon...</p>
      </p-card>
    </div>
  `
})
export class ProductsComponent {}
