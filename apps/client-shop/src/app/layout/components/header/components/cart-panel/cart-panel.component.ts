import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { CartItem, CartSummary } from '../../../../../shared/services/cart.service';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [
    CommonModule,
    PopoverModule,
    ButtonModule,
    BadgeModule
  ],
  template: `
    <!-- Cart Button -->
    <p-button
      #cartBtn
      icon="pi pi-shopping-cart"
      severity="secondary"
      [text]="true"
      [rounded]="true"
      size="small"
      styleClass="!text-slate-600 hover:!text-blue-600 hover:!bg-slate-50/80 transition-all duration-200 !p-2"
      (onClick)="cartPopover.toggle($event)"
      [attr.aria-label]="'View cart - ' + cartItemCount() + ' items'">
    </p-button>

    <!-- Cart badge -->
    @if (cartItemCount() > 0) {
      <p-badge
        [value]="cartItemCount() > 99 ? '99+' : cartItemCount().toString()"
        severity="success"
        styleClass="absolute -top-1 -right-1 !text-xs !min-w-4 !h-4 !leading-none !px-1">
      </p-badge>
    }

    <!-- Cart Popover -->
    <p-popover
      #cartPopover
      styleClass="w-96 !p-0"
      [showTransitionOptions]="'200ms ease-out'"
      [hideTransitionOptions]="'150ms ease-in'">
      <div class="py-3">
        <div class="px-4 py-2 border-b border-slate-100">
          <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <i class="pi pi-shopping-cart text-blue-600" aria-hidden="true"></i>
            Shopping Cart
            @if (cartItemCount() > 0) {
              <span class="text-xs text-slate-500">({{ cartItemCount() }} items)</span>
            }
          </h3>
        </div>

        @if (cartItems().length === 0) {
          <div class="px-4 py-6 text-center">
            <i class="pi pi-shopping-cart text-slate-300 text-3xl mb-2 block"></i>
            <p class="text-slate-500 text-sm">Your cart is empty</p>
            <p class="text-xs text-slate-400 mt-1">Add products to get started</p>
          </div>
        } @else {
          <div class="max-h-64 overflow-y-auto">
            @for (item of cartItems(); track item.productId + '-' + item.size) {
              <div class="px-4 py-3 hover:bg-slate-50/80 transition-colors duration-150 border-b border-slate-50">
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">{{ item.productName }}</p>
                    <p class="text-xs text-slate-600 mt-1">{{ item.productCode }} - Size {{ item.size }}</p>
                    <div class="flex items-center justify-between mt-2">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="onUpdateQuantity(item.productId, item.size, item.quantity - 1)"
                          class="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                          [attr.aria-label]="'Decrease quantity'">
                          <i class="pi pi-minus text-xs"></i>
                        </button>
                        <span class="text-sm font-medium text-slate-900 min-w-8 text-center">{{ item.quantity }}</span>
                        <button
                          (click)="onUpdateQuantity(item.productId, item.size, item.quantity + 1)"
                          class="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                          [attr.aria-label]="'Increase quantity'">
                          <i class="pi pi-plus text-xs"></i>
                        </button>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-semibold text-slate-900">€{{ item.totalPrice.toFixed(2) }}</p>
                        <p class="text-xs text-slate-500">€{{ item.unitPrice.toFixed(2) }} each</p>
                      </div>
                    </div>
                  </div>
                  <button
                    (click)="onRemoveItem(item.productId, item.size)"
                    class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    [attr.aria-label]="'Remove ' + item.productName + ' from cart'">
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-slate-700">Total:</span>
              <span class="text-lg font-bold text-slate-900">€{{ cartSummary().totalPrice.toFixed(2) }}</span>
            </div>
            <p-button
              label="View Cart & Checkout"
              icon="pi pi-arrow-right"
              styleClass="w-full !text-white !bg-blue-600 hover:!bg-blue-700"
              size="small"
              (onClick)="onViewCart(); cartPopover.hide()">
            </p-button>
          </div>
        }
      </div>
    </p-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartPanelComponent {
  // Inputs
  readonly cartItems = input.required<CartItem[]>();
  readonly cartSummary = input.required<CartSummary>();

  // Outputs
  readonly updateQuantity = output<{ productId: number; size: number; quantity: number }>();
  readonly removeItem = output<{ productId: number; size: number }>();
  readonly viewCart = output<void>();

  // Computed
  cartItemCount() {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  }

  // Event handlers
  protected onUpdateQuantity(productId: number, size: number, quantity: number): void {
    this.updateQuantity.emit({ productId, size, quantity });
  }

  protected onRemoveItem(productId: number, size: number): void {
    this.removeItem.emit({ productId, size });
  }

  protected onViewCart(): void {
    this.viewCart.emit();
  }
}
