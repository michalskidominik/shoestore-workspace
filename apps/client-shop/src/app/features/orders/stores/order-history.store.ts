import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { ToastStore } from '../../../shared/stores/toast.store';
import { Order, OrderQueryParams, PagedResult, OrderStatus } from '@shoestore/shared-models';
import { OrderHistoryApiService } from '../services/order-history-api.service';

interface OrderHistoryState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  queryParams: OrderQueryParams;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

const initialState: OrderHistoryState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  queryParams: {
    page: 1,
    pageSize: 10,
    sortBy: 'date',
    sortDirection: 'desc'
  },
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10
  }
};

export const OrderHistoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ orders, currentOrder, pagination }) => ({
    // Check if we have any orders
    hasOrders: computed(() => orders().length > 0),

    // Get total pages for pagination
    totalPages: computed(() => {
      const p = pagination();
      return Math.ceil(p.total / p.pageSize);
    }),

    // Check if we're on the first page
    isFirstPage: computed(() => pagination().page === 1),

    // Check if we're on the last page
    isLastPage: computed(() => {
      const p = pagination();
      return p.page >= Math.ceil(p.total / p.pageSize);
    }),

    // Get current order status severity for PrimeNG tags
    currentOrderStatusSeverity: computed(() => {
      const order = currentOrder();
      if (!order) return 'secondary';
      return getStatusSeverity(order.status);
    }),

    // Get current order status label
    currentOrderStatusLabel: computed(() => {
      const order = currentOrder();
      if (!order) return '';
      return getStatusLabel(order.status);
    })
  })),
  withMethods((store, orderHistoryApiService = inject(OrderHistoryApiService), toastStore = inject(ToastStore)) => ({

    // Load orders with filtering, sorting, and pagination
    loadOrders: rxMethod<OrderQueryParams | void>(
      pipe(
        tap((params) => {
          if (params) {
            patchState(store, { queryParams: { ...store.queryParams(), ...params } });
          }
          patchState(store, { isLoading: true, error: null });
        }),
        switchMap(() => orderHistoryApiService.getOrders(store.queryParams())),
        tapResponse({
          next: (result: PagedResult<Order>) => {
            patchState(store, {
              orders: result.items,
              pagination: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
              },
              isLoading: false
            });
          },
          error: (error: Error) => {
            patchState(store, {
              isLoading: false,
              error: error.message || 'Failed to load orders'
            });
            toastStore.showError('Failed to load orders. Please try again.');
          }
        })
      )
    ),

    // Load single order by ID
    loadOrderById: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { isLoadingDetail: true, error: null, currentOrder: null })),
        switchMap((id) => orderHistoryApiService.getOrderById(id)),
        tapResponse({
          next: (order: Order) => {
            patchState(store, {
              currentOrder: order,
              isLoadingDetail: false
            });
          },
          error: (error: Error) => {
            patchState(store, {
              isLoadingDetail: false,
              error: error.message || 'Order not found',
              currentOrder: null
            });
            toastStore.showError('Failed to load order details.');
          }
        })
      )
    ),

    // Update query parameters and reload
    updateQueryParams(params: Partial<OrderQueryParams>): void {
      const newParams = { ...store.queryParams(), ...params };
      patchState(store, { queryParams: newParams });
      this.loadOrders(); // Call without parameters to use the updated state
    },

    // Go to specific page
    goToPage(page: number): void {
      this.updateQueryParams({ page });
    },

    // Change page size
    changePageSize(pageSize: number): void {
      this.updateQueryParams({ page: 1, pageSize });
    },

    // Search orders
    searchOrders(search: string): void {
      this.updateQueryParams({ search: search || undefined, page: 1 });
    },

    // Filter by status
    filterByStatus(status: OrderStatus | undefined): void {
      this.updateQueryParams({ status, page: 1 });
    },

    // Sort orders
    sortOrders(sortBy: 'id' | 'date' | 'status' | 'totalAmount', sortDirection: 'asc' | 'desc' = 'desc'): void {
      this.updateQueryParams({ sortBy, sortDirection });
    },

    // Clear current order (for detail view)
    clearCurrentOrder(): void {
      patchState(store, { currentOrder: null, error: null });
    },

    // Get status options for filtering
    getStatusOptions(): Array<{ label: string; value: OrderStatus }> {
      return [
        { label: 'Placed', value: 'placed' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ];
    },

    // Get status label for display
    getStatusLabel(status: OrderStatus): string {
      return getStatusLabel(status);
    },

    // Get status severity for PrimeNG tags
    getStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
      return getStatusSeverity(status);
    }
  }))
);

// Helper functions for status display
function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'placed': return 'Placed';
    case 'processing': return 'Processing';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function getStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
  switch (status) {
    case 'placed': return 'info';
    case 'processing': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'danger';
    default: return 'secondary';
  }
}
