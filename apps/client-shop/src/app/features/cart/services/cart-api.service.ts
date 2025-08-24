import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';

export interface RemoveItemRequest {
  productId: number;
  size: number;
}

export interface RemoveItemResponse {
  success: boolean;
  message?: string;
}

export interface QuantityUpdateRequest {
  productId: number;
  size: number;
  newQuantity: number;
}

export interface QuantityUpdateResponse {
  success: boolean;
  actualQuantity: number; // The quantity that was actually set (might be less than requested)
  message?: string;
  availableStock?: number;
}

export interface StockValidationRequest {
  items: Array<{
    productId: number;
    size: number;
    requestedQuantity: number;
  }>;
}

export interface StockConflict {
  productId: number;
  size: number;
  requestedQuantity: number;
  availableStock: number;
}

export interface StockValidationResponse {
  valid: boolean;
  conflicts: StockConflict[];
}

export interface OrderSubmissionRequest {
  userId: number;
  items: Array<{
    productId: number;
    productCode: string;
    productName: string;
    size: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  total: number;
}

export interface OrderSubmissionResponse {
  success: boolean;
  orderId: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartApiService {

  /**
   * Remove an item from cart
   * TODO: Replace with real HTTP call to backend API
   */
  removeItem(request: RemoveItemRequest): Observable<RemoveItemResponse> { // eslint-disable-line @typescript-eslint/no-unused-vars
    // TODO: Replace with real HTTP call
    // Example: return this.http.delete<RemoveItemResponse>('/api/cart/remove-item', { body: request });

    return of({
      success: true,
      message: 'Item removed from cart'
    }).pipe(delay(100));
  }

  /**
   * Validate and update quantity for a specific cart item
   * TODO: Replace with real HTTP call to backend API
   */
  updateItemQuantity(request: QuantityUpdateRequest): Observable<QuantityUpdateResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.put<QuantityUpdateResponse>('/api/cart/update-quantity', request);

    // Mock quantity validation logic
    const maxStock = 15; // Mock maximum stock per item/size
    const requestedQuantity = request.newQuantity;

    if (requestedQuantity <= 0) {
      return of({
        success: true,
        actualQuantity: 0,
        message: 'Item removed from cart'
      }).pipe(delay(200));
    }

    if (requestedQuantity > maxStock) {
      return of({
        success: false,
        actualQuantity: maxStock,
        message: `Only ${maxStock} items available in stock`,
        availableStock: maxStock
      }).pipe(delay(200));
    }

    // Simulate occasional stock updates while user is on the page
    const randomStock = Math.floor(Math.random() * 20) + 5; // Random stock between 5-24
    if (requestedQuantity > randomStock && Math.random() < 0.1) { // 10% chance of stock conflict
      return of({
        success: false,
        actualQuantity: randomStock,
        message: `Only ${randomStock} items available in stock`,
        availableStock: randomStock
      }).pipe(delay(200));
    }

    return of({
      success: true,
      actualQuantity: requestedQuantity,
      message: 'Quantity updated successfully'
    }).pipe(delay(200));
  }

  /**
   * Validate stock availability for cart items before checkout
   * TODO: Replace with real HTTP call to backend API
   */
  validateStock(request: StockValidationRequest): Observable<StockValidationResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<StockValidationResponse>('/api/cart/validate-stock', request);

    const conflicts: StockConflict[] = [];

    // Mock stock database - simulate realistic stock levels
    const mockStockDatabase: Record<string, number> = {
      // Product 1 stock levels by size
      '1-39': 15, '1-40': 8, '1-41': 12, '1-42': 5, '1-43': 20, '1-44': 3, '1-45': 18,
      // Product 2 stock levels by size
      '2-39': 25, '2-40': 7, '2-41': 15, '2-42': 22, '2-43': 9, '2-44': 12, '2-45': 6,
      // Product 3 stock levels by size
      '3-39': 4, '3-40': 16, '3-41': 11, '3-42': 8, '3-43': 14, '3-44': 19, '3-45': 13,
      // Add more products as needed...
    };

    // Validate each item in the request
    request.items.forEach(item => {
      const stockKey = `${item.productId}-${item.size}`;
      const availableStock = mockStockDatabase[stockKey] ?? Math.floor(Math.random() * 20) + 1; // Random fallback 1-20

      // Add some random variance to simulate real-time stock changes
      const actualAvailableStock = Math.max(0, availableStock - Math.floor(Math.random() * 3));

      if (item.requestedQuantity > actualAvailableStock) {
        conflicts.push({
          productId: item.productId,
          size: item.size,
          requestedQuantity: item.requestedQuantity,
          availableStock: actualAvailableStock
        });
      }
    });

    // Simulate different response times based on cart size
    const responseDelay = Math.min(300 + (request.items.length * 50), 1000);

    return of({
      valid: conflicts.length === 0,
      conflicts
    }).pipe(delay(responseDelay));
  }

  /**
   * Submit order to backend
   * TODO: Replace with real HTTP call to backend API
   */
  submitOrder(request: OrderSubmissionRequest): Observable<OrderSubmissionResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<OrderSubmissionResponse>('/api/orders', request);

    // Mock order submission logic
    if (!request.userId) {
      return throwError(() => new Error('Authentication required'));
    }

    if (!request.items || request.items.length === 0) {
      return throwError(() => new Error('Cart is empty'));
    }

    // Mock successful order creation
    return of({
      success: true,
      orderId: Date.now(), // Generate mock order ID
      message: 'Order submitted successfully'
    }).pipe(delay(1000));
  }

  /**
   * Reserve cart items for a limited time during checkout
   * TODO: Replace with real HTTP call to backend API
   */
  reserveItems(request: StockValidationRequest): Observable<{ success: boolean; reservationId: string }> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post('/api/cart/reserve', request);

    return of({
      success: true,
      reservationId: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }).pipe(delay(200));
  }

  /**
   * Release reserved items if checkout is cancelled
   * TODO: Replace with real HTTP call to backend API
   */
  releaseReservation(reservationId: string): Observable<{ success: boolean }> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.delete(`/api/cart/reservations/${reservationId}`);

    return of({ success: true }).pipe(delay(100));
  }

  /**
   * Calculate shipping costs for the order
   * TODO: Replace with real HTTP call to backend API
   */
  calculateShipping(request: {
    items: Array<{ productId: number; quantity: number }>;
    destination: string;
    isB2B: boolean;
  }): Observable<{ cost: number; method: string }> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post('/api/shipping/calculate', request);

    // Mock shipping calculation - free for B2B
    return of({
      cost: request.isB2B ? 0 : 9.99,
      method: request.isB2B ? 'B2B Standard' : 'Standard Shipping'
    }).pipe(delay(400));
  }
}
