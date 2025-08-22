import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

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
  // Private signals for state management
  private readonly cartItems = signal<CartItem[]>([]);
  private readonly loading = signal<boolean>(false);

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
    }
  }

  /**
   * Clear all items from cart
   */
  clearCart(): void {
    this.cartItems.set([]);
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
}
