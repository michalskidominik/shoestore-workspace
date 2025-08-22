import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import {
  Order,
  OrderQueryParams,
  PagedResult,
  OrderStatus,
  User as OrderUser,
  InvoiceInfo
} from '@shoestore/shared-models';
import { AuthService, User as AuthUser } from '../../core/services/auth.service';

// Mock data for demo purposes
const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    userId: 1,
    user: {
      id: 1,
      email: 'business@company.com',
      contactName: 'John Smith',
      phone: '+48 123 456 789',
      shippingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      invoiceInfo: {
        companyName: 'Business Solutions Ltd.',
        vatNumber: 'PL1234567890'
      }
    },
    date: new Date('2024-08-20T10:30:00Z').toISOString(),
    status: 'completed',
    items: [
      {
        shoeId: 1,
        shoeCode: 'AIR-MAX-001',
        shoeName: 'Nike Air Max Classic',
        size: 42,
        quantity: 5,
        unitPrice: 45.99
      },
      {
        shoeId: 2,
        shoeCode: 'AD-UB-002',
        shoeName: 'Adidas Ultraboost 22',
        size: 41,
        quantity: 3,
        unitPrice: 89.99
      }
    ],
    totalAmount: 499.92
  },
  {
    id: 2,
    userId: 1,
    user: {
      id: 1,
      email: 'business@company.com',
      contactName: 'John Smith',
      phone: '+48 123 456 789',
      shippingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      invoiceInfo: {
        companyName: 'Business Solutions Ltd.',
        vatNumber: 'PL1234567890'
      }
    },
    date: new Date('2024-08-18T14:15:00Z').toISOString(),
    status: 'processing',
    items: [
      {
        shoeId: 3,
        shoeCode: 'CON-CTA-003',
        shoeName: 'Converse Chuck Taylor All Star',
        size: 40,
        quantity: 10,
        unitPrice: 52.99
      }
    ],
    totalAmount: 529.90
  },
  {
    id: 3,
    userId: 1,
    user: {
      id: 1,
      email: 'business@company.com',
      contactName: 'John Smith',
      phone: '+48 123 456 789',
      shippingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      invoiceInfo: {
        companyName: 'Business Solutions Ltd.',
        vatNumber: 'PL1234567890'
      }
    },
    date: new Date('2024-08-15T09:45:00Z').toISOString(),
    status: 'placed',
    items: [
      {
        shoeId: 4,
        shoeCode: 'NB-990-004',
        shoeName: 'New Balance 990v5',
        size: 43,
        quantity: 2,
        unitPrice: 124.99
      },
      {
        shoeId: 5,
        shoeCode: 'REE-CL-005',
        shoeName: 'Reebok Classic Leather',
        size: 42,
        quantity: 4,
        unitPrice: 32.99
      }
    ],
    totalAmount: 381.94
  },
  {
    id: 4,
    userId: 1,
    user: {
      id: 1,
      email: 'business@company.com',
      contactName: 'John Smith',
      phone: '+48 123 456 789',
      shippingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Business Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland'
      },
      invoiceInfo: {
        companyName: 'Business Solutions Ltd.',
        vatNumber: 'PL1234567890'
      }
    },
    date: new Date('2024-08-10T16:20:00Z').toISOString(),
    status: 'cancelled',
    items: [
      {
        shoeId: 6,
        shoeCode: 'VAN-SK8-006',
        shoeName: 'Vans Sk8-Hi',
        size: 39,
        quantity: 8,
        unitPrice: 67.99
      }
    ],
    totalAmount: 543.92
  }
];

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/orders';
  private readonly localStorageKey = 'shoestore_orders';

  // Mock data for development
  private mockData = [...MOCK_ORDERS];

  constructor() {
    // Load orders from localStorage on service initialization
    this.loadOrdersFromLocalStorage();
  }

  /**
   * Create a new order from cart items
   */
  createOrder(cartItems: Array<{
    shoeId: number;
    shoeCode: string;
    shoeName: string;
    size: number;
    quantity: number;
    unitPrice: number;
  }>): Observable<Order> {
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('User must be authenticated to create an order'));
    }

    const orderUser = this.convertAuthUserToOrderUser(currentUser);

    const newOrder: Order = {
      id: this.generateOrderId(),
      userId: currentUser.id,
      user: orderUser,
      date: new Date().toISOString(),
      status: 'placed',
      items: cartItems.map(item => ({
        shoeId: item.shoeId,
        shoeCode: item.shoeCode,
        shoeName: item.shoeName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      totalAmount: cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
    };

    // For production, use real API:
    // return this.http.post<Order>(this.apiUrl, newOrder)
    //   .pipe(catchError(this.handleError));

    // For development, store in localStorage:
    this.mockData.unshift(newOrder);
    this.saveOrdersToLocalStorage();

    return of({ ...newOrder }).pipe(delay(300));
  }

  /**
   * Generate a unique order ID
   */
  private generateOrderId(): number {
    const existingIds = this.mockData.map(order => order.id);
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }

  /**
   * Convert AuthService user to Order user format
   * All users are B2B customers and get invoices
   */
  private convertAuthUserToOrderUser(authUser: AuthUser): OrderUser {
    // Extract name from email if needed
    const contactName = authUser.name || authUser.email.split('@')[0];

    // Create default addresses - in a real app these would come from user profile
    const defaultAddress = {
      street: 'Default Street 123',
      city: 'Warsaw',
      postalCode: '00-001',
      country: 'Poland'
    };

    // All users are B2B and get proper invoice information
    const invoiceInfo: InvoiceInfo = {
      companyName: `${contactName} Company`,
      vatNumber: 'PL1234567890' // Default B2B VAT number
    };

    return {
      id: authUser.id,
      email: authUser.email,
      contactName: contactName,
      phone: '+48 123 456 789', // Default phone - would be from user profile
      shippingAddress: defaultAddress,
      billingAddress: defaultAddress,
      invoiceInfo
    };
  }

  /**
   * Save orders to localStorage
   */
  private saveOrdersToLocalStorage(): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.mockData));
    } catch (error) {
      console.warn('Failed to save orders to localStorage:', error);
    }
  }

  /**
   * Load orders from localStorage
   */
  private loadOrdersFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        // Merge with existing mock data, prioritizing localStorage data
        const existingIds = new Set(parsedOrders.map((o: Order) => o.id));
        const filteredMockData = MOCK_ORDERS.filter(order => !existingIds.has(order.id));
        this.mockData = [...parsedOrders, ...filteredMockData];
      }
    } catch (error) {
      console.warn('Failed to load orders from localStorage:', error);
      // Fall back to original mock data
      this.mockData = [...MOCK_ORDERS];
    }
  }

  /**
   * Clear all orders from localStorage (for testing purposes)
   */
  clearLocalStorageOrders(): void {
    localStorage.removeItem(this.localStorageKey);
    this.mockData = [...MOCK_ORDERS];
  }

  /**
   * Get the count of orders stored in localStorage
   */
  getLocalStorageOrderCount(): number {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        return parsedOrders.length;
      }
    } catch (error) {
      console.warn('Failed to get localStorage order count:', error);
    }
    return 0;
  }

  /**
   * Get orders with optional filtering, sorting, and pagination
   */
  getOrders(params: OrderQueryParams = {}): Observable<PagedResult<Order>> {
    // For production, use real API:
    // return this.getOrdersFromApi(params);

    // For development, use mock data:
    return this.getOrdersFromMock(params);
  }

  /**
   * Get single order by ID
   */
  getOrderById(id: number): Observable<Order> {
    // For production, use real API:
    // return this.http.get<Order>(`${this.apiUrl}/${id}`)
    //   .pipe(catchError(this.handleError));

    // For development, use mock data:
    const order = this.mockData.find(o => o.id === id);
    if (!order) {
      return throwError(() => new Error(`Order with ID ${id} not found`));
    }
    return of({ ...order }).pipe(delay(300));
  }

  /**
   * Get orders from real API (for production)
   */
  private getOrdersFromApi(params: OrderQueryParams): Observable<PagedResult<Order>> {
    let httpParams = new HttpParams();

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
      httpParams = httpParams.set('sortDir', params.sortDirection || 'desc');
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
      httpParams = httpParams.set('pageSize', (params.pageSize || 10).toString());
    }

    return this.http.get<PagedResult<Order>>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get orders from mock data (for development)
   */
  private getOrdersFromMock(params: OrderQueryParams): Observable<PagedResult<Order>> {
    let items = [...this.mockData];

    // Filter by status
    if (params.status) {
      items = items.filter(order => order.status === params.status);
    }

    // Filter by search term (order ID or customer email)
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      items = items.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.user?.email.toLowerCase().includes(searchTerm) ||
        order.user?.contactName.toLowerCase().includes(searchTerm)
      );
    }

    // Sort items
    if (params.sortBy) {
      items = items.sort((a, b) => {
        let fieldA: string | number | Date;
        let fieldB: string | number | Date;

        switch (params.sortBy) {
          case 'date':
            fieldA = new Date(a.date);
            fieldB = new Date(b.date);
            break;
          case 'status':
            fieldA = a.status;
            fieldB = b.status;
            break;
          case 'totalAmount':
            fieldA = a.totalAmount;
            fieldB = b.totalAmount;
            break;
          default:
            fieldA = new Date(a.date);
            fieldB = new Date(b.date);
        }

        if (fieldA < fieldB) return params.sortDirection === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return params.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    const result: PagedResult<Order> = {
      items: paged.map(order => ({
        ...order,
        items: order.items.map(item => ({ ...item })),
        user: order.user ? { ...order.user } : undefined
      })),
      total,
      page,
      pageSize
    };

    return of(result).pipe(delay(500)); // Simulate network delay
  }

  /**
   * Get status display label
   */
  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'placed': return 'Placed';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  /**
   * Get status severity for PrimeNG tags
   */
  getStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (status) {
      case 'placed': return 'info';
      case 'processing': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  /**
   * Get available status options for filtering
   */
  getStatusOptions(): Array<{ label: string; value: OrderStatus }> {
    return [
      { label: 'Placed', value: 'placed' },
      { label: 'Processing', value: 'processing' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' }
    ];
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('OrderService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
