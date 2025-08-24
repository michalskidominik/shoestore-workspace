import { Pipe, PipeTransform, inject } from '@angular/core';
import { Shoe } from '@shoestore/shared-models';
import { CurrencyStore } from '../stores/currency.store';
import { AuthStore } from '../../core/stores/auth.store';

@Pipe({
  name: 'productPriceRange',
  pure: true
})
export class ProductPriceRangePipe implements PipeTransform {
  private readonly currencyStore = inject(CurrencyStore);
  private readonly authStore = inject(AuthStore);

  transform(product: Shoe): string {
    if (!this.authStore.isAuthenticated()) {
      return '••••••'; // Blurred prices for unauthenticated users
    }

    if (!product.sizes || product.sizes.length === 0) return 'Price not available';

    const prices = product.sizes.map((s: { price: number }) => s.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return this.currencyStore.formatPriceRange(minPrice, maxPrice);
  }
}