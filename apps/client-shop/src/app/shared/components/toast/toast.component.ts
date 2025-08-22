import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      @for (toast of toasts; track toast.id) {
        <div
          class="toast-container pointer-events-auto transform transition-all duration-300 ease-in-out"
          [ngClass]="{
            'translate-x-0 opacity-100': true,
            'bg-green-50 border-green-200': toast.type === 'success',
            'bg-red-50 border-red-200': toast.type === 'error',
            'bg-yellow-50 border-yellow-200': toast.type === 'warning',
            'bg-blue-50 border-blue-200': toast.type === 'info'
          }"
          [attr.role]="'alert'"
          [attr.aria-live]="'polite'">

          <div class="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-lg max-w-sm">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              @switch (toast.type) {
                @case ('success') {
                  <i class="pi pi-check-circle text-green-600 text-lg" aria-hidden="true"></i>
                }
                @case ('error') {
                  <i class="pi pi-times-circle text-red-600 text-lg" aria-hidden="true"></i>
                }
                @case ('warning') {
                  <i class="pi pi-exclamation-triangle text-yellow-600 text-lg" aria-hidden="true"></i>
                }
                @case ('info') {
                  <i class="pi pi-info-circle text-blue-600 text-lg" aria-hidden="true"></i>
                }
              }
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 break-words">
                {{ toast.message }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- Action Button -->
              @if (toast.action) {
                <p-button
                  [label]="toast.action.label"
                  size="small"
                  [text]="true"
                  severity="secondary"
                  styleClass="!text-xs !py-1 !px-2 !font-medium"
                  [ngClass]="{
                    '!text-green-700 hover:!text-green-800': toast.type === 'success',
                    '!text-red-700 hover:!text-red-800': toast.type === 'error',
                    '!text-yellow-700 hover:!text-yellow-800': toast.type === 'warning',
                    '!text-blue-700 hover:!text-blue-800': toast.type === 'info'
                  }"
                  (onClick)="onActionClick(toast)">
                </p-button>
              }

              <!-- Close Button -->
              <p-button
                icon="pi pi-times"
                size="small"
                [text]="true"
                severity="secondary"
                styleClass="!text-xs !w-6 !h-6 !p-0 !text-slate-400 hover:!text-slate-600"
                (onClick)="onDismiss(toast.id)"
                [attr.aria-label]="'Dismiss notification'">
              </p-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Custom styling for different toast types */
    .toast-container.success {
      border-left: 4px solid #10b981;
    }

    .toast-container.error {
      border-left: 4px solid #ef4444;
    }

    .toast-container.warning {
      border-left: 4px solid #f59e0b;
    }

    .toast-container.info {
      border-left: 4px solid #3b82f6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  protected get toasts(): ToastMessage[] {
    return this.toastService.currentToasts();
  }

  protected onDismiss(id: string): void {
    this.toastService.dismissToast(id);
  }

  protected onActionClick(toast: ToastMessage): void {
    if (toast.action) {
      toast.action.handler();
      this.toastService.dismissToast(toast.id);
    }
  }
}
