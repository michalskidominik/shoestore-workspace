import { TestBed } from '@angular/core/testing';
import { CurrencyPipe } from './currency.pipe';
import { CurrencyStore } from '../stores/currency.store';

describe('CurrencyPipe', () => {
  let pipe: CurrencyPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrencyPipe, CurrencyStore]
    });
    pipe = TestBed.inject(CurrencyPipe);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format amount with symbol', () => {
    const result = pipe.transform(123.45);
    expect(result).toContain('123');
    expect(result).toContain('€');
  });

  it('should handle zero amount', () => {
    const result = pipe.transform(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });
});