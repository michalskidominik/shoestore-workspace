import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { OrderStore } from '../../features/orders/stores/order.store';
import { AuthStore } from '../stores/auth.store';

/**
 * Guard to protect payment-instructions route
 * Only allows access when user has a valid current order from the ordering process
 */
export const orderGuard: CanActivateFn = async (route, state) => {
  const orderStore = inject(OrderStore);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authStore.isAuthenticated()) {
    router.navigate(['/sign-in'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if there's a valid current order in the store
  if (orderStore.hasValidOrder()) {
    return true;
  }

  // Try to extract order ID from route or query params if available
  const orderId = route.queryParams?.['orderId'] || route.params?.['orderId'];

  if (orderId) {
    try {
      // Validate order access through the store
      const hasAccess = await orderStore.validateOrderAccess(orderId);

      if (hasAccess) {
        return true;
      }
    } catch (error) {
      console.warn('Order validation failed:', error);
    }
  }

  // If no valid order found, redirect to cart with message
  router.navigate(['/cart'], {
    queryParams: {
      message: 'Please complete your order to access payment instructions'
    }
  });

  return false;
};
