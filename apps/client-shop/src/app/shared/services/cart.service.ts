import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Observable, of, fromEvent } from 'rxjs';
import { delay, filter } from 'rxjs/operators';
import { AuthStore } from '../../core/stores/auth.store';
import { OrderService } from './order.service';

export interface CartItem {
  productId: number;
  productCode: string;
  productName: string;
  size: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartSummary {
  totalItems: number;
  totalPrice: number;
  items: CartItem[];
}

export interface AddToCartRequest {
  productId: number;
  productCode: string;
  productName: string;
  items: { size: number; quantity: number; unitPrice: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly authStore = inject(AuthStore);
  private readonly orderService = inject(OrderService);

  // Storage keys
  private readonly GUEST_CART_KEY = 'guestCart';
  private readonly USER_CART_PREFIX = 'userCart_';

  // Private signals for state management
  private readonly cartItems = signal<CartItem[]>([]);
  private readonly loading = signal<boolean>(false);

  constructor() {
    // Load cart on initialization
    this.loadCartFromStorage();

    // Set up cross-tab synchronization
    this.setupCrossTabSync();

    // Set up persistence when cart changes
    this.setupCartPersistence();

    // Handle user authentication changes
    this.setupAuthenticationHandler();
  }

  // Public computed signals
  readonly items = computed(() => this.cartItems());
  readonly totalItems = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  readonly totalPrice = computed(() =>
    this.cartItems().reduce((total, item) => total + item.totalPrice, 0)
  );
  readonly isEmpty = computed(() => this.cartItems().length === 0);
  readonly isLoading = computed(() => this.loading());

  // Public computed summary
  readonly summary = computed<CartSummary>(() => ({
    totalItems: this.totalItems(),
    totalPrice: this.totalPrice(),
    items: this.items()
  }));

  /**
   * Add items to cart from quick order
   */
  addToCart(request: AddToCartRequest): Observable<CartSummary> {
    // Process immediately for now (can add real API call later)
    const result = this.processAddToCart(request);
    return of(result).pipe(delay(500)); // Simulate network delay
  }

  /**
   * Process the add to cart request synchronously
   */
  private processAddToCart(request: AddToCartRequest): CartSummary {
    this.loading.set(true);

    const currentItems = [...this.cartItems()];

    request.items.forEach(requestItem => {
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === request.productId && item.size === requestItem.size
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = currentItems[existingItemIndex];
        const newQuantity = existingItem.quantity + requestItem.quantity;
        currentItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: newQuantity * existingItem.unitPrice
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          productId: request.productId,
          productCode: request.productCode,
          productName: request.productName,
          size: requestItem.size,
          quantity: requestItem.quantity,
          unitPrice: requestItem.unitPrice,
          totalPrice: requestItem.quantity * requestItem.unitPrice
        };
        currentItems.push(newItem);
      }
    });

    this.cartItems.set(currentItems);
    this.persistCartToStorage();
    this.loading.set(false);
    return this.summary();
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: number, size: number): void {
    const currentItems = this.cartItems();
    const filteredItems = currentItems.filter(
      item => !(item.productId === productId && item.size === size)
    );
    this.cartItems.set(filteredItems);
    this.persistCartToStorage();
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: number, size: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, size);
      return;
    }

    const currentItems = [...this.cartItems()];
    const itemIndex = currentItems.findIndex(
      item => item.productId === productId && item.size === size
    );

    if (itemIndex >= 0) {
      const item = currentItems[itemIndex];
      currentItems[itemIndex] = {
        ...item,
        quantity,
        totalPrice: quantity * item.unitPrice
      };
      this.cartItems.set(currentItems);
      this.persistCartToStorage();
    }
  }

  /**
   * Clear all items from cart
   */
  clearCart(): void {
    this.cartItems.set([]);
    this.persistCartToStorage();
  }

  /**
   * Get cart items as Observable (for compatibility)
   */
  getCartItems(): Observable<CartItem[]> {
    return of(this.cartItems());
  }

  /**
   * Get cart summary as Observable (for compatibility)
   */
  getCartSummary(): Observable<CartSummary> {
    return of(this.summary());
  }

  /**
   * Load cart from localStorage based on authentication state
   */
  private loadCartFromStorage(): void {
    try {
      const user = this.authStore.user();
      const storageKey = user ? `${this.USER_CART_PREFIX}${user.id}` : this.GUEST_CART_KEY;
      const savedCart = localStorage.getItem(storageKey);

      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        this.cartItems.set(cartItems);
      }
    } catch (error) {
      console.warn('Failed to load cart from storage:', error);
    }
  }

  /**
   * Persist cart to localStorage
   */
  private persistCartToStorage(): void {
    try {
      const user = this.authStore.user();
      const storageKey = user ? `${this.USER_CART_PREFIX}${user.id}` : this.GUEST_CART_KEY;
      const cartData = JSON.stringify(this.cartItems());

      localStorage.setItem(storageKey, cartData);

      // Trigger storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: cartData,
        storageArea: localStorage
      }));
    } catch (error) {
      console.warn('Failed to persist cart to storage:', error);
    }
  }

  /**
   * Set up cross-tab synchronization using storage events
   */
  private setupCrossTabSync(): void {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter(event => event.key?.startsWith(this.USER_CART_PREFIX) || event.key === this.GUEST_CART_KEY)
      )
      .subscribe(event => {
        const user = this.authStore.user();
        const expectedKey = user ? `${this.USER_CART_PREFIX}${user.id}` : this.GUEST_CART_KEY;

        if (event.key === expectedKey && event.newValue) {
          try {
            const cartItems = JSON.parse(event.newValue);
            this.cartItems.set(cartItems);
          } catch (error) {
            console.warn('Failed to sync cart from storage event:', error);
          }
        }
      });
  }

  /**
   * Set up cart persistence when cart changes
   */
  private setupCartPersistence(): void {
    // Use effect to persist cart whenever it changes
    effect(() => {
      // Access the cart items to register dependency
      this.cartItems();
      // Persist to storage (this will run after the signal update)
      // Note: We don't call persistCartToStorage here directly to avoid infinite loops
      // The persistence is handled in individual methods that modify the cart
    });
  }

  /**
   * Handle authentication state changes for cart merging
   */
  private setupAuthenticationHandler(): void {
    effect(() => {
      const user = this.authStore.user();
      if (user) {
        this.mergeGuestCartWithUserCart(user.id);
      }
    });
  }

  /**
   * Merge guest cart with user cart when user logs in
   */
  private mergeGuestCartWithUserCart(userId: number): void {
    try {
      const guestCartData = localStorage.getItem(this.GUEST_CART_KEY);
      const userCartKey = `${this.USER_CART_PREFIX}${userId}`;
      const userCartData = localStorage.getItem(userCartKey);

      if (!guestCartData) return; // No guest cart to merge

      const guestItems: CartItem[] = JSON.parse(guestCartData);
      if (guestItems.length === 0) return; // Empty guest cart

      let userItems: CartItem[] = [];
      if (userCartData) {
        userItems = JSON.parse(userCartData);
      }

      // Merge logic: add guest items to user cart, combining quantities for same items
      const mergedItems = [...userItems];

      guestItems.forEach(guestItem => {
        const existingItemIndex = mergedItems.findIndex(
          item => item.productId === guestItem.productId && item.size === guestItem.size
        );

        if (existingItemIndex >= 0) {
          // Item exists, combine quantities
          const existingItem = mergedItems[existingItemIndex];
          const newQuantity = existingItem.quantity + guestItem.quantity;
          mergedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: newQuantity * existingItem.unitPrice
          };
        } else {
          // New item, add to cart
          mergedItems.push(guestItem);
        }
      });

      // Update cart state and storage
      this.cartItems.set(mergedItems);
      localStorage.setItem(userCartKey, JSON.stringify(mergedItems));

      // Clear guest cart
      localStorage.removeItem(this.GUEST_CART_KEY);

    } catch (error) {
      console.warn('Failed to merge guest cart with user cart:', error);
    }
  }

  /**
   * Validate cart items against stock levels (mock implementation)
   */
  validateCartStock(): Promise<{ valid: boolean; conflicts: Array<{ productId: number; size: number; requestedQuantity: number; availableStock: number }> }> {
    // Mock stock validation - in real app this would call API
    return new Promise(resolve => {
      setTimeout(() => {
        const conflicts: Array<{ productId: number; size: number; requestedQuantity: number; availableStock: number }> = [];

        // Simulate some stock conflicts for testing
        this.cartItems().forEach(item => {
          const mockStock = Math.floor(Math.random() * 20) + 5; // Random stock between 5-25
          if (item.quantity > mockStock && Math.random() < 0.1) { // 10% chance of conflict
            conflicts.push({
              productId: item.productId,
              size: item.size,
              requestedQuantity: item.quantity,
              availableStock: mockStock
            });
          }
        });

        resolve({
          valid: conflicts.length === 0,
          conflicts
        });
      }, 500);
    });
  }

  /**
   * Submit order and create it using OrderService
   */
  submitOrder(): Observable<{ success: boolean; orderId?: number; error?: string }> {
    this.loading.set(true);

    // First validate stock
    return new Observable(observer => {
      this.validateCartStock().then(stockValidation => {
        if (!stockValidation.valid) {
          this.loading.set(false);
          observer.next({
            success: false,
            error: `Stock conflicts detected for ${stockValidation.conflicts.length} items`
          });
          observer.complete();
          return;
        }

        // Convert cart items to order format
        const cartItemsForOrder = this.cartItems().map(item => ({
          shoeId: item.productId,
          shoeCode: item.productCode,
          shoeName: item.productName,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }));

        // Create order using OrderService
        this.orderService.createOrder(cartItemsForOrder).subscribe({
          next: (order) => {
            // Clear cart on successful order
            this.clearCart();
            this.loading.set(false);

            observer.next({
              success: true,
              orderId: order.id
            });
            observer.complete();
          },
          error: () => {
            this.loading.set(false);
            observer.next({
              success: false,
              error: 'Order creation failed'
            });
            observer.complete();
          }
        });
      }).catch(() => {
        this.loading.set(false);
        observer.next({
          success: false,
          error: 'Stock validation failed'
        });
        observer.complete();
      });
    });
  }
}
