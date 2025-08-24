import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyStore } from '../stores/currency.store';

@Pipe({
  name: 'currency',
  pure: true
})
export class CurrencyPipe implements PipeTransform {
  private readonly currencyStore = inject(CurrencyStore);

  transform(value: number): string {
    return this.currencyStore.formatWithSymbol(value);
  }
}