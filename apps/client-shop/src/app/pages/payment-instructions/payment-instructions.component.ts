import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OrderStore } from '../../features/orders/stores/order.store';
import { CurrencyPipe } from '../../shared/pipes';

@Component({
  selector: 'app-payment-instructions',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    CurrencyPipe
  ],
  template: `
    <div class="payment-instructions-page min-h-screen bg-slate-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        @if (orderStore.isLoading()) {
          <!-- Loading State -->
          <div class="text-center py-12">
            <div class="bg-white rounded-lg shadow-sm p-12">
              <p-progressSpinner styleClass="w-12 h-12 mx-auto mb-4" />
              <h2 class="text-xl font-semibold text-slate-900 mb-2">Loading Order Details...</h2>
              <p class="text-slate-600">Please wait while we retrieve your order information.</p>
            </div>
          </div>
        } @else if (orderStore.error() || !orderStore.currentOrder()) {
          <!-- Error State -->
          <div class="text-center py-12">
            <div class="bg-white rounded-lg shadow-sm p-12">
              <i class="pi pi-exclamation-triangle text-red-500 text-6xl mb-6 block"></i>
              <h2 class="text-2xl font-bold text-slate-900 mb-4">Order Not Found</h2>
              <p class="text-slate-600 mb-8">{{ orderStore.error() || 'Unable to find your order details.' }}</p>
              <div class="flex gap-4 justify-center">
                <p-button
                  label="Back to Cart"
                  icon="pi pi-arrow-left"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="navigateToCart()">
                </p-button>
                <p-button
                  label="View Orders"
                  icon="pi pi-list"
                  (onClick)="navigateToOrders()">
                </p-button>
              </div>
            </div>
          </div>
        } @else {
          <!-- Page Header -->
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-slate-900 mb-2">Payment Instructions</h1>
            <p class="text-slate-600">Complete your order with a bank transfer</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-8">
            <!-- Order Confirmation -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div class="flex items-center gap-3">
                <i class="pi pi-check-circle text-green-600 text-xl"></i>
                <div>
                  <h3 class="text-lg font-semibold text-green-900">Order Placed Successfully!</h3>
                  <p class="text-sm text-green-700 mt-1">Order ID: <span class="font-mono font-medium">{{ orderStore.currentOrder()?.id }}</span></p>
                </div>
              </div>
            </div>

            <!-- Email Confirmation Notice -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div class="flex items-start gap-3">
                <i class="pi pi-envelope text-blue-600 text-lg mt-0.5"></i>
                <div>
                  <h4 class="font-semibold text-blue-900 mb-1">Order Confirmation Sent</h4>
                  <p class="text-sm text-blue-800">
                    A copy of your order has been sent to <strong>{{ orderStore.customerEmail() }}</strong>.
                    Please check your email for detailed order information and payment instructions.
                  </p>
                </div>
              </div>
            </div>

            <!-- Payment Instructions -->
            <div class="space-y-6">
              <h4 class="text-xl font-semibold text-slate-900 mb-4">Payment Instructions</h4>

              <div class="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h5 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <i class="pi pi-university text-blue-600"></i>
                  Bank Transfer Details
                </h5>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Bank Name:</div>
                      <p class="font-mono text-sm text-slate-900 bg-white p-2 rounded border">{{ orderStore.currentOrder()?.paymentInfo?.bankDetails?.bankName || '-' }}</p>
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Account Holder:</div>
                      <p class="font-mono text-sm text-slate-900 bg-white p-2 rounded border">{{ orderStore.currentOrder()?.paymentInfo?.bankDetails?.accountHolder || '-' }}</p>
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">IBAN:</div>
                      <p class="font-mono text-sm text-slate-900 bg-white p-2 rounded border">{{ orderStore.currentOrder()?.paymentInfo?.bankDetails?.iban || '-' }}</p>
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">SWIFT/BIC:</div>
                      <p class="font-mono text-sm text-slate-900 bg-white p-2 rounded border">{{ orderStore.currentOrder()?.paymentInfo?.bankDetails?.swift || '-' }}</p>
                    </div>
                  </div>

                  <div class="pt-4 border-t border-slate-200">
                    <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Transfer Reference:</div>
                    <div class="flex items-center gap-3">
                      <p class="font-mono text-lg font-bold text-slate-900 bg-yellow-100 px-4 py-2 rounded border-2 border-yellow-300">{{ orderStore.paymentReference() }}</p>
                      <button
                        (click)="copyToClipboard(orderStore.paymentReference()!)"
                        class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Copy reference">
                        <i class="pi pi-copy"></i>
                        Copy
                      </button>
                    </div>
                    <p class="text-sm text-amber-700 mt-2 font-medium">⚠️ Please include this reference in your transfer description</p>
                  </div>

                  <div class="pt-4 border-t border-slate-200">
                    <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Amount to Transfer:</div>
                    <p class="text-2xl font-bold text-slate-900">{{ orderStore.paymentAmount() | appCurrency }}</p>
                  </div>
                </div>
              </div>

              <!-- Order Summary -->
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h5 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <i class="pi pi-shopping-cart text-blue-600"></i>
                  Order Summary
                </h5>

                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Subtotal ({{ orderStore.currentOrder()?.summary?.itemCount || 0 }} items)</span>
                    <span class="text-slate-900 font-medium">{{ (orderStore.currentOrder()?.summary?.subtotal || 0) | appCurrency }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Shipping</span>
                    <span class="text-green-600 font-medium">Free</span>
                  </div>
                  <div class="border-t border-slate-300 pt-3 flex justify-between text-lg">
                    <span class="font-semibold text-slate-900">Total</span>
                    <span class="font-bold text-slate-900">{{ (orderStore.currentOrder()?.summary?.total || 0) | appCurrency }}</span>
                  </div>

                  <!-- VAT Information -->
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div class="flex items-start gap-2">
                      <i class="pi pi-info-circle text-blue-600 text-sm mt-0.5"></i>
                      <div class="text-xs text-blue-800">
                        <p class="font-medium">Prices do NOT include VAT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Important Notes -->
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h5 class="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <i class="pi pi-exclamation-triangle text-amber-600"></i>
                  Important Payment Information
                </h5>
                <ul class="text-sm text-amber-800 space-y-2">
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-0.5">•</span>
                    <span>We only accept bank transfers - no card payments or cash on delivery</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-0.5">•</span>
                    <span>Your order will be processed once payment is received and verified</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-0.5">•</span>
                    <span>Processing typically takes 1-2 business days after payment confirmation</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-0.5">•</span>
                    <span>Please include the order reference in your transfer description</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-0.5">•</span>
                    <span>Orders are held for 7 days pending payment</span>
                  </li>
                </ul>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-4 pt-6">
                <p-button
                  label="View Order History"
                  icon="pi pi-history"
                  severity="secondary"
                  [outlined]="true"
                  styleClass="flex-1"
                  (onClick)="navigateToOrders()">
                </p-button>
                <p-button
                  label="Continue Shopping"
                  icon="pi pi-shopping-bag"
                  styleClass="flex-1 !bg-blue-600 !border-blue-600 text-white hover:!bg-blue-700"
                  (onClick)="continueShopping()">
                </p-button>
              </div>
            </div>
          </div>
        }

        <!-- Success Messages -->
        @if (successMessage()) {
          <p-message
            severity="success"
            [text]="successMessage()!"
            styleClass="mt-4 w-full">
          </p-message>
        }
      </div>
    </div>
  `,
  styleUrl: './payment-instructions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentInstructionsComponent implements OnInit {
  protected readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Component state
  protected readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Check if there's already a valid order in the store
    if (this.orderStore.hasValidOrder()) {
      return; // Order already loaded
    }

    // Try to get order ID from query params (fallback for direct links)
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      if (orderId) {
        this.orderStore.loadOrder(orderId);
      } else {
        // No order ID provided and no current order - redirect to cart
        this.router.navigate(['/cart']);
      }
    });
  }

  protected async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.successMessage.set('Reference copied to clipboard!');
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.successMessage.set('Reference copied to clipboard!');
      setTimeout(() => this.successMessage.set(null), 3000);
    }
  }

  protected navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  protected navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  protected continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
