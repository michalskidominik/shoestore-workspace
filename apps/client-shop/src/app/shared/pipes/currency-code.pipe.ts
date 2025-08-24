import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyStore } from '../stores/currency.store';

@Pipe({
  name: 'currencyCode',
  pure: true
})
export class CurrencyCodePipe implements PipeTransform {
  private readonly currencyStore = inject(CurrencyStore);

  transform(value: number): string {
    return this.currencyStore.formatWithCode(value);
  }
}