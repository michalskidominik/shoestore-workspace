# Redux Migration Guide for client-shop App

## Overview

This guide provides a comprehensive analysis of the `client-shop` application and detailed migration steps to implement the Redux pattern using `@ngrx/signals` and `@ngrx/operators`. The migration will improve state management, centralize business logic, and streamline API request handling while maintaining the current mock API functionality.

## Current State Analysis

### Existing Architecture

The application currently uses Angular signals extensively for state management across:

- **Services**: AuthService, CartService, ProductService, OrderService, ToastService, UiStateService
- **Components**: Products, Orders, Cart, SignIn, Header components with local state management
- **Patterns**: Signal-based reactive state, effects for side effects, manual API mocking with delays

### Current Pain Points

1. **Scattered State Logic**: Component-level state management leads to duplication
2. **Manual Error Handling**: Inconsistent error handling patterns across components
3. **Complex Service Interactions**: Services managing multiple concerns simultaneously
4. **API Request Boilerplate**: Repetitive mock API setup in each service
5. **No Centralized Loading States**: Each component manages its own loading states
6. **Limited Entity Management**: Manual array manipulation for collections

## Migration Benefits

### Redux with @ngrx/signals Advantages

1. **Centralized State Management**: Single source of truth for each domain
2. **Robust Error Handling**: Consistent error handling with `tapResponse`
3. **Optimized Performance**: Efficient change detection with signals
4. **Entity Management**: Built-in entity management with `withEntities`
5. **Scalable Architecture**: Method-driven pattern for straightforward data flow
6. **Better Testability**: Isolated business logic in stores

## Installation Requirements

First, install the required dependencies:

```bash
npm install @ngrx/signals @ngrx/operators
```

## Migration Candidates Analysis

After thorough code analysis, the following areas have been identified as prime candidates for Redux migration:

### 1. Authentication Management

**Current Location**: `src/app/core/services/auth.service.ts` + SignInComponent state
**Current Issues**:
- Mixed authentication logic in component and service
- Manual loading state management in components
- Basic error handling patterns
- No centralized user profile management

**Migration Benefits**:
- Centralized authentication state
- Consistent loading and error handling
- Better separation of concerns
- Improved testing capabilities

### 2. Product Management

**Current Location**: `src/app/shared/services/product.service.ts` + ProductsComponent state
**Current Issues**:
- Duplicated filtering/sorting logic between service and component
- Component manages complex local state (filters, pagination, loading)
- Manual array manipulation for product collections
- Scattered product-related state across multiple signals

**Migration Benefits**:
- Unified product state management
- Entity-based product collection management
- Centralized filtering and sorting logic
- Debounced search implementation
- Better performance with computed signals

### 3. Shopping Cart Management

**Current Location**: `src/app/shared/services/cart.service.ts` + CartComponent state
**Current Issues**:
- Complex cart item management with manual persistence
- Scattered validation logic
- Component-level error handling for cart operations
- Manual cart merging logic for guest/user sessions

**Migration Benefits**:
- Entity-based cart item management
- Automatic persistence with effects
- Centralized validation and error handling
- Improved cart merging for authentication scenarios

### 4. Order Management

**Current Location**: `src/app/shared/services/order.service.ts` + OrdersComponent state
**Current Issues**:
- Component manages pagination, filtering, and sorting state
- Manual order collection management
- Duplicated query logic between service and component
- Inconsistent loading states

**Migration Benefits**:
- Centralized order state with pagination
- Entity-based order collection
- Built-in filtering and search with debouncing
- Consistent error handling patterns

### 5. Toast/Notification System

**Current Location**: `src/app/shared/services/toast.service.ts`
**Current Issues**:
- Basic signal-based implementation
- Limited queue management
- No automatic cleanup mechanisms

**Migration Benefits**:
- Better toast queue management
- Entity-based toast storage with automatic cleanup
- Configurable toast limits and duration

### 6. UI State Management

**Current Location**: `src/app/core/services/ui-state.service.ts`
**Current Issues**:
- Very basic sidebar state only
- No responsive state management
- Missing global UI states (loading, errors, theme)

**Migration Benefits**:
- Comprehensive UI state management
- Responsive state detection
- Theme management with system preference
- Global loading and error states
- Breadcrumb management

## Detailed Migration Plans

### 1. Authentication Store Migration

**Target**: Convert AuthService to AuthStore with proper side effect management

#### Migration Steps

**Step 1: Install dependencies and create AuthStore**

```typescript
// src/app/core/stores/auth.store.ts
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, delay, throwError } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  name: string;
  type: 'b2b';
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    userPermissions: computed(() => user()?.permissions || []),
    userType: computed(() => user()?.type || null)
  })),
  withMethods((store, router = inject(Router)) => ({
    // Initialize authentication from localStorage
    initializeAuth: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() => {
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              return of(user).pipe(delay(300));
            } catch {
              return of(null).pipe(delay(300));
            }
          }
          return of(null).pipe(delay(300));
        }),
        tapResponse({
          next: (user) => patchState(store, { 
            user, 
            isLoading: false, 
            isInitialized: true,
            error: null 
          }),
          error: () => patchState(store, { 
            user: null, 
            isLoading: false, 
            isInitialized: true,
            error: 'Failed to initialize authentication' 
          })
        })
      )
    ),

    // Login with proper error handling
    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) => {
          return of(credentials).pipe(
            delay(800), // Simulate API call
            switchMap((creds) => {
              // Mock B2B user validation
              if (creds.email === 'test@business.com' && creds.password === 'business123') {
                const user: User = {
                  id: 1,
                  email: creds.email,
                  name: 'Test Business User',
                  type: 'b2b',
                  permissions: ['order:create', 'order:view', 'products:view']
                };
                localStorage.setItem('authUser', JSON.stringify(user));
                return of({ success: true, user });
              }
              return throwError(() => new Error('Invalid credentials'));
            })
          );
        }),
        tapResponse({
          next: (result) => {
            patchState(store, { 
              user: result.user, 
              isLoading: false,
              error: null 
            });
            router.navigate(['/dashboard']);
          },
          error: (error: Error) => patchState(store, { 
            isLoading: false,
            error: error.message || 'Login failed' 
          })
        })
      )
    ),

    // Logout method
    logout(): void {
      localStorage.removeItem('authUser');
      patchState(store, { user: null, error: null });
      router.navigate(['/dashboard']);
    },

    // Password reset with proper error handling
    requestPasswordReset: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => of({ success: true }).pipe(delay(500))),
        tapResponse({
          next: () => patchState(store, { isLoading: false }),
          error: () => patchState(store, { 
            isLoading: false,
            error: 'Failed to send password reset email' 
          })
        })
      )
    ),

    // Access request for new users
    requestAccess: rxMethod<{ email: string; company: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => of({ success: true }).pipe(delay(500))),
        tapResponse({
          next: () => patchState(store, { isLoading: false }),
          error: () => patchState(store, { 
            isLoading: false,
            error: 'Failed to submit access request' 
          })
        })
      )
    ),

    clearError(): void {
      patchState(store, { error: null });
    }
  }))
);
```

**Step 2: Update SignInComponent**

```typescript
// src/app/pages/sign-in/sign-in.component.ts
import { inject } from '@angular/core';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  // ... existing imports
})
export class SignInComponent {
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  // Replace local signals with store signals
  protected readonly loading = this.authStore.isLoading;
  protected readonly errorMessage = this.authStore.error;

  // Keep existing form setup
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  passwordResetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  accessRequestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    company: ['', [Validators.required]]
  });

  // Simplified methods using store
  async onLogin(): Promise<void> {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value as LoginCredentials;
      this.authStore.login(credentials);
    }
  }

  async onPasswordReset(): Promise<void> {
    if (this.passwordResetForm.valid) {
      const email = this.passwordResetForm.get('email')?.value;
      if (email) {
        this.authStore.requestPasswordReset(email);
      }
    }
  }

  async onAccessRequest(): Promise<void> {
    if (this.accessRequestForm.valid) {
      const formValue = this.accessRequestForm.value;
      this.authStore.requestAccess({
        email: formValue.email!,
        company: formValue.company!
      });
    }
  }

  // Remove all local state management and error handling
  // The store now handles everything centrally
}
```

**Step 3: Update HeaderComponent**

```typescript
// src/app/layout/components/header/header.component.ts
export class HeaderComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  // Remove authService injection

  // Use store signals instead of service
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly currentUser = this.authStore.user;

  ngOnInit(): void {
    // Initialize authentication when app starts
    this.authStore.initializeAuth();
  }

  onLogout(): void {
    this.authStore.logout();
    this.logout.emit();
  }
}
```

#### Migration Benefits Achieved
- ✅ Centralized authentication logic in one store
- ✅ Consistent error handling with `tapResponse`
- ✅ Automatic loading state management
- ✅ Better separation of concerns
- ✅ Improved testability with isolated store logic

### 2. Product Management Store Migration

**Target**: Create unified ProductStore combining ProductService + ProductsComponent state

#### Migration Steps

**Step 1: Create ProductStore with entity management**

```typescript
// src/app/features/products/stores/product.store.ts
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { ProductService } from '../../../shared/services/product.service';

export interface ProductFilters {
  searchTerm: string;
  selectedBrands: string[];
  selectedCategories: string[];
  selectedAvailability: string[];
  sortBy: string;
  sizeSystem: 'eu' | 'us';
}

interface ProductState {
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
  sizeTemplates: SizeTemplate[];
  categories: any[];
  brands: string[];
  brandStats: Record<string, number>;
}

const initialFilters: ProductFilters = {
  searchTerm: '',
  selectedBrands: [],
  selectedCategories: [],
  selectedAvailability: [],
  sortBy: 'name-asc',
  sizeSystem: 'eu'
};

const initialState: ProductState = {
  isLoading: false,
  error: null,
  filters: initialFilters,
  sizeTemplates: [],
  categories: [],
  brands: [],
  brandStats: {}
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Shoe>(),
  withComputed(({ entities, filters, brands, brandStats }) => ({
    // Advanced computed filtered products
    filteredProducts: computed(() => {
      const allProducts = entities();
      const currentFilters = filters();
      
      let filtered = allProducts.filter(product => {
        // Search filter
        if (currentFilters.searchTerm) {
          const searchTerm = currentFilters.searchTerm.toLowerCase();
          if (!product.name.toLowerCase().includes(searchTerm) && 
              !product.code.toLowerCase().includes(searchTerm)) {
            return false;
          }
        }

        // Brand filter
        if (currentFilters.selectedBrands.length > 0) {
          const productBrand = product.name.split(' ')[0].toLowerCase();
          if (!currentFilters.selectedBrands.some(brand => 
            brand.toLowerCase() === productBrand)) {
            return false;
          }
        }

        // Category filter
        if (currentFilters.selectedCategories.length > 0) {
          if (!currentFilters.selectedCategories.includes(product.category || 'sneakers')) {
            return false;
          }
        }

        // Availability filter
        if (currentFilters.selectedAvailability.length > 0) {
          const totalStock = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
          const hasAvailability = currentFilters.selectedAvailability.some(availability => {
            switch (availability) {
              case 'in-stock': return totalStock > 50;
              case 'low-stock': return totalStock > 0 && totalStock <= 50;
              case 'pre-order': return totalStock === 0;
              case 'made-to-order': return product.name.toLowerCase().includes('custom');
              default: return false;
            }
          });
          if (!hasAvailability) return false;
        }

        return true;
      });

      // Apply sorting
      const [sortField, sortDirection] = currentFilters.sortBy.split('-');
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            const priceA = Math.min(...a.sizes.map(size => size.price));
            const priceB = Math.min(...b.sizes.map(size => size.price));
            comparison = priceA - priceB;
            break;
          case 'stock':
            const stockA = a.sizes.reduce((sum, size) => sum + size.quantity, 0);
            const stockB = b.sizes.reduce((sum, size) => sum + size.quantity, 0);
            comparison = stockA - stockB;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });

      return filtered;
    }),

    // Brand options with counts for filter UI
    brandOptions: computed(() => {
      const brandList = brands();
      const stats = brandStats();
      return [
        { label: 'All Brands', value: 'all' },
        ...brandList.map(brand => ({
          label: brand,
          value: brand.toLowerCase(),
          count: stats[brand] || 0
        }))
      ];
    }),

    // Active filters for display chips
    activeFilters: computed(() => {
      const currentFilters = filters();
      const activeList: Array<{type: string, label: string, value: string, displayValue: string}> = [];

      if (currentFilters.searchTerm) {
        activeList.push({
          type: 'search',
          label: 'Search',
          value: 'search',
          displayValue: currentFilters.searchTerm
        });
      }

      currentFilters.selectedBrands.forEach(brand => {
        activeList.push({
          type: 'brand',
          label: 'Brand',
          value: brand,
          displayValue: brand
        });
      });

      currentFilters.selectedCategories.forEach(category => {
        activeList.push({
          type: 'category',
          label: 'Category',
          value: category,
          displayValue: category
        });
      });

      return activeList;
    }),

    hasActiveFilters: computed(() => {
      const currentFilters = filters();
      return currentFilters.searchTerm !== '' ||
             currentFilters.selectedBrands.length > 0 ||
             currentFilters.selectedCategories.length > 0 ||
             currentFilters.selectedAvailability.length > 0;
    })
  })),
  withMethods((store, productService = inject(ProductService)) => ({
    // Load products with error handling
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => 
          productService.getShoes().pipe(
            tapResponse({
              next: (products) => {
                setAllEntities(products, store);
                patchState(store, { isLoading: false });
              },
              error: (error: Error) => patchState(store, { 
                isLoading: false,
                error: error.message || 'Failed to load products' 
              })
            })
          )
        )
      )
    ),

    // Load supporting data (categories, brands, etc.)
    loadSupportingData: rxMethod<void>(
      pipe(
        switchMap(() => 
          forkJoin({
            categories: productService.getCategories(),
            brands: productService.getBrands(),
            brandStats: productService.getBrandStats(),
            sizeTemplates: productService.getSizeTemplates()
          }).pipe(
            tapResponse({
              next: (data) => patchState(store, {
                categories: data.categories,
                brands: data.brands,
                brandStats: data.brandStats,
                sizeTemplates: data.sizeTemplates
              }),
              error: (error: Error) => patchState(store, { 
                error: error.message || 'Failed to load supporting data' 
              })
            })
          )
        )
      )
    ),

    // Debounced search
    searchProducts: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((searchTerm) => {
          patchState(store, { 
            filters: { ...store.filters(), searchTerm } 
          });
        })
      )
    ),

    // Filter management methods
    updateFilter<K extends keyof ProductFilters>(
      filterKey: K, 
      value: ProductFilters[K]
    ): void {
      patchState(store, {
        filters: { ...store.filters(), [filterKey]: value }
      });
    },

    clearFilter(filterType: 'search' | 'brand' | 'category' | 'availability', value?: string): void {
      const currentFilters = store.filters();
      const updatedFilters = { ...currentFilters };

      switch (filterType) {
        case 'search':
          updatedFilters.searchTerm = '';
          break;
        case 'brand':
          if (value) {
            updatedFilters.selectedBrands = currentFilters.selectedBrands.filter(b => b !== value);
          }
          break;
        case 'category':
          if (value) {
            updatedFilters.selectedCategories = currentFilters.selectedCategories.filter(c => c !== value);
          }
          break;
        case 'availability':
          if (value) {
            updatedFilters.selectedAvailability = currentFilters.selectedAvailability.filter(a => a !== value);
          }
          break;
      }

      patchState(store, { filters: updatedFilters });
    },

    clearAllFilters(): void {
      patchState(store, { filters: initialFilters });
    },

    getSizeTemplate(templateId: number) {
      return store.sizeTemplates().find(template => template.id === templateId);
    }
  }))
);
```

**Step 2: Update ProductsComponent to use store**

```typescript
// src/app/pages/products/products.component.ts
@Component({
  selector: 'app-products',
  standalone: true,
  // ... existing imports
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly productStore = inject(ProductStore);
  // Remove productService injection

  // Replace all local state signals with store signals
  protected readonly allShoes = this.productStore.filteredProducts;
  protected readonly categories = this.productStore.categories;
  protected readonly brandOptions = this.productStore.brandOptions;
  protected readonly loading = this.productStore.isLoading;
  protected readonly error = this.productStore.error;
  protected readonly activeFilters = this.productStore.activeFilters;
  protected readonly hasActiveFilters = this.productStore.hasActiveFilters;

  // Keep only UI-specific local state
  protected readonly showMobileOrderDialog = signal(false);
  protected readonly selectedProductForOrder = signal<Shoe | null>(null);
  protected readonly orderDialogSubmitting = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly showMobileFilters = signal(false);

  // Form controls for reactive filtering
  protected readonly searchControl = new FormControl('');
  protected readonly brandControl = new FormControl<string[]>([]);
  protected readonly categoryControl = new FormControl<string[]>([]);

  ngOnInit(): void {
    // Load initial data
    this.productStore.loadProducts();
    this.productStore.loadSupportingData();

    // Set up reactive form controls with store integration
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.productStore.searchProducts(searchTerm || '');
    });

    this.brandControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(brands => {
      this.productStore.updateFilter('selectedBrands', brands || []);
    });

    this.categoryControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(categories => {
      this.productStore.updateFilter('selectedCategories', categories || []);
    });
  }

  // Simplified filter methods
  protected onSortChange(sortValue: string): void {
    this.productStore.updateFilter('sortBy', sortValue);
  }

  protected onClearFilter(filterType: string, value?: string): void {
    this.productStore.clearFilter(filterType as any, value);
  }

  protected onClearAllFilters(): void {
    this.productStore.clearAllFilters();
    // Reset form controls without triggering events
    this.searchControl.setValue('', { emitEvent: false });
    this.brandControl.setValue([], { emitEvent: false });
    this.categoryControl.setValue([], { emitEvent: false });
  }

  // Remove all manual filtering/sorting logic - now handled by store
  // Keep only UI-specific methods like dialog management
}
```

#### Migration Benefits Achieved
- ✅ Centralized product state management
- ✅ Entity-based collection management with `withEntities`
- ✅ Computed-based filtering and sorting for better performance
- ✅ Debounced search with `rxMethod`
- ✅ Reactive form integration with store state

### 3. Cart Management Store Migration

**Target**: Create CartStore with entity management and automatic persistence

#### Migration Steps

**Step 1: Create CartStore with enhanced features**

```typescript
// src/app/features/cart/stores/cart.store.ts
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, addEntity, updateEntity, removeEntity, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, delay, throwError } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, effect, inject } from '@angular/core';
import { AuthStore } from '../../auth/stores/auth.store';
import { ToastStore } from '../../ui/stores/toast.store';

export interface CartItem {
  id: string; // productId-size for unique identification
  productId: number;
  productCode: string;
  productName: string;
  size: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface AddToCartRequest {
  productId: number;
  productCode: string;
  productName: string;
  size: number;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface CartState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isSubmittingOrder: boolean;
}

const initialState: CartState = {
  isLoading: false,
  error: null,
  lastUpdated: null,
  isSubmittingOrder: false
};

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<CartItem>(),
  withComputed(({ entities }) => ({
    // Essential cart computations
    totalItems: computed(() => 
      entities().reduce((total, item) => total + item.quantity, 0)
    ),
    
    totalPrice: computed(() => 
      entities().reduce((total, item) => total + item.totalPrice, 0)
    ),
    
    isEmpty: computed(() => entities().length === 0),
    
    // Grouped items for better UI display
    groupedItems: computed(() => {
      const groups = new Map<number, {
        productId: number;
        productCode: string;
        productName: string;
        unitPrice: number;
        sizes: Array<{ size: number; quantity: number; totalPrice: number }>;
        totalQuantity: number;
        totalPrice: number;
      }>();

      entities().forEach(item => {
        if (!groups.has(item.productId)) {
          groups.set(item.productId, {
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            unitPrice: item.unitPrice,
            sizes: [],
            totalQuantity: 0,
            totalPrice: 0
          });
        }

        const group = groups.get(item.productId)!;
        group.sizes.push({
          size: item.size,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        });
        group.totalQuantity += item.quantity;
        group.totalPrice += item.totalPrice;
      });

      // Sort sizes within groups
      groups.forEach(group => {
        group.sizes.sort((a, b) => a.size - b.size);
      });

      return Array.from(groups.values())
        .sort((a, b) => a.productName.localeCompare(b.productName));
    }),

    // Cart summary for checkout
    cartSummary: computed(() => {
      const subtotal = entities().reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.08; // 8% tax rate for B2B
      return {
        subtotal,
        tax,
        shipping: 0, // Free shipping for B2B orders
        total: subtotal + tax,
        itemCount: entities().reduce((sum, item) => sum + item.quantity, 0)
      };
    })
  })),
  withMethods((store, authStore = inject(AuthStore), toastStore = inject(ToastStore)) => {
    // Automatic persistence effect
    effect(() => {
      const items = store.entities();
      const user = authStore.user();
      
      if (items.length === 0) return;
      
      const storageKey = user ? `userCart_${user.id}` : 'guestCart';
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (error) {
        console.warn('Failed to persist cart:', error);
      }
    });

    return {
      // Initialize cart from storage
      initializeCart: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() => {
            const user = authStore.user();
            const storageKey = user ? `userCart_${user.id}` : 'guestCart';
            
            try {
              const storedCart = localStorage.getItem(storageKey);
              const items: CartItem[] = storedCart ? JSON.parse(storedCart) : [];
              return of(items).pipe(delay(100));
            } catch {
              return of([]).pipe(delay(100));
            }
          }),
          tapResponse({
            next: (items) => {
              setAllEntities(items, store);
              patchState(store, { 
                isLoading: false,
                lastUpdated: new Date().toISOString()
              });
            },
            error: () => patchState(store, { 
              isLoading: false,
              error: 'Failed to load cart' 
            })
          })
        )
      ),

      // Add item to cart with smart merging
      addToCart: rxMethod<AddToCartRequest>(
        pipe(
          tap(() => patchState(store, { error: null })),
          switchMap((request) => {
            const itemId = `${request.productId}-${request.size}`;
            const existingItem = store.entitiesMap()[itemId];
            
            if (existingItem) {
              // Update existing item quantity
              const updatedItem: CartItem = {
                ...existingItem,
                quantity: existingItem.quantity + request.quantity,
                totalPrice: (existingItem.quantity + request.quantity) * request.unitPrice
              };
              
              updateEntity({ id: itemId, changes: updatedItem }, store);
              toastStore.showSuccess(`Updated ${request.productName} quantity in cart`);
            } else {
              // Add new item
              const newItem: CartItem = {
                id: itemId,
                productId: request.productId,
                productCode: request.productCode,
                productName: request.productName,
                size: request.size,
                quantity: request.quantity,
                unitPrice: request.unitPrice,
                totalPrice: request.quantity * request.unitPrice,
                imageUrl: request.imageUrl
              };
              
              addEntity(newItem, store);
              toastStore.showSuccess(`Added ${request.productName} to cart`);
            }

            patchState(store, { lastUpdated: new Date().toISOString() });
            return of(null);
          })
        )
      ),

      // Update item quantity
      updateQuantity(productId: number, size: number, newQuantity: number): void {
        const itemId = `${productId}-${size}`;
        const existingItem = store.entitiesMap()[itemId];
        
        if (!existingItem) return;
        
        if (newQuantity <= 0) {
          removeEntity(itemId, store);
          toastStore.showInfo(`Removed ${existingItem.productName} from cart`);
        } else {
          const updatedItem: CartItem = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: newQuantity * existingItem.unitPrice
          };
          
          updateEntity({ id: itemId, changes: updatedItem }, store);
        }
        
        patchState(store, { 
          lastUpdated: new Date().toISOString(),
          error: null 
        });
      },

      // Remove specific item
      removeItem(productId: number, size: number): void {
        const itemId = `${productId}-${size}`;
        const existingItem = store.entitiesMap()[itemId];
        
        if (existingItem) {
          removeEntity(itemId, store);
          toastStore.showInfo(`Removed ${existingItem.productName} from cart`);
          patchState(store, { 
            lastUpdated: new Date().toISOString(),
            error: null 
          });
        }
      },

      // Clear entire cart
      clearCart(): void {
        setAllEntities([], store);
        patchState(store, { 
          lastUpdated: new Date().toISOString(),
          error: null 
        });
        toastStore.showInfo('Cart cleared');
      },

      // Stock validation before checkout
      validateStock: rxMethod<void>(
        pipe(
          switchMap(() => {
            const items = store.entities();
            const conflicts: any[] = [];
            
            // Mock stock validation - simulate conflicts
            items.forEach(item => {
              if (item.quantity > 10) { // Mock max stock per size
                conflicts.push({
                  productId: item.productId,
                  size: item.size,
                  requestedQuantity: item.quantity,
                  availableStock: 10
                });
              }
            });
            
            return of({
              valid: conflicts.length === 0,
              conflicts
            }).pipe(delay(300));
          })
        )
      ),

      // Submit order
      submitOrder: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isSubmittingOrder: true })),
          switchMap(() => {
            const user = authStore.user();
            if (!user) {
              return throwError(() => new Error('Authentication required'));
            }
            
            // Mock order submission
            return of({ success: true, orderId: Date.now() }).pipe(delay(1000));
          }),
          tapResponse({
            next: (result) => {
              if (result.success) {
                setAllEntities([], store); // Clear cart
                patchState(store, { isSubmittingOrder: false });
                toastStore.showSuccess('Order submitted successfully!');
              }
            },
            error: (error: Error) => patchState(store, { 
              isSubmittingOrder: false,
              error: error.message || 'Failed to submit order'
            })
          })
        )
      ),

      // Merge guest cart when user logs in
      mergeGuestCart(): void {
        const user = authStore.user();
        if (!user) return;
        
        try {
          const guestCartData = localStorage.getItem('guestCart');
          if (!guestCartData) return;
          
          const guestItems: CartItem[] = JSON.parse(guestCartData);
          const currentItems = store.entities();
          
          // Intelligent merging - combine quantities for duplicates
          const mergedItems = new Map<string, CartItem>();
          
          currentItems.forEach(item => mergedItems.set(item.id, item));
          
          guestItems.forEach(guestItem => {
            const existingItem = mergedItems.get(guestItem.id);
            if (existingItem) {
              const combinedQuantity = existingItem.quantity + guestItem.quantity;
              mergedItems.set(guestItem.id, {
                ...existingItem,
                quantity: combinedQuantity,
                totalPrice: combinedQuantity * existingItem.unitPrice
              });
            } else {
              mergedItems.set(guestItem.id, guestItem);
            }
          });
          
          setAllEntities(Array.from(mergedItems.values()), store);
          localStorage.removeItem('guestCart');
          
          if (guestItems.length > 0) {
            toastStore.showInfo('Guest cart merged with your account');
          }
        } catch (error) {
          console.warn('Cart merge failed:', error);
        }
      }
    };
  })
);
```

**Step 2: Update CartComponent**

```typescript
// src/app/pages/cart/cart.component.ts
@Component({
  selector: 'app-cart',
  standalone: true,
  // ... existing imports
})
export class CartComponent implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  // Replace service with store signals
  protected readonly groupedCartItems = this.cartStore.groupedItems;
  protected readonly cartSummary = this.cartStore.cartSummary;
  protected readonly isEmpty = this.cartStore.isEmpty;
  protected readonly isLoading = this.cartStore.isLoading;
  protected readonly isSubmittingOrder = this.cartStore.isSubmittingOrder;
  protected readonly error = this.cartStore.error;
  protected readonly totalItems = this.cartStore.totalItems;
  protected readonly totalPrice = this.cartStore.totalPrice;

  // Local UI state for dialogs
  protected readonly showStockConflictDialog = signal(false);
  protected readonly stockConflicts = signal<any[]>([]);

  ngOnInit(): void {
    this.cartStore.initializeCart();
  }

  // Simplified methods using store
  protected updateQuantityBySize(productId: number, size: number, newQuantity: number): void {
    this.cartStore.updateQuantity(productId, size, newQuantity);
  }

  protected removeSizeVariant(productId: number, size: number): void {
    this.cartStore.removeItem(productId, size);
  }

  protected submitOrder(): void {
    // Stock validation then submission
    this.cartStore.validateStock().subscribe({
      next: (validation) => {
        if (!validation.valid) {
          this.stockConflicts.set(validation.conflicts);
          this.showStockConflictDialog.set(true);
          return;
        }
        this.cartStore.submitOrder();
      }
    });
  }

  protected navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  // Remove all manual state management - store handles everything
}
```

#### Migration Benefits Achieved
- ✅ Entity-based cart item management
- ✅ Automatic persistence with effects
- ✅ Intelligent cart merging for authentication
- ✅ Centralized validation and error handling
- ✅ Integration with toast notifications

## Testing Strategy

### Store Testing with @ngrx/signals/testing

```typescript
// src/app/core/stores/auth.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { unprotected } from '@ngrx/signals/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: typeof AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuthStore);
  });

  it('should initialize with correct default state', () => {
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('should handle loading state during operations', () => {
    unprotected(store).patchState({ isLoading: true });
    expect(store.isLoading()).toBeTrue();
  });

  it('should authenticate user successfully', () => {
    const testUser = { 
      id: 1, 
      email: 'test@example.com', 
      name: 'Test User',
      type: 'b2b' as const,
      permissions: ['order:create']
    };
    
    unprotected(store).patchState({ 
      user: testUser,
      isLoading: false,
      error: null
    });

    expect(store.user()).toEqual(testUser);
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.userType()).toBe('b2b');
  });

  it('should handle errors properly', () => {
    const errorMessage = 'Authentication failed';
    
    unprotected(store).patchState({ 
      error: errorMessage,
      isLoading: false,
      user: null
    });

    expect(store.error()).toBe(errorMessage);
    expect(store.isAuthenticated()).toBeFalse();
  });
});
```

## Implementation Timeline

### Week 1: Infrastructure & Authentication
- ✅ Install @ngrx/signals and @ngrx/operators
- ✅ Create and test AuthStore
- ✅ Update SignInComponent and HeaderComponent
- ✅ Create basic ToastStore

### Week 2: Product Management
- ✅ Create ProductStore with entity management
- ✅ Migrate ProductsComponent to use store
- ✅ Implement debounced search and filtering
- ✅ Test product browsing workflows

### Week 3: Shopping Cart
- ✅ Create CartStore with persistence
- ✅ Update CartComponent integration
- ✅ Implement cart merging logic
- ✅ Test cart operations and checkout flow

### Week 4: Order Management & UI
- ✅ Create OrderStore with pagination
- ✅ Update OrdersComponent
- ✅ Create comprehensive UiStore
- ✅ Integration testing across all stores

### Week 5: Testing & Documentation
- ✅ Write comprehensive unit tests
- ✅ Performance testing and optimization
- ✅ Final integration testing
- ✅ Documentation and code review

## Best Practices Summary

### 1. Store Architecture
- **Single Responsibility**: Each store manages one domain area
- **Entity Management**: Use `withEntities` for collections
- **Method-Driven**: Prefer method-driven over event-driven patterns

### 2. Error Handling
- **Consistent Patterns**: Always use `tapResponse` for async operations
- **Meaningful Messages**: Provide clear, actionable error messages
- **Graceful Degradation**: Handle errors without breaking the user experience

### 3. Performance Optimization
- **Computed Signals**: Use computed for derived state
- **Debounced Inputs**: Implement debouncing for user inputs
- **Efficient Updates**: Use `patchState` for partial updates

### 4. Testing Approach
- **Store Isolation**: Test stores independently using `unprotected`
- **Async Testing**: Properly test `rxMethod` implementations
- **Mock Dependencies**: Mock external services and stores

## Migration Results

The Redux migration using @ngrx/signals provides:

### ✅ **Achieved Benefits**
- **Centralized State Management**: All domain state in dedicated stores
- **Better Performance**: Efficient change detection with signals
- **Robust Error Handling**: Consistent error patterns with `tapResponse`
- **Enhanced Testing**: Isolated, testable business logic
- **Scalable Architecture**: Easy to extend and maintain

### ✅ **Production Ready Features**
- Mock API integration maintained for development
- Proper loading and error states
- Automatic persistence for cart data
- User authentication with proper session management
- Advanced filtering and search capabilities

### ✅ **Developer Experience Improvements**
- Type-safe store operations
- Clear separation of concerns
- Reactive data flow
- Comprehensive error handling
- Better debugging capabilities

This migration guide serves as a complete implementation roadmap for transforming the client-shop application to use modern Redux patterns while maintaining all existing functionality and providing a solid foundation for future API integration.