import { CommonModule } from '@angular/common';
import { Component, input, output, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { QuickOrderComponent, OrderData } from '../quick-order/quick-order.component';
import { CartStore, AddToCartRequest } from '../../../../features/cart/stores/cart.store';
import { ToastStore } from '../../../../shared/stores/toast.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ProductPriceRangePipe } from '../../../../shared/pipes';

type ViewMode = 'grid' | 'list' | 'large' | 'compact';
type ImageSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, RatingModule, DialogModule, FormsModule, QuickOrderComponent, ProductPriceRangePipe],
  template: `
    <div
      class="group transition-all duration-200 overflow-hidden
             border border-slate-100 rounded-lg bg-white/50 backdrop-blur-sm
             lg:bg-white lg:border-slate-200 lg:shadow-sm lg:hover:shadow-md"
      [ngClass]="{
        'flex gap-3 p-3 bg-white rounded-lg shadow-sm border-slate-200': viewMode() === 'list'
      }">

      @if (viewMode() === 'grid' || viewMode() === 'large' || viewMode() === 'compact') {
        <!-- Grid Card Layout -->
        <div class="relative">
          <!-- Product Image -->
          <div class="aspect-square bg-slate-50 overflow-hidden">
            <img
              [src]="product().imageUrl || 'https://via.placeholder.com/300x300/f1f5f9/64748b?text=No+Image'"
              [alt]="product().name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy">
          </div>

          <!-- Quick Actions Overlay - Simplified for mobile -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 lg:gap-3">
            @if (isAuthenticated()) {
              <p-button
                icon="pi pi-eye"
                severity="primary"
                [rounded]="true"
                size="small"
                (onClick)="onViewDetails()"
                [attr.aria-label]="'View details for ' + product().name"
                styleClass="!w-8 !h-8 lg:!w-10 lg:!h-10">
              </p-button>
            }
            <p-button
              icon="pi pi-shopping-cart"
              severity="success"
              [rounded]="true"
              size="small"
              (onClick)="onQuickOrder()"
              [disabled]="isAuthenticated() && !hasStock()"
              [attr.aria-label]="isAuthenticated() ? 'Order ' + product().name : 'Sign in to order ' + product().name"
              styleClass="!w-8 !h-8 lg:!w-10 lg:!h-10">
            </p-button>
          </div>
        </div>

        <!-- Card Content - Optimized for mobile -->
        <div class="p-2 lg:p-3">
          <!-- Product Name & Code -->
          <div class="mb-1 lg:mb-2">
            <h3 class="font-semibold text-slate-900 text-xs lg:text-sm mb-0.5 lg:mb-1 line-clamp-2 group-hover:text-blue-900 transition-colors leading-tight">
              {{ product().name }}
            </h3>
            <p class="text-xs text-slate-500 font-mono hidden lg:block">{{ product().code }}</p>
          </div>

          <!-- Price Range -->
          <div class="mb-1 lg:mb-2">
            <div class="text-sm lg:text-base font-bold text-blue-600" [ngClass]="{'blurred-price': !isAuthenticated()}">{{ product() | productPriceRange }}</div>
          </div>

          <!-- Size & Stock Info with Actions - Mobile optimized -->
          @if (isAuthenticated()) {
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between text-xs text-slate-600">
              <div class="flex flex-col mb-2 lg:mb-0">
                <span class="font-medium">{{ getSizeRange() }}</span>
                <span class="lg:hidden">{{ getAvailableSizes().length }} sizes</span>
              </div>

              <!-- Actions - Mobile: Full width buttons, Desktop: Inline -->
              <div class="flex flex-col lg:flex-row gap-1 lg:gap-1 lg:ml-2">
                <p-button
                  label="View"
                  icon="pi pi-eye"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  styleClass="!text-xs !py-1.5 !px-2 w-full lg:w-auto"
                  (onClick)="onViewDetails()">
                </p-button>
                <p-button
                  label="Order"
                  icon="pi pi-shopping-cart"
                  severity="success"
                  size="small"
                  [disabled]="!hasStock()"
                  styleClass="!text-xs !py-1.5 !px-2 w-full lg:w-auto"
                  (onClick)="onQuickOrder()">
                </p-button>
              </div>
            </div>
          } @else {
            <!-- Unauthenticated user - Only sign in button -->
            <div class="flex justify-center mt-2">
              <p-button
                label="Sign In"
                icon="pi pi-user"
                severity="primary"
                size="small"
                styleClass="!text-xs !py-1.5 !px-3 w-full lg:w-auto"
                (onClick)="onQuickOrder()">
              </p-button>
            </div>
          }
        </div>
      } @else {
        <!-- List Layout -->
        <!-- Product Image -->
        <div class="flex-shrink-0 w-16 h-16 bg-slate-50 rounded-md overflow-hidden">
          <img
            [src]="product().imageUrl || 'https://via.placeholder.com/64x64/f1f5f9/64748b?text=No+Image'"
            [alt]="product().name"
            class="w-full h-full object-cover"
            loading="lazy">
        </div>

        <!-- Product Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0 pr-2">
              <h3 class="font-semibold text-slate-900 text-sm mb-1 truncate">{{ product().name }}</h3>
              <p class="text-xs text-slate-500 font-mono mb-1">{{ product().code }}</p>
              @if (isAuthenticated()) {
                <div class="flex items-center gap-3 text-xs text-slate-600">
                  <span>{{ getSizeRange() }}</span>
                  <span>{{ getAvailableSizes().length }} sizes</span>
                </div>
              }
            </div>
            <div class="flex flex-col items-end">
              <div class="text-sm font-bold text-blue-600 mb-1" [ngClass]="{'blurred-price': !isAuthenticated()}">{{ product() | productPriceRange }}</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-2">
            @if (isAuthenticated()) {
              <p-button
                label="View"
                icon="pi pi-eye"
                severity="secondary"
                [outlined]="true"
                size="small"
                styleClass="!text-xs !py-1.5 !px-3"
                (onClick)="onViewDetails()">
              </p-button>
              <p-button
                label="Order"
                icon="pi pi-shopping-cart"
                severity="success"
                size="small"
                [disabled]="!hasStock()"
                styleClass="!text-xs !py-1.5 !px-3"
                (onClick)="onQuickOrder()">
              </p-button>
            } @else {
              <p-button
                label="Sign In"
                icon="pi pi-user"
                severity="primary"
                size="small"
                styleClass="!text-xs !py-1.5 !px-3 flex-1"
                (onClick)="onQuickOrder()">
              </p-button>
            }
          </div>
        </div>
      }
    </div>

    <!-- Quick Order Dialog -->
    <p-dialog
      [(visible)]="showQuickOrderDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [closeOnEscape]="true"
      styleClass="quick-order-dialog w-full h-full max-w-none max-h-none m-0 lg:w-auto lg:h-auto lg:max-w-7xl lg:max-h-[90vh] lg:m-4"
      [showHeader]="false"
      position="center"
      [blockScroll]="true">

      @if (showQuickOrderDialog() && isAuthenticated()) {
        <app-quick-order
          [product]="product()"
          [sizeSystem]="sizeSystem()"
          [isSubmitting]="isOrderSubmitting()"
          (placeOrder)="onQuickOrderSubmit($event)"
          (cancelOrder)="onQuickOrderCancel()">
        </app-quick-order>
      }
    </p-dialog>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .blurred-price {
      filter: blur(4px);
      user-select: none;
      pointer-events: none;
    }

    /* Dialog styling for quick order */
    :host ::ng-deep .quick-order-dialog .p-dialog {
      border-radius: 0;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: none;
      background: white;
    }

    :host ::ng-deep .quick-order-dialog .p-dialog-content {
      padding: 0;
      overflow: hidden;
      background: white;
      border-radius: 0;
    }

    :host ::ng-deep .quick-order-dialog .p-dialog-mask {
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }

    /* Desktop dialog styling */
    @media (min-width: 1024px) {
      :host ::ng-deep .quick-order-dialog .p-dialog {
        border-radius: 16px;
        margin: 1rem;
      }

      :host ::ng-deep .quick-order-dialog .p-dialog-content {
        border-radius: 16px;
      }
    }

    /* Mobile dialog styling */
    @media (max-width: 1023px) {
      :host ::ng-deep .quick-order-dialog .p-dialog {
        width: 100vw !important;
        height: 100vh !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
        top: 0 !important;
        left: 0 !important;
        transform: none !important;
      }
    }

    /* Animation enhancements */
    :host ::ng-deep .quick-order-dialog .p-dialog {
      animation: dialogFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes dialogFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  // Services
  private readonly cartStore = inject(CartStore);
  private readonly toastStore = inject(ToastStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  // Inputs
  readonly product = input.required<Shoe>();
  readonly viewMode = input.required<ViewMode>();
  readonly imageSize = input<ImageSize>('medium');
  readonly sizeSystem = input<'eu' | 'us'>('eu');
  readonly sizeTemplates = input<SizeTemplate[]>([]);
  readonly isMobile = input<boolean>(false);

  // Outputs
  readonly addToCart = output<Shoe>();
  readonly viewDetails = output<Shoe>();

  // Dialog state
  protected readonly showQuickOrderDialog = signal(false);
  protected readonly isOrderSubmitting = signal(false);

  // Authentication
  protected readonly isAuthenticated = this.authStore.isAuthenticated;

  // Event handlers
  protected onAddToCart(): void {
    const shoe = this.product();
    // For Shoe interface, we need to check if any size has stock
    const hasStock = shoe.sizes && shoe.sizes.some((size: { quantity: number }) => size.quantity > 0);
    if (hasStock) {
      this.addToCart.emit(shoe);
    }
  }

  protected onViewDetails(): void {
    this.viewDetails.emit(this.product());
  }

  // Quick Order methods
  protected onQuickOrder(): void {
    if (!this.isAuthenticated()) {
      // Redirect to sign-in page for unauthenticated users
      this.router.navigate(['/sign-in']);
      return;
    }

    // Show the quick order dialog for authenticated users
    if (this.hasStock()) {
      this.showQuickOrderDialog.set(true);
    }
  }

  protected onQuickOrderSubmit(orderData: OrderData): void {
    this.isOrderSubmitting.set(true);

    // Process the order data - add each item to cart
    const product = this.product();

    orderData.items.forEach(item => {
      const itemRequest: AddToCartRequest = {
        productId: orderData.productId,
        productCode: product.code,
        productName: product.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        suppressToast: true // Suppress individual toasts, we'll show a consolidated one
      };
      this.cartStore.addToCart(itemRequest);
    });

    // Calculate total items for the success message
    const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);

    // Show success message with View Cart action
    this.toastStore.showSuccess(
      `Added ${totalItems} ${totalItems === 1 ? 'item' : 'items'} to cart`,
      5000,
      {
        label: 'View Cart',
        handler: () => {
          this.router.navigate(['/cart']);
        }
      }
    );
    this.isOrderSubmitting.set(false);
    this.showQuickOrderDialog.set(false);
  }

  protected onQuickOrderCancel(): void {
    this.showQuickOrderDialog.set(false);
    this.isOrderSubmitting.set(false);
  }

  // Helper methods
  protected hasStock(): boolean {
    const shoe = this.product();
    return shoe.sizes && shoe.sizes.some((size: { quantity: number }) => size.quantity > 0);
  }

  protected getAvailableSizes(): number[] {
    const shoe = this.product();
    if (!shoe.sizes || shoe.sizes.length === 0) return [];
    return shoe.sizes
      .filter((size: { quantity: number }) => size.quantity > 0)
      .map((size: { size: number }) => size.size)
      .sort((a: number, b: number) => a - b);
  }

  protected getSizeRange(): string {
    const shoe = this.product();
    if (!shoe.sizes || shoe.sizes.length === 0) return 'No sizes';

    const sizes = shoe.sizes.map((s: { size: number }) => s.size).sort((a: number, b: number) => a - b);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);

    if (this.sizeSystem() === 'us') {
      const template = this.sizeTemplates().find(t => t.id === shoe.templateId);
      if (template) {
        const minUs = template.pairs.find(p => p.eu === minSize)?.us;
        const maxUs = template.pairs.find(p => p.eu === maxSize)?.us;
        if (minUs && maxUs) {
          return minSize === maxSize ? `${minUs} US` : `${minUs}-${maxUs} US`;
        }
      }
    }

    return minSize === maxSize ? `${minSize} EU` : `${minSize}-${maxSize} EU`;
  }
}
