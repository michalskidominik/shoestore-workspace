import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, addEntity, updateEntity, removeEntity, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, effect, inject } from '@angular/core';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastStore } from '../../shared/stores/toast.store';
import { CartApiService } from './services/cart-api.service';

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
  withMethods((store, authStore = inject(AuthStore), toastStore = inject(ToastStore), cartApiService = inject(CartApiService)) => {
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
              return of(items);
            } catch {
              return of([]);
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
            const validationRequest = {
              items: items.map(item => ({
                productId: item.productId,
                size: item.size,
                requestedQuantity: item.quantity
              }))
            };
            
            return cartApiService.validateStock(validationRequest);
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
              throw new Error('Authentication required');
            }
            
            const items = store.entities();
            const summary = store.cartSummary();
            
            const orderRequest = {
              userId: user.id,
              items: items.map(item => ({
                productId: item.productId,
                productCode: item.productCode,
                productName: item.productName,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              })),
              subtotal: summary.subtotal,
              tax: summary.tax,
              total: summary.total
            };
            
            return cartApiService.submitOrder(orderRequest);
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