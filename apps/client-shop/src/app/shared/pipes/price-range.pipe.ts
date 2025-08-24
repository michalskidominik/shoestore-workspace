import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyStore } from '../stores/currency.store';

@Pipe({
  name: 'priceRange',
  pure: true
})
export class PriceRangePipe implements PipeTransform {
  private readonly currencyStore = inject(CurrencyStore);

  transform(minPrice: number, maxPrice: number): string {
    return this.currencyStore.formatPriceRange(minPrice, maxPrice);
  }
}