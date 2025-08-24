import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { ToastStore } from '../../../shared/stores/toast.store';
import { OrderApiService } from '../services/order-api.service';

export interface OrderItem {
  productId: number;
  productCode: string;
  productName: string;
  size: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface CurrentOrder {
  id: string;
  userId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  items: OrderItem[];
  summary: OrderSummary;
  customerInfo: {
    email: string;
    contactName: string;
    phone: string;
    companyName: string;
    vatNumber: string;
  };
  paymentInfo: {
    method: 'bank_transfer';
    bankDetails: {
      bankName: string;
      accountHolder: string;
      iban: string;
      swift: string;
    };
    reference: string;
    amount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderState {
  currentOrder: CurrentOrder | null;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  lastSubmissionAttempt: string | null;
}

const initialState: OrderState = {
  currentOrder: null,
  isSubmitting: false,
  isLoading: false,
  error: null,
  lastSubmissionAttempt: null
};

export const OrderStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ currentOrder }) => ({
    // Check if there's a valid current order
    hasValidOrder: computed(() => {
      const order = currentOrder();
      return order !== null && order.status !== 'failed';
    }),

    // Check if order is ready for payment instructions
    isOrderReady: computed(() => {
      const order = currentOrder();
      return order !== null && ['pending', 'processing'].includes(order.status);
    }),

    // Get payment reference for display
    paymentReference: computed(() => {
      const order = currentOrder();
      return order?.paymentInfo.reference || null;
    }),

    // Get total amount for payment
    paymentAmount: computed(() => {
      const order = currentOrder();
      return order?.paymentInfo.amount || 0;
    }),

    // Get customer email
    customerEmail: computed(() => {
      const order = currentOrder();
      return order?.customerInfo.email || null;
    })
  })),
  withMethods((store, authStore = inject(AuthStore), toastStore = inject(ToastStore), orderApiService = inject(OrderApiService), router = inject(Router)) => ({

    // Submit order from cart
    submitOrder: rxMethod<{
      items: OrderItem[];
      summary: OrderSummary;
    }>(
      pipe(
        tap(() => patchState(store, { isSubmitting: true, error: null })),
        switchMap((orderData) => {
          const user = authStore.user();
          if (!user) {
            throw new Error('Authentication required');
          }

          const submissionRequest = {
            userId: user.id,
            items: orderData.items,
            summary: orderData.summary,
            customerInfo: {
              email: user.email,
              contactName: user.contactName,
              phone: user.phone,
              companyName: user.invoiceInfo.companyName,
              vatNumber: user.invoiceInfo.vatNumber
            }
          };

          return orderApiService.submitOrder(submissionRequest);
        }),
        tapResponse({
          next: (order: CurrentOrder) => {
            patchState(store, {
              currentOrder: order,
              isSubmitting: false,
              lastSubmissionAttempt: new Date().toISOString()
            });

            toastStore.showSuccess('Order submitted successfully!');

            // Navigate to payment instructions
            router.navigate(['/payment-instructions']);
          },
          error: (error: Error) => {
            patchState(store, {
              isSubmitting: false,
              error: error.message || 'Failed to submit order',
              lastSubmissionAttempt: new Date().toISOString()
            });

            toastStore.showError('Failed to submit order. Please try again.');
          }
        })
      )
    ),

    // Load order details (used by payment instructions and guard)
    loadOrder: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((orderId) => orderApiService.getOrderDetails(orderId)),
        tapResponse({
          next: (order: CurrentOrder) => {
            patchState(store, {
              currentOrder: order,
              isLoading: false
            });
          },
          error: (error: Error) => {
            patchState(store, {
              isLoading: false,
              error: error.message || 'Order not found',
              currentOrder: null
            });
          }
        })
      )
    ),

    // Clear current order (logout, manual clear)
    clearOrder(): void {
      patchState(store, {
        currentOrder: null,
        error: null,
        lastSubmissionAttempt: null
      });
    },

    // Update order status (when payment is processed, etc.)
    updateOrderStatus: rxMethod<{
      orderId: string;
      status: CurrentOrder['status'];
    }>(
      pipe(
        switchMap(({ orderId, status }) => orderApiService.updateOrderStatus(orderId, status)),
        tapResponse({
          next: (updatedOrder: CurrentOrder) => {
            patchState(store, { currentOrder: updatedOrder });

            if (status === 'completed') {
              toastStore.showSuccess('Order completed successfully!');
            } else if (status === 'processing') {
              toastStore.showInfo('Order is now being processed');
            }
          },
          error: (error: Error) => {
            patchState(store, { error: error.message });
            toastStore.showError('Failed to update order status');
          }
        })
      )
    ),

    // Get order by ID (for guard validation)
    async validateOrderAccess(orderId: string): Promise<boolean> {
      try {
        const order = await orderApiService.getOrderDetails(orderId).toPromise();

        if (!order) {
          return false;
        }

        // Check if user has access to this order
        const user = authStore.user();
        if (!user || order.userId !== user.id) {
          return false;
        }

        // Check if order is in valid state for payment instructions
        if (!['pending', 'processing', 'completed'].includes(order.status)) {
          return false;
        }

        // Update store with validated order
        patchState(store, { currentOrder: order });
        return true;
      } catch {
        return false;
      }
    }
  }))
);
