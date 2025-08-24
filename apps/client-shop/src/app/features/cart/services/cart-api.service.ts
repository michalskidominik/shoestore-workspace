import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';

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
  tax: number;
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
   * Validate stock availability for cart items before checkout
   * TODO: Replace with real HTTP call to backend API
   */
  validateStock(request: StockValidationRequest): Observable<StockValidationResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<StockValidationResponse>('/api/cart/validate-stock', request);

    const conflicts: StockConflict[] = [];
    
    // Mock stock validation - simulate conflicts for quantities > 10
    request.items.forEach(item => {
      if (item.requestedQuantity > 10) { // Mock max stock per size
        conflicts.push({
          productId: item.productId,
          size: item.size,
          requestedQuantity: item.requestedQuantity,
          availableStock: 10
        });
      }
    });
    
    return of({
      valid: conflicts.length === 0,
      conflicts
    }).pipe(delay(300));
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