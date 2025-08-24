import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { CartItem } from '../../../../../features/cart/stores/cart.store';

interface CartSummary {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

interface GroupedCartItem {
  productId: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  sizes: Array<{
    size: number;
    quantity: number;
    totalPrice: number;
  }>;
  totalQuantity: number;
  totalPrice: number;
}

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
            @for (group of groupedCartItems(); track group.productId) {
              <div class="px-4 py-3 hover:bg-slate-50/80 transition-colors duration-150 border-b border-slate-50">
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">{{ group.productName }}</p>
                    <p class="text-xs text-slate-600 mt-1">{{ group.productCode }}</p>

                    <!-- Size variants -->
                    <div class="mt-2 space-y-1.5">
                      @for (sizeVariant of group.sizes; track sizeVariant.size) {
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-slate-600 min-w-12">Size {{ sizeVariant.size }}:</span>
                          <div class="flex items-center gap-1">
                            <button
                              (click)="onUpdateQuantity(group.productId, sizeVariant.size, sizeVariant.quantity - 1)"
                              class="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                              [attr.aria-label]="'Decrease quantity for size ' + sizeVariant.size">
                              <i class="pi pi-minus text-xs"></i>
                            </button>
                            <span class="text-xs font-medium text-slate-900 min-w-6 text-center">{{ sizeVariant.quantity }}</span>
                            <button
                              (click)="onUpdateQuantity(group.productId, sizeVariant.size, sizeVariant.quantity + 1)"
                              class="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                              [attr.aria-label]="'Increase quantity for size ' + sizeVariant.size">
                              <i class="pi pi-plus text-xs"></i>
                            </button>
                            <span class="text-xs text-slate-600 ml-1 min-w-12">€{{ sizeVariant.totalPrice.toFixed(2) }}</span>
                            <button
                              (click)="onRemoveItem(group.productId, sizeVariant.size)"
                              class="w-4 h-4 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              [attr.aria-label]="'Remove size ' + sizeVariant.size + ' from cart'">
                              <i class="pi pi-times text-xs"></i>
                            </button>
                          </div>
                        </div>
                      }
                    </div>

                    <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span class="text-xs font-medium text-slate-700">Total ({{ group.totalQuantity }} items):</span>
                      <span class="text-sm font-bold text-slate-900">€{{ group.totalPrice.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-slate-700">Total:</span>
              <span class="text-lg font-bold text-slate-900">€{{ cartSummary().total.toFixed(2) }}</span>
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
    return this.cartSummary().itemCount;
  }

  groupedCartItems = computed(() => {
    const groups = new Map<number, GroupedCartItem>();

    this.cartItems().forEach(item => {
      if (!groups.has(item.productId)) {
        groups.set(item.productId, {
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unitPrice: item.unitPrice,
          sizes: [],
          totalQuantity: 0,
          totalPrice: 0
        });
      }

      const group = groups.get(item.productId);
      if (!group) return;

      group.sizes.push({
        size: item.size,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      });
      group.totalQuantity += item.quantity;
      group.totalPrice += item.totalPrice;
    });

    // Sort sizes within each group
    groups.forEach(group => {
      group.sizes.sort((a, b) => a.size - b.size);
    });

    return Array.from(groups.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  });

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
