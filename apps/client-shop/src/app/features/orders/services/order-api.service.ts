import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { CurrentOrder, OrderItem, OrderSummary } from '../stores/order.store';

export interface OrderSubmissionRequest {
  userId: number;
  items: OrderItem[];
  summary: OrderSummary;
  customerInfo: {
    email: string;
    contactName: string;
    phone: string;
    companyName: string;
    vatNumber: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderApiService {

  /**
   * Submit order to backend and get complete order details
   * TODO: Replace with real HTTP call to backend API
   */
  submitOrder(request: OrderSubmissionRequest): Observable<CurrentOrder> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<CurrentOrder>('/api/orders/submit', request);

    // Mock order submission logic
    if (!request.userId) {
      return throwError(() => new Error('Authentication required'));
    }

    if (!request.items || request.items.length === 0) {
      return throwError(() => new Error('Cart is empty'));
    }

    // Validate order items
    if (request.summary.total <= 0) {
      return throwError(() => new Error('Invalid order total'));
    }

    // Generate mock order ID and reference
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const paymentReference = `PAY-${orderId}`;

    // Mock complete order response with all payment details
    const order: CurrentOrder = {
      id: orderId,
      userId: request.userId,
      status: 'pending', // Initial status
      items: request.items.map(item => ({ ...item })),
      summary: { ...request.summary },
      customerInfo: { ...request.customerInfo },
      paymentInfo: {
        method: 'bank_transfer',
        bankDetails: {
          bankName: 'PKO Bank Polski',
          accountHolder: 'MANDRAIME Sp. z o.o.',
          iban: 'PL61 1020 1026 0000 1702 0270 0001',
          swift: 'BPKOPLPW'
        },
        reference: paymentReference,
        amount: request.summary.total
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store order in localStorage for demo persistence
    this.storeOrderInLocalStorage(order);

    return of(order).pipe(delay(1000)); // Simulate network delay
  }

  /**
   * Get order details by ID
   * TODO: Replace with real HTTP call to backend API
   */
  getOrderDetails(orderId: string): Observable<CurrentOrder> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.get<CurrentOrder>(`/api/orders/${orderId}`);

    try {
      // First try to get from localStorage
      const storedOrder = this.getOrderFromLocalStorage(orderId);
      if (storedOrder) {
        return of(storedOrder).pipe(delay(300));
      }

      // If not found, generate a mock order for demo
      const mockOrder: CurrentOrder = {
        id: orderId,
        userId: 1, // Mock user ID
        status: 'pending',
        items: [
          {
            productId: 1,
            productCode: 'DEMO-001',
            productName: 'Demo Product',
            size: 42,
            quantity: 1,
            unitPrice: 99.99,
            totalPrice: 99.99
          }
        ],
        summary: {
          subtotal: 99.99,
          tax: 8.00,
          shipping: 0,
          total: 107.99,
          itemCount: 1
        },
        customerInfo: {
          email: 'demo@company.com',
          contactName: 'Demo User',
          phone: '+48 123 456 789',
          companyName: 'Demo Company',
          vatNumber: 'PL1234567890'
        },
        paymentInfo: {
          method: 'bank_transfer',
          bankDetails: {
            bankName: 'PKO Bank Polski',
            accountHolder: 'MANDRAIME Sp. z o.o.',
            iban: 'PL61 1020 1026 0000 1702 0270 0001',
            swift: 'BPKOPLPW'
          },
          reference: `PAY-${orderId}`,
          amount: 107.99
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return of(mockOrder).pipe(delay(300));
    } catch (error) {
      return throwError(() => new Error('Order not found'));
    }
  }

  /**
   * Update order status
   * TODO: Replace with real HTTP call to backend API
   */
  updateOrderStatus(orderId: string, status: CurrentOrder['status']): Observable<CurrentOrder> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.patch<CurrentOrder>(`/api/orders/${orderId}/status`, { status });

    try {
      const storedOrder = this.getOrderFromLocalStorage(orderId);
      if (!storedOrder) {
        return throwError(() => new Error('Order not found'));
      }

      const updatedOrder: CurrentOrder = {
        ...storedOrder,
        status,
        updatedAt: new Date().toISOString()
      };

      this.storeOrderInLocalStorage(updatedOrder);
      return of(updatedOrder).pipe(delay(200));
    } catch (error) {
      return throwError(() => new Error('Failed to update order status'));
    }
  }

  /**
   * Check if order exists and user has access
   * TODO: Replace with real HTTP call to backend API
   */
  validateOrderAccess(orderId: string, userId: number): Observable<boolean> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.get<boolean>(`/api/orders/${orderId}/validate?userId=${userId}`);

    try {
      const storedOrder = this.getOrderFromLocalStorage(orderId);
      if (!storedOrder) {
        return of(false).pipe(delay(200));
      }

      // Check if user has access to this order
      const hasAccess = storedOrder.userId === userId;
      return of(hasAccess).pipe(delay(200));
    } catch (error) {
      return of(false).pipe(delay(200));
    }
  }

  /**
   * Get all orders for user (used by orders list page)
   * TODO: Replace with real HTTP call to backend API
   */
  getUserOrders(userId: number): Observable<CurrentOrder[]> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.get<CurrentOrder[]>(`/api/orders/user/${userId}`);

    try {
      const allOrders = this.getAllOrdersFromLocalStorage();
      const userOrders = allOrders.filter(order => order.userId === userId);
      return of(userOrders).pipe(delay(300));
    } catch (error) {
      return of([]).pipe(delay(300));
    }
  }

  /**
   * Store order in localStorage for demo persistence
   * In real app, this would be handled by backend
   */
  private storeOrderInLocalStorage(order: CurrentOrder): void {
    try {
      const existingOrders = this.getAllOrdersFromLocalStorage();
      const updatedOrders = existingOrders.filter(o => o.id !== order.id);
      updatedOrders.unshift(order);
      
      localStorage.setItem('shoestore_current_orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.warn('Failed to store order in localStorage:', error);
    }
  }

  /**
   * Get order from localStorage
   */
  private getOrderFromLocalStorage(orderId: string): CurrentOrder | null {
    try {
      const allOrders = this.getAllOrdersFromLocalStorage();
      return allOrders.find(order => order.id === orderId) || null;
    } catch (error) {
      console.warn('Failed to get order from localStorage:', error);
      return null;
    }
  }

  /**
   * Get all orders from localStorage
   */
  private getAllOrdersFromLocalStorage(): CurrentOrder[] {
    try {
      const stored = localStorage.getItem('shoestore_current_orders');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to get orders from localStorage:', error);
      return [];
    }
  }

  /**
   * Clear all orders from localStorage (for testing/demo)
   */
  clearAllOrders(): void {
    localStorage.removeItem('shoestore_current_orders');
  }

  /**
   * Generate mock stock reservation for checkout flow
   * TODO: Replace with real HTTP call to backend API
   */
  reserveStock(items: OrderItem[]): Observable<{ reservationId: string; expiresAt: string }> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post('/api/orders/reserve-stock', { items });

    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    return of({
      reservationId,
      expiresAt
    }).pipe(delay(400));
  }

  /**
   * Release stock reservation
   * TODO: Replace with real HTTP call to backend API
   */
  releaseStockReservation(reservationId: string): Observable<{ success: boolean }> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.delete(`/api/orders/reservations/${reservationId}`);

    return of({ success: true }).pipe(delay(200));
  }
}