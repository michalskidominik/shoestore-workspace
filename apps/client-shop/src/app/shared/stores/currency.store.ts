import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { 
  CurrencyConfig, 
  CurrencyFormatOptions, 
  CurrencyDisplayOptions, 
  SupportedCurrency, 
  DEFAULT_CURRENCY_CONFIGS 
} from '@shoestore/shared-models';

interface CurrencyState {
  currentCurrency: SupportedCurrency;
  availableCurrencies: SupportedCurrency[];
  defaultDisplayOptions: CurrencyDisplayOptions;
}

const initialState: CurrencyState = {
  currentCurrency: 'EUR', // Default to EUR for European business
  availableCurrencies: ['EUR', 'USD', 'PLN'],
  defaultDisplayOptions: {
    format: 'symbol',
    position: 'before',
    spacing: false
  }
};

export const CurrencyStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ currentCurrency, defaultDisplayOptions }) => ({
    // Current currency configuration
    currentConfig: computed((): CurrencyConfig => 
      DEFAULT_CURRENCY_CONFIGS[currentCurrency()]
    ),
    
    // Current currency symbol
    currentSymbol: computed((): string => 
      DEFAULT_CURRENCY_CONFIGS[currentCurrency()].symbol
    ),
    
    // Current currency code
    currentCode: computed((): string => 
      DEFAULT_CURRENCY_CONFIGS[currentCurrency()].code
    ),
    
    // Current locale for formatting
    currentLocale: computed((): string => 
      DEFAULT_CURRENCY_CONFIGS[currentCurrency()].locale
    ),
    
    // Available currency configs
    availableConfigs: computed(() =>
      Object.entries(DEFAULT_CURRENCY_CONFIGS)
        .filter(([code]) => initialState.availableCurrencies.includes(code as SupportedCurrency))
        .map(([, config]) => config)
    )
  })),
  withMethods((store) => ({
    // Set the current currency
    setCurrency(currency: SupportedCurrency): void {
      if (!store.availableCurrencies().includes(currency)) {
        console.warn(`Currency ${currency} is not available`);
        return;
      }
      patchState(store, { currentCurrency: currency });
    },
    
    // Format amount with current currency
    formatAmount(
      amount: number, 
      options: CurrencyFormatOptions = {}
    ): string {
      const config = store.currentConfig();
      const displayOptions = store.defaultDisplayOptions();
      
      const {
        showSymbol = displayOptions.format === 'symbol',
        symbolPosition = displayOptions.position,
        showCode = displayOptions.format === 'code',
        minimumFractionDigits = config.decimalPlaces,
        maximumFractionDigits = config.decimalPlaces
      } = options;
      
      // Format the number using Intl.NumberFormat
      const formattedNumber = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping: true
      }).format(amount);
      
      // Build the final string based on display preferences
      if (showCode) {
        return symbolPosition === 'before' 
          ? `${config.code} ${formattedNumber}`
          : `${formattedNumber} ${config.code}`;
      }
      
      if (showSymbol) {
        const spacing = displayOptions.spacing ? ' ' : '';
        return symbolPosition === 'before'
          ? `${config.symbol}${spacing}${formattedNumber}`
          : `${formattedNumber}${spacing}${config.symbol}`;
      }
      
      return formattedNumber;
    },
    
    // Format amount with symbol (shorthand)
    formatWithSymbol(amount: number): string {
      return this.formatAmount(amount, { showSymbol: true });
    },
    
    // Format amount with code (shorthand)
    formatWithCode(amount: number): string {
      return this.formatAmount(amount, { showCode: true });
    },
    
    // Format amount for input components (PrimeNG compatible)
    formatForInput(amount: number): string {
      const config = store.currentConfig();
      return new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: config.decimalPlaces,
        maximumFractionDigits: config.decimalPlaces,
        useGrouping: false // No thousands separator for inputs
      }).format(amount);
    },
    
    // Get currency config for PrimeNG components
    getPrimeNGCurrencyConfig(): { currency: string; locale: string } {
      const config = store.currentConfig();
      return {
        currency: config.code,
        locale: config.locale
      };
    },
    
    // Update display options
    updateDisplayOptions(options: Partial<CurrencyDisplayOptions>): void {
      patchState(store, { 
        defaultDisplayOptions: { 
          ...store.defaultDisplayOptions(), 
          ...options 
        } 
      });
    },
    
    // Helper method to format price ranges
    formatPriceRange(minPrice: number, maxPrice: number): string {
      if (minPrice === maxPrice) {
        return this.formatWithSymbol(minPrice);
      }
      return `${this.formatWithSymbol(minPrice)} - ${this.formatWithSymbol(maxPrice)}`;
    }
  }))
);