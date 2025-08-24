import { TestBed } from '@angular/core/testing';
import { CurrencyStore } from './currency.store';
import { DEFAULT_CURRENCY_CONFIGS } from '@shoestore/shared-models';

describe('CurrencyStore', () => {
  let store: InstanceType<typeof CurrencyStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrencyStore]
    });
    store = TestBed.inject(CurrencyStore);
  });

  it('should create', () => {
    expect(store).toBeTruthy();
  });

  it('should have EUR as default currency', () => {
    expect(store.currentCurrency()).toBe('EUR');
    expect(store.currentSymbol()).toBe('€');
    expect(store.currentCode()).toBe('EUR');
  });

  it('should format amounts with symbol correctly', () => {
    const formatted = store.formatWithSymbol(123.45);
    expect(formatted).toBe('€123,45');
  });

  it('should format price ranges correctly', () => {
    // Test same price
    expect(store.formatPriceRange(100, 100)).toBe('€100,00');
    
    // Test different prices
    expect(store.formatPriceRange(50, 100)).toBe('€50,00 - €100,00');
  });

  it('should format amounts with code correctly', () => {
    const formatted = store.formatWithCode(123.45);
    expect(formatted).toBe('EUR 123,45');
  });

  it('should change currency correctly', () => {
    store.setCurrency('USD');
    expect(store.currentCurrency()).toBe('USD');
    expect(store.currentSymbol()).toBe('$');
    expect(store.currentCode()).toBe('USD');
  });

  it('should handle invalid currency gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    store.setCurrency('INVALID' as any);
    expect(store.currentCurrency()).toBe('EUR'); // Should remain unchanged
    expect(consoleSpy).toHaveBeenCalledWith('Currency INVALID is not available');
    consoleSpy.mockRestore();
  });

  it('should provide PrimeNG compatible currency config', () => {
    const config = store.getPrimeNGCurrencyConfig();
    expect(config).toEqual({
      currency: 'EUR',
      locale: 'pl-PL'
    });
  });

  it('should format for input without thousands separator', () => {
    const formatted = store.formatForInput(1234.56);
    expect(formatted).toBe('1234,56');
  });

  it('should update display options', () => {
    store.updateDisplayOptions({ format: 'code', position: 'after' });
    
    const formatted = store.formatAmount(100);
    expect(formatted).toBe('100,00 EUR');
  });
});