import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { CartService, CartItem } from '../../shared/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

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
    DividerModule
  ],
  template: `
    <div class="cart-page min-h-screen bg-slate-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
          <p class="text-slate-600">Review and manage your B2B order</p>
        </div>

        @if (cartService.isEmpty()) {
          <!-- Empty Cart State -->
          <div class="text-center py-12">
            <div class="bg-white rounded-lg shadow-sm p-12">
              <i class="pi pi-shopping-cart text-slate-300 text-6xl mb-6 block"></i>
              <h2 class="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
              <p class="text-slate-600 mb-8">Add products to your cart to get started with your B2B order.</p>
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
                  <h2 class="text-xl font-semibold text-slate-900">Cart Items ({{ cartService.totalItems() }})</h2>
                </div>
                
                <div class="divide-y divide-slate-200">
                  @for (item of cartService.items(); track item.productId + '-' + item.size) {
                    <div class="p-6 hover:bg-slate-50 transition-colors">
                      <div class="flex items-start gap-4">
                        <!-- Product Image Placeholder -->
                        <div class="flex-shrink-0 w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                          <i class="pi pi-image text-slate-400 text-xl"></i>
                        </div>
                        
                        <!-- Product Details -->
                        <div class="flex-1 min-w-0">
                          <h3 class="text-lg font-semibold text-slate-900">{{ item.productName }}</h3>
                          <p class="text-slate-600 text-sm mt-1">{{ item.productCode }}</p>
                          <p class="text-slate-600 text-sm">Size: {{ item.size }}</p>
                          <p class="text-slate-900 font-medium mt-2">\${{ item.unitPrice.toFixed(2) }} each</p>
                        </div>
                        
                        <!-- Quantity Controls -->
                        <div class="flex items-center gap-3">
                          <div class="flex items-center gap-2">
                            <p-button
                              icon="pi pi-minus"
                              size="small"
                              [text]="true"
                              [rounded]="true"
                              styleClass="!w-8 !h-8 !text-slate-600 hover:!bg-slate-100"
                              (onClick)="updateQuantity(item, item.quantity - 1)"
                              [disabled]="isUpdating()">
                            </p-button>
                            
                            <p-inputNumber
                              [(ngModel)]="item.quantity"
                              [min]="1"
                              [max]="999"
                              [showButtons]="false"
                              [disabled]="isUpdating()"
                              styleClass="w-16 text-center"
                              inputStyleClass="!text-center !p-2"
                              (onBlur)="updateQuantity(item, item.quantity)">
                            </p-inputNumber>
                            
                            <p-button
                              icon="pi pi-plus"
                              size="small"
                              [text]="true"
                              [rounded]="true"
                              styleClass="!w-8 !h-8 !text-slate-600 hover:!bg-slate-100"
                              (onClick)="updateQuantity(item, item.quantity + 1)"
                              [disabled]="isUpdating()">
                            </p-button>
                          </div>
                          
                          <!-- Item Total -->
                          <div class="text-right min-w-24">
                            <p class="text-lg font-bold text-slate-900">\${{ item.totalPrice.toFixed(2) }}</p>
                          </div>
                          
                          <!-- Remove Button -->
                          <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [text]="true"
                            [rounded]="true"
                            size="small"
                            styleClass="!w-8 !h-8"
                            (onClick)="removeItem(item)"
                            [disabled]="isUpdating()"
                            [attr.aria-label]="'Remove ' + item.productName + ' from cart'">
                          </p-button>
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
                      <span class="text-slate-600">Subtotal ({{ cartService.totalItems() }} items)</span>
                      <span class="text-slate-900 font-medium">\${{ cartService.totalPrice().toFixed(2) }}</span>
                    </div>
                    
                    <div class="flex justify-between">
                      <span class="text-slate-600">Shipping</span>
                      <span class="text-green-600 font-medium">Free</span>
                    </div>
                    
                    <div class="flex justify-between">
                      <span class="text-slate-600">Tax</span>
                      <span class="text-slate-900 font-medium">\${{ (cartService.totalPrice() * 0.08).toFixed(2) }}</span>
                    </div>
                    
                    <p-divider></p-divider>
                    
                    <div class="flex justify-between text-lg">
                      <span class="font-semibold text-slate-900">Total</span>
                      <span class="font-bold text-slate-900">\${{ (cartService.totalPrice() * 1.08).toFixed(2) }}</span>
                    </div>
                  </div>
                  
                  <!-- Submit Order Button -->
                  <p-button
                    label="Submit Order"
                    icon="pi pi-check"
                    styleClass="w-full !bg-blue-600 !border-blue-600 text-white hover:!bg-blue-700"
                    size="large"
                    [loading]="isSubmittingOrder()"
                    [disabled]="cartService.isEmpty() || isUpdating()"
                    (onClick)="submitOrder()">
                  </p-button>
                  
                  <p class="text-xs text-slate-500 mt-3 text-center">
                    Your order will be reviewed and processed within 24 hours.
                  </p>
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
      styleClass="w-full max-w-2xl">
      
      <div class="p-4">
        <p class="text-slate-600 mb-4">
          Some items in your cart have limited stock availability. Please adjust quantities or remove items before proceeding.
        </p>
        
        <div class="space-y-3 mb-6">
          @for (conflict of stockConflicts(); track conflict.productId + '-' + conflict.size) {
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-red-900">{{ getProductName(conflict.productId) }}</p>
                  <p class="text-sm text-red-700">Size {{ conflict.size }}</p>
                  <p class="text-sm text-red-600 mt-1">
                    Requested: {{ conflict.requestedQuantity }} | Available: {{ conflict.availableStock }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <p-button
                    label="Adjust to {{ conflict.availableStock }}"
                    size="small"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="adjustToAvailableStock(conflict)">
                  </p-button>
                  <p-button
                    label="Remove"
                    size="small"
                    severity="danger"
                    [outlined]="true"
                    (onClick)="removeConflictItem(conflict)">
                  </p-button>
                </div>
              </div>
            </div>
          }
        </div>
        
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [text]="true"
            (onClick)="showStockConflictDialog.set(false)">
          </p-button>
          <p-button
            label="Try Again"
            icon="pi pi-refresh"
            (onClick)="retryOrderSubmission()">
          </p-button>
        </div>
      </div>
    </p-dialog>

    <!-- Order Success Dialog -->
    <p-dialog
      header="Order Submitted Successfully!"
      [modal]="true"
      [visible]="showSuccessDialog()"
      (onHide)="showSuccessDialog.set(false)"
      [dismissableMask]="false"
      styleClass="w-full max-w-md">
      
      <div class="p-4 text-center">
        <i class="pi pi-check-circle text-green-600 text-4xl mb-4 block"></i>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">Order Confirmed</h3>
        <p class="text-slate-600 mb-4">Your order has been submitted successfully.</p>
        @if (orderId()) {
          <div class="bg-slate-50 rounded-lg p-3 mb-4">
            <p class="text-sm text-slate-600">Order ID:</p>
            <p class="font-mono text-sm font-medium text-slate-900">{{ orderId() }}</p>
          </div>
        }
        <p class="text-sm text-slate-500 mb-6">
          You will receive a confirmation email shortly. Our team will review and process your order within 24 hours.
        </p>
        
        <div class="flex flex-col gap-2">
          <p-button
            label="View Order History"
            icon="pi pi-history"
            styleClass="w-full"
            (onClick)="navigateToOrders()">
          </p-button>
          <p-button
            label="Continue Shopping"
            icon="pi pi-shopping-bag"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full"
            (onClick)="continueShopping()">
          </p-button>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  protected readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Component state
  protected readonly isUpdating = signal(false);
  protected readonly isSubmittingOrder = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly showStockConflictDialog = signal(false);
  protected readonly showSuccessDialog = signal(false);
  protected readonly stockConflicts = signal<StockConflict[]>([]);
  protected readonly orderId = signal<string | null>(null);

  protected updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }

    this.isUpdating.set(true);
    this.errorMessage.set(null);

    try {
      this.cartService.updateQuantity(item.productId, item.size, newQuantity);
      this.successMessage.set('Cart updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error) {
      this.errorMessage.set('Failed to update item quantity');
    } finally {
      this.isUpdating.set(false);
    }
  }

  protected removeItem(item: CartItem): void {
    this.isUpdating.set(true);
    this.errorMessage.set(null);

    try {
      this.cartService.removeItem(item.productId, item.size);
      this.successMessage.set(`${item.productName} removed from cart`);
      
      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error) {
      this.errorMessage.set('Failed to remove item from cart');
    } finally {
      this.isUpdating.set(false);
    }
  }

  protected async submitOrder(): Promise<void> {
    this.isSubmittingOrder.set(true);
    this.errorMessage.set(null);

    try {
      // First validate stock
      const stockValidation = await this.cartService.validateCartStock();
      
      if (!stockValidation.valid) {
        this.stockConflicts.set(stockValidation.conflicts);
        this.showStockConflictDialog.set(true);
        this.isSubmittingOrder.set(false);
        return;
      }

      // Submit order
      const result = await this.cartService.submitOrder();
      
      if (result.success) {
        this.orderId.set(result.orderId || null);
        this.showSuccessDialog.set(true);
      } else {
        this.errorMessage.set(result.error || 'Failed to submit order');
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while submitting your order');
    } finally {
      this.isSubmittingOrder.set(false);
    }
  }

  protected retryOrderSubmission(): void {
    this.showStockConflictDialog.set(false);
    this.submitOrder();
  }

  protected adjustToAvailableStock(conflict: StockConflict): void {
    this.cartService.updateQuantity(conflict.productId, conflict.size, conflict.availableStock);
    
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
    this.cartService.removeItem(conflict.productId, conflict.size);
    
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
    const item = this.cartService.items().find(item => item.productId === productId);
    return item?.productName || 'Unknown Product';
  }

  protected navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  protected navigateToOrders(): void {
    this.showSuccessDialog.set(false);
    this.router.navigate(['/orders']);
  }

  protected continueShopping(): void {
    this.showSuccessDialog.set(false);
    this.router.navigate(['/products']);
  }
}