import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, timer, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed } from '@angular/core';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface ToastState {
  maxToasts: number;
}

const initialState: ToastState = {
  maxToasts: 5 // Limit the number of concurrent toasts
};

export const ToastStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<ToastMessage>(),
  withComputed(({ entities }) => ({
    // Get toasts sorted by timestamp (newest first)
    currentToasts: computed(() => 
      entities().sort((a, b) => b.timestamp - a.timestamp)
    ),
    
    // Count toasts by type for analytics
    toastCounts: computed(() => {
      const toasts = entities();
      return {
        total: toasts.length,
        success: toasts.filter(t => t.type === 'success').length,
        error: toasts.filter(t => t.type === 'error').length,
        warning: toasts.filter(t => t.type === 'warning').length,
        info: toasts.filter(t => t.type === 'info').length
      };
    })
  })),
  withMethods((store) => {
    // Generate unique ID for toast
    const generateId = (): string => {
      return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    return {
      // Add toast with automatic cleanup
      addToast: rxMethod<Omit<ToastMessage, 'id' | 'timestamp'>>(
        pipe(
          tap((config) => {
            const toast: ToastMessage = {
              ...config,
              id: generateId(),
              timestamp: Date.now()
            };

            // Enforce max toast limit by removing oldest if needed
            const currentToasts = store.entities();
            if (currentToasts.length >= store.maxToasts()) {
              const oldestToast = currentToasts
                .sort((a, b) => a.timestamp - b.timestamp)[0];
              if (oldestToast) {
                patchState(store, removeEntity(oldestToast.id));
              }
            }

            // Add the new toast
            patchState(store, addEntity(toast));

            // Auto-dismiss after duration if specified
            if (config.duration && config.duration > 0) {
              timer(config.duration).subscribe(() => {
                patchState(store, removeEntity(toast.id));
              });
            }
          })
        )
      ),

      // Show success toast
      showSuccess(message: string, duration = 5000, action?: { label: string; handler: () => void }): void {
        this.addToast({
          message,
          type: 'success',
          duration,
          action
        });
      },

      // Show error toast
      showError(message: string, duration = 7000, action?: { label: string; handler: () => void }): void {
        this.addToast({
          message,
          type: 'error',
          duration,
          action
        });
      },

      // Show warning toast
      showWarning(message: string, duration = 6000, action?: { label: string; handler: () => void }): void {
        this.addToast({
          message,
          type: 'warning',
          duration,
          action
        });
      },

      // Show info toast
      showInfo(message: string, duration = 5000, action?: { label: string; handler: () => void }): void {
        this.addToast({
          message,
          type: 'info',
          duration,
          action
        });
      },

      // Dismiss specific toast
      dismissToast(id: string): void {
        patchState(store, removeEntity(id));
      },

      // Dismiss all toasts
      dismissAll(): void {
        const allToasts = store.entities();
        allToasts.forEach(toast => patchState(store, removeEntity(toast.id)));
      },

      // Dismiss toasts by type
      dismissByType(type: ToastMessage['type']): void {
        const toastsToRemove = store.entities().filter(toast => toast.type === type);
        toastsToRemove.forEach(toast => patchState(store, removeEntity(toast.id)));
      },

      // Update max toasts setting
      setMaxToasts(maxToasts: number): void {
        patchState(store, { maxToasts });
        
        // Trim existing toasts if needed
        const currentToasts = store.entities();
        if (currentToasts.length > maxToasts) {
          const toastsToRemove = currentToasts
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, currentToasts.length - maxToasts);
          
          toastsToRemove.forEach(toast => patchState(store, removeEntity(toast.id)));
        }
      },

      // Clear old toasts (older than specified time)
      clearOldToasts(olderThanMs = 30000): void { // 30 seconds default
        const cutoffTime = Date.now() - olderThanMs;
        const oldToasts = store.entities().filter(toast => toast.timestamp < cutoffTime);
        oldToasts.forEach(toast => patchState(store, removeEntity(toast.id)));
      }
    };
  })
);