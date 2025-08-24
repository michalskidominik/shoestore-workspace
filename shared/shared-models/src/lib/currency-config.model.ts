export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  symbolPosition?: 'before' | 'after';
  showCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface CurrencyDisplayOptions {
  format: 'symbol' | 'code' | 'name';
  position: 'before' | 'after';
  spacing: boolean;
}

export type SupportedCurrency = 'EUR' | 'USD' | 'PLN';

export const DEFAULT_CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'pl-PL',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Złoty',
    locale: 'pl-PL',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  }
};