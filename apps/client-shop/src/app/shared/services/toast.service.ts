import { Injectable, signal, computed } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toasts = signal<ToastMessage[]>([]);
  private readonly toastSubject = new Subject<ToastMessage>();

  readonly currentToasts = computed(() => this.toasts());

  /**
   * Show a success toast message
   */
  showSuccess(message: string, duration = 5000, action?: { label: string; handler: () => void }): void {
    this.showToast({
      message,
      type: 'success',
      duration,
      action
    });
  }

  /**
   * Show an error toast message
   */
  showError(message: string, duration = 7000, action?: { label: string; handler: () => void }): void {
    this.showToast({
      message,
      type: 'error',
      duration,
      action
    });
  }

  /**
   * Show a warning toast message
   */
  showWarning(message: string, duration = 6000, action?: { label: string; handler: () => void }): void {
    this.showToast({
      message,
      type: 'warning',
      duration,
      action
    });
  }

  /**
   * Show an info toast message
   */
  showInfo(message: string, duration = 5000, action?: { label: string; handler: () => void }): void {
    this.showToast({
      message,
      type: 'info',
      duration,
      action
    });
  }

  /**
   * Show a custom toast message
   */
  private showToast(config: Omit<ToastMessage, 'id'>): void {
    const toast: ToastMessage = {
      ...config,
      id: this.generateId()
    };

    // Add to current toasts
    const currentToasts = this.toasts();
    this.toasts.set([...currentToasts, toast]);

    // Auto-dismiss after duration
    if (config.duration && config.duration > 0) {
      timer(config.duration).subscribe(() => {
        this.dismissToast(toast.id);
      });
    }

    // Emit for any subscribers
    this.toastSubject.next(toast);
  }

  /**
   * Dismiss a specific toast
   */
  dismissToast(id: string): void {
    const currentToasts = this.toasts();
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toasts.set(filteredToasts);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts.set([]);
  }

  /**
   * Get toast stream as Observable
   */
  getToastStream(): Observable<ToastMessage> {
    return this.toastSubject.asObservable();
  }

  /**
   * Generate unique ID for toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
