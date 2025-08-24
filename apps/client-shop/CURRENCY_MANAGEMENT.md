# Currency Management System

## Overview

The client-shop application now uses a centralized currency management system that ensures consistent currency formatting across all components. The system is built using @ngrx/signals and follows the existing architectural patterns.

## Architecture

### Core Components

1. **CurrencyConfig Models** (`shared/shared-models/src/lib/currency-config.model.ts`)
   - Type definitions for currency configurations
   - Default configurations for EUR, USD, and PLN
   - Format options and display preferences

2. **CurrencyStore** (`apps/client-shop/src/app/shared/stores/currency.store.ts`)
   - Centralized store using @ngrx/signals
   - Manages current currency and formatting preferences
   - Provides formatting methods for all currency displays

## Usage

### Injecting the Store

```typescript
import { CurrencyStore } from '../../shared/stores/currency.store';

export class YourComponent {
  protected readonly currencyStore = inject(CurrencyStore);
}
```

### Formatting Currency in Templates

**Basic currency formatting:**
```html
<!-- Old way (inconsistent) -->
<span>€{{ amount.toFixed(2) }}</span>

<!-- New way (centralized) -->
<span>{{ currencyStore.formatWithSymbol(amount) }}</span>
```

**Price ranges:**
```html
<!-- Old way -->
<span>€{{ minPrice.toFixed(2) }} - €{{ maxPrice.toFixed(2) }}</span>

<!-- New way -->
<span>{{ currencyStore.formatPriceRange(minPrice, maxPrice) }}</span>
```

### Available Methods

- `formatWithSymbol(amount)` - Formats with currency symbol (€123,45)
- `formatWithCode(amount)` - Formats with currency code (EUR 123,45)
- `formatPriceRange(min, max)` - Formats price ranges consistently
- `formatForInput(amount)` - For form inputs (no thousands separator)
- `getPrimeNGCurrencyConfig()` - Configuration for PrimeNG components

### Changing Currency

```typescript
// Set currency programmatically
this.currencyStore.setCurrency('USD');

// Access current currency info
const symbol = this.currencyStore.currentSymbol(); // $
const code = this.currencyStore.currentCode(); // USD
```

## Configuration

### Default Settings

- **Default Currency:** EUR (Euro)
- **Symbol Position:** Before amount (€123,45)
- **Decimal Places:** 2
- **Locale:** pl-PL (Polish formatting)

### Available Currencies

- **EUR** - Euro (€) with Polish locale
- **USD** - US Dollar ($) with US locale  
- **PLN** - Polish Złoty (zł) with Polish locale

### Customizing Display

```typescript
// Update display preferences
this.currencyStore.updateDisplayOptions({
  format: 'code',        // Show currency code instead of symbol
  position: 'after',     // Show currency after amount
  spacing: true          // Add space between amount and currency
});
```

## Benefits

1. **Consistency** - All currency displays use the same formatting rules
2. **Maintainability** - Change currency globally from one place
3. **Internationalization Ready** - Easy to add new currencies and locales
4. **Type Safety** - Strongly typed configuration and methods
5. **Integration** - Works seamlessly with existing @ngrx/signals architecture

## Migration Guide

When updating existing components:

1. Add CurrencyStore injection
2. Replace hardcoded currency symbols with store methods
3. Remove .toFixed(2) calls for currency amounts
4. Use formatPriceRange() for price ranges

**Before:**
```typescript
getPriceRange(prices: number[]): string {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `€${min.toFixed(2)}` : `€${min.toFixed(2)} - €${max.toFixed(2)}`;
}
```

**After:**
```typescript
getPriceRange(prices: number[]): string {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return this.currencyStore.formatPriceRange(min, max);
}
```

## Testing

The currency store includes comprehensive tests covering:
- Basic formatting functionality
- Currency switching
- Error handling
- PrimeNG integration
- Price range formatting

Run tests with: `npx nx test client-shop --testFile="currency.store.spec.ts"`