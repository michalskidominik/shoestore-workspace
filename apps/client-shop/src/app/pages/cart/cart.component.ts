import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { FormsModule } from '@angular/forms';
import { CartStore } from '../../features/cart/stores/cart.store';
import { OrderStore } from '../../features/orders/stores/order.store';
import { CartApiService } from '../../features/cart/services/cart-api.service';
import { CurrencyPipe } from '../../shared/pipes';

interface StockConflict {
  productId: number;
  size: number;
  requestedQuantity: number;
  availableStock: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputNumberModule,
    MessageModule,
    DialogModule,
    ProgressSpinnerModule,
    DividerModule,
    CurrencyPipe
  ],
  template: `
    <div class="cart-page min-h-screen bg-slate-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
          <p class="text-slate-600">Review and manage your order</p>
        </div>

        @if (cartStore.isEmpty()) {
          <!-- Empty Cart State -->
          <div class="text-center py-12">
            <div class="bg-white rounded-lg shadow-sm p-12">
              <i class="pi pi-shopping-cart text-slate-300 text-6xl mb-6 block"></i>
              <h2 class="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
              <p class="text-slate-600 mb-8">Add products to your cart to get started with your order.</p>
              <p-button
                label="Browse Products"
                icon="pi pi-arrow-left"
                (onClick)="navigateToProducts()"
                styleClass="!bg-blue-600 !border-blue-600 text-white hover:!bg-blue-700">
              </p-button>
            </div>
          </div>
        } @else {
          <!-- Cart Content -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Cart Items -->
            <div class="lg:col-span-2 space-y-4">
              <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-slate-200">
                  <h2 class="text-xl font-semibold text-slate-900">Cart Items ({{ cartStore.totalItems() }})</h2>
                </div>

                <div class="divide-y divide-slate-200">
                  @for (group of cartStore.groupedItems(); track group.productId) {
                    <div class="p-6 hover:bg-slate-50 transition-colors">
                      <div class="flex items-start gap-4">
                        <!-- Product Image Placeholder -->
                        <div class="flex-shrink-0 w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                          <i class="pi pi-image text-slate-400 text-xl"></i>
                        </div>

                        <!-- Product Details -->
                        <div class="flex-1 min-w-0">
                          <h3 class="text-lg font-semibold text-slate-900">{{ group.productName }}</h3>
                          <p class="text-slate-600 text-sm mt-1">{{ group.productCode }}</p>
                          <p class="text-slate-900 font-medium mt-2">{{ group.unitPrice | appCurrency }} each</p>

                          <!-- Size variants -->
                          <div class="mt-4 space-y-3">
                            @for (sizeVariant of group.sizes; track sizeVariant.size) {
                              <div class="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                                <div class="flex items-center gap-4">
                                  <span class="text-sm font-medium text-slate-700 min-w-16">Size {{ sizeVariant.size }}</span>

                                  <!-- Quantity Controls -->
                                  <div class="flex items-center gap-2">
                                    <p-button
                                      icon="pi pi-minus"
                                      size="small"
                                      [text]="true"
                                      [rounded]="true"
                                      styleClass="!w-7 !h-7 !text-slate-600 hover:!bg-slate-200"
                                      (onClick)="updateQuantityBySize(group.productId, sizeVariant.size, sizeVariant.quantity - 1)"
                                      [disabled]="cartStore.isLoading()">
                                    </p-button>

                                    <div class="flex items-center gap-1">
                                      @if (cartStore.isLoading()) {
                                        <i class="pi pi-spinner pi-spin text-xs text-slate-400"></i>
                                      }
                                      <span class="text-sm font-semibold text-slate-900 min-w-8 text-center">{{ sizeVariant.quantity }}</span>
                                    </div>

                                    <p-button
                                      icon="pi pi-plus"
                                      size="small"
                                      [text]="true"
                                      [rounded]="true"
                                      styleClass="!w-7 !h-7 !text-slate-600 hover:!bg-slate-200"
                                      (onClick)="updateQuantityBySize(group.productId, sizeVariant.size, sizeVariant.quantity + 1)"
                                      [disabled]="cartStore.isLoading()">
                                    </p-button>
                                  </div>
                                </div>

                                <div class="flex items-center gap-3">
                                  <!-- Size Total -->
                                  <span class="text-sm font-bold text-slate-900">{{ sizeVariant.totalPrice | appCurrency }}</span>

                                  <!-- Remove Size Button -->
                                  <p-button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    [text]="true"
                                    [rounded]="true"
                                    size="small"
                                    styleClass="!w-7 !h-7"
                                    (onClick)="removeSizeVariant(group.productId, sizeVariant.size)"
                                    [disabled]="cartStore.isLoading()"
                                    [attr.aria-label]="'Remove size ' + sizeVariant.size + ' from cart'">
                                  </p-button>
                                </div>
                              </div>
                            }
                          </div>

                          <!-- Product Total -->
                          <div class="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span class="text-sm font-medium text-slate-700">Product Total ({{ group.totalQuantity }} items):</span>
                            <span class="text-lg font-bold text-slate-900">{{ group.totalPrice | appCurrency }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Continue Shopping -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <p-button
                  label="Continue Shopping"
                  icon="pi pi-arrow-left"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="navigateToProducts()">
                </p-button>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-lg shadow-sm sticky top-4">
                <div class="p-6">
                  <h2 class="text-xl font-semibold text-slate-900 mb-6">Order Summary</h2>

                    <div class="space-y-4 mb-6">
                    <div class="flex justify-between">
                      <span class="text-slate-600">Subtotal ({{ cartStore.totalItems() }} items)</span>
                      <span class="text-slate-900 font-medium">{{ cartStore.cartSummary().subtotal | appCurrency }}</span>
                    </div>

                    <div class="flex justify-between">
                      <span class="text-slate-600">Shipping</span>
                      <span class="text-green-600 font-medium">Free</span>
                    </div>

                    <p-divider></p-divider>

                    <div class="flex justify-between text-lg">
                      <span class="font-semibold text-slate-900">Total</span>
                      <span class="font-bold text-slate-900">{{ cartStore.cartSummary().total | appCurrency }}</span>
                    </div>

                    <!-- VAT Information -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <div class="flex items-start gap-2">
                        <i class="pi pi-info-circle text-blue-600 text-sm mt-0.5"></i>
                        <div class="text-xs text-blue-800">
                          <p class="font-medium">Prices do NOT include VAT</p>
                          <p>VAT will be calculated based on your location during checkout</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Submit Order Button -->
                  <p-button
                    label="Submit Order"
                    icon="pi pi-check"
                    styleClass="w-full !bg-blue-600 !border-blue-600 text-white hover:!bg-blue-700"
                    size="large"
                    [loading]="orderStore.isSubmitting() || isValidatingStock()"
                    [disabled]="cartStore.isEmpty() || cartStore.isLoading() || isValidatingStock()"
                    (onClick)="submitOrder()">
                  </p-button>

                  @if (isValidatingStock()) {
                    <p class="text-xs text-blue-600 mt-2 text-center">
                      <i class="pi pi-spinner pi-spin mr-1"></i>
                      Checking stock availability...
                    </p>
                  } @else {
                    <p class="text-xs text-slate-500 mt-3 text-center">
                      Your order will be reviewed and processed within 24 hours.
                    </p>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Error Messages -->
        @if (errorMessage()) {
          <p-message
            severity="error"
            [text]="errorMessage()!"
            styleClass="mt-4 w-full">
          </p-message>
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

    <!-- Stock Conflict Dialog -->
    <p-dialog
      header="Stock Availability Issues"
      [modal]="true"
      [visible]="showStockConflictDialog()"
      (onHide)="showStockConflictDialog.set(false)"
      [dismissableMask]="false"
      [closable]="false"
      styleClass="w-full max-w-3xl">

      <div class="p-4">
        <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 text-lg mt-0.5"></i>
            <div>
              <h3 class="font-semibold text-yellow-900 mb-2">Stock Availability Issues Detected</h3>
              <p class="text-yellow-800 text-sm">
                Unfortunately, some items in your cart are not available in the requested quantities.
                Please review the details below and adjust your order accordingly.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-4 mb-6">
          @for (conflict of stockConflicts(); track conflict.productId + '-' + conflict.size) {
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="pi pi-times-circle text-red-600"></i>
                    <h4 class="font-semibold text-red-900">{{ getProductName(conflict.productId) }}</h4>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span class="text-slate-600 font-medium">Size:</span>
                      <span class="ml-1 text-slate-900">{{ conflict.size }}</span>
                    </div>
                    <div>
                      <span class="text-slate-600 font-medium">Requested:</span>
                      <span class="ml-1 text-red-700 font-semibold">{{ conflict.requestedQuantity }}</span>
                    </div>
                    <div>
                      <span class="text-slate-600 font-medium">Available:</span>
                      <span class="ml-1 text-green-700 font-semibold">{{ conflict.availableStock }}</span>
                    </div>
                  </div>

                  @if (conflict.availableStock === 0) {
                    <div class="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                      <i class="pi pi-ban mr-1"></i>
                      This item is currently out of stock
                    </div>
                  } @else {
                    <div class="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                      <i class="pi pi-info-circle mr-1"></i>
                      Limited stock: only {{ conflict.availableStock }} item{{ conflict.availableStock !== 1 ? 's' : '' }} remaining
                    </div>
                  }
                </div>

                <div class="flex flex-col gap-2 flex-shrink-0">
                  @if (conflict.availableStock > 0) {
                    <p-button
                      label="Adjust to {{ conflict.availableStock }}"
                      size="small"
                      severity="secondary"
                      [outlined]="true"
                      icon="pi pi-check"
                      styleClass="text-xs"
                      (onClick)="adjustToAvailableStock(conflict)">
                    </p-button>
                  }
                  <p-button
                    label="Remove Item"
                    size="small"
                    severity="danger"
                    [outlined]="true"
                    icon="pi pi-trash"
                    styleClass="text-xs"
                    (onClick)="removeConflictItem(conflict)">
                  </p-button>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="border-t border-slate-200 pt-4">
          @if (stockConflicts().length > 0) {
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 class="text-sm font-semibold text-blue-900 mb-2">
                <i class="pi pi-lightbulb mr-1"></i>
                Quick Fix Summary
              </h4>
              <div class="text-xs text-blue-800">
                @if (getOutOfStockCount() > 0) {
                  <p>• {{ getOutOfStockCount() }} out-of-stock item{{ getOutOfStockCount() !== 1 ? 's' : '' }} will be removed</p>
                }
                @if (getAdjustableCount() > 0) {
                  <p>• {{ getAdjustableCount() }} item{{ getAdjustableCount() !== 1 ? 's' : '' }} will be adjusted to available quantities</p>
                }
                @if (getTotalConflictValue() > 0) {
                  <p>• Order value will be reduced by approximately €{{ getTotalConflictValue().toFixed(2) }}</p>
                }
              </div>
            </div>
          }

          <div class="flex flex-col sm:flex-row justify-between gap-3">
            <div class="text-sm text-slate-600">
              <p><strong>{{ stockConflicts().length }}</strong> item{{ stockConflicts().length !== 1 ? 's' : '' }} need{{ stockConflicts().length === 1 ? 's' : '' }} attention</p>
              <p class="mt-1">Please resolve all conflicts to continue with your order.</p>
            </div>

            <div class="flex gap-2 flex-shrink-0">
              <p-button
                label="Cancel Order"
                severity="secondary"
                [text]="true"
                icon="pi pi-times"
                (onClick)="cancelOrder()">
              </p-button>
              <p-button
                label="Fix All Issues"
                icon="pi pi-wrench"
                severity="secondary"
                [outlined]="true"
                (onClick)="autoFixAllConflicts()">
              </p-button>
              <p-button
                label="Try Again"
                icon="pi pi-refresh"
                (onClick)="retryOrderSubmission()"
                [disabled]="stockConflicts().length > 0">
              </p-button>
            </div>
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  protected readonly cartStore = inject(CartStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly cartApiService = inject(CartApiService);
  private readonly router = inject(Router);

  // Component state
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly showStockConflictDialog = signal(false);
  protected readonly stockConflicts = signal<StockConflict[]>([]);
  protected readonly isValidatingStock = signal(false);

  // Computed properties - removed groupedCartItems since it's now in the store

  protected updateQuantity(productId: number, size: number, newQuantity: number): void {
    this.errorMessage.set(null);
    this.cartStore.updateQuantity({ productId, size, newQuantity });
  }

  protected updateQuantityBySize(productId: number, size: number, newQuantity: number): void {
    if (newQuantity < 0) return; // Prevent negative quantities

    this.errorMessage.set(null);
    this.cartStore.updateQuantity({ productId, size, newQuantity });
  }

  protected removeSizeVariant(productId: number, size: number): void {
    this.errorMessage.set(null);
    this.cartStore.removeItem({ productId, size });
  }

  protected removeItem(productId: number, size: number): void {
    this.errorMessage.set(null);
    this.cartStore.removeItem({ productId, size });
  }

  protected submitOrder(): void {
    this.errorMessage.set(null);
    this.isValidatingStock.set(true);

    // Validate stock first using CartApiService
    const items = this.cartStore.entities();
    const validationRequest = {
      items: items.map(item => ({
        productId: item.productId,
        size: item.size,
        requestedQuantity: item.quantity
      }))
    };

    this.cartApiService.validateStock(validationRequest).subscribe({
      next: (stockValidation) => {
        this.isValidatingStock.set(false);

        if (!stockValidation.valid) {
          this.stockConflicts.set(stockValidation.conflicts);
          this.showStockConflictDialog.set(true);

          // Show summary message
          const conflictCount = stockValidation.conflicts.length;
          const outOfStockItems = stockValidation.conflicts.filter(c => c.availableStock === 0).length;
          let message = `${conflictCount} item${conflictCount !== 1 ? 's' : ''} in your cart`;

          if (outOfStockItems > 0) {
            message += ` (${outOfStockItems} out of stock)`;
          }
          message += ` cannot be ordered in the requested quantities.`;

          this.errorMessage.set(message);
          return;
        }

        // All items are available - submit order through OrderStore
        const orderItems = items.map(item => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }));

        const summary = this.cartStore.cartSummary();

        this.orderStore.submitOrder({
          items: orderItems,
          summary
        });
      },
      error: (error) => {
        this.isValidatingStock.set(false);
        this.errorMessage.set('Failed to validate stock availability. Please try again.');
        console.error('Stock validation error:', error);
      }
    });
  }

  protected retryOrderSubmission(): void {
    this.showStockConflictDialog.set(false);
    this.submitOrder();
  }

  protected cancelOrder(): void {
    this.showStockConflictDialog.set(false);
    this.stockConflicts.set([]);
    this.errorMessage.set(null);
  }

  protected autoFixAllConflicts(): void {
    const conflicts = this.stockConflicts();

    // Process each conflict
    conflicts.forEach(conflict => {
      if (conflict.availableStock > 0) {
        // Adjust to available stock
        this.cartStore.updateQuantity({
          productId: conflict.productId,
          size: conflict.size,
          newQuantity: conflict.availableStock
        });
      } else {
        // Remove items that are out of stock
        this.cartStore.removeItem({
          productId: conflict.productId,
          size: conflict.size
        });
      }
    });

    // Clear conflicts and close dialog
    this.stockConflicts.set([]);
    this.showStockConflictDialog.set(false);

    // Show feedback message
    this.successMessage.set('Cart updated to resolve stock conflicts');
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  protected adjustToAvailableStock(conflict: StockConflict): void {
    this.cartStore.updateQuantity({
      productId: conflict.productId,
      size: conflict.size,
      newQuantity: conflict.availableStock
    });

    // Remove this conflict from the list
    const updatedConflicts = this.stockConflicts().filter(
      c => !(c.productId === conflict.productId && c.size === conflict.size)
    );
    this.stockConflicts.set(updatedConflicts);

    // Close dialog if no more conflicts
    if (updatedConflicts.length === 0) {
      this.showStockConflictDialog.set(false);
    }
  }

  protected removeConflictItem(conflict: StockConflict): void {
    this.cartStore.removeItem({
      productId: conflict.productId,
      size: conflict.size
    });

    // Remove this conflict from the list
    const updatedConflicts = this.stockConflicts().filter(
      c => !(c.productId === conflict.productId && c.size === conflict.size)
    );
    this.stockConflicts.set(updatedConflicts);

    // Close dialog if no more conflicts
    if (updatedConflicts.length === 0) {
      this.showStockConflictDialog.set(false);
    }
  }

  protected getProductName(productId: number): string {
    const item = this.cartStore.entities().find(item => item.productId === productId);
    return item?.productName || 'Unknown Product';
  }

  protected getProductCode(productId: number): string {
    const item = this.cartStore.entities().find(item => item.productId === productId);
    return item?.productCode || '';
  }

  protected getTotalConflictValue(): number {
    return this.stockConflicts().reduce((total, conflict) => {
      const item = this.cartStore.entities().find(i => i.productId === conflict.productId && i.size === conflict.size);
      return total + (item ? (conflict.requestedQuantity - conflict.availableStock) * item.unitPrice : 0);
    }, 0);
  }

  protected getOutOfStockCount(): number {
    return this.stockConflicts().filter(conflict => conflict.availableStock === 0).length;
  }

  protected getAdjustableCount(): number {
    return this.stockConflicts().filter(conflict => conflict.availableStock > 0).length;
  }

  protected navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  protected navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  protected continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
