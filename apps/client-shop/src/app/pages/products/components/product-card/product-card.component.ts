import { CommonModule } from '@angular/common';
import { Component, input, output, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { QuickOrderComponent, OrderData } from '../quick-order/quick-order.component';
import { CartService, AddToCartRequest } from '../../../../shared/services/cart.service';
import { ToastService } from '../../../../shared/services/toast.service';

type ViewMode = 'grid' | 'list' | 'large' | 'compact';
type ImageSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, RatingModule, FormsModule, QuickOrderComponent],
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
            <p-button
              icon="pi pi-eye"
              severity="primary"
              [rounded]="true"
              size="small"
              (onClick)="onViewDetails()"
              [attr.aria-label]="'View details for ' + product().name"
              styleClass="!w-8 !h-8 lg:!w-10 lg:!h-10">
            </p-button>
            <p-button
              icon="pi pi-shopping-cart"
              severity="success"
              [rounded]="true"
              size="small"
              (onClick)="onAddToCart()"
              [disabled]="!hasStock()"
              [attr.aria-label]="'Order ' + product().name"
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
            <div class="text-sm lg:text-base font-bold text-blue-600">{{ getPriceRange() }}</div>
          </div>

          <!-- Size & Stock Info with Actions - Mobile optimized -->
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
              <div class="flex items-center gap-3 text-xs text-slate-600">
                <span>{{ getSizeRange() }}</span>
                <span>{{ getAvailableSizes().length }} sizes</span>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <div class="text-sm font-bold text-blue-600 mb-1">{{ getPriceRange() }}</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-2">
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
            <p-button
              label="Order"
              icon="pi pi-plus"
              severity="primary"
              size="small"
              [disabled]="!hasStock()"
              styleClass="!text-xs !py-1.5 !px-3"
              (onClick)="onAddToCart()">
            </p-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  // Services
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);

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
    // Always emit addToCart event to trigger modal dialog for both desktop and mobile
    this.onAddToCart();
  }

  // Helper methods
  protected getDiscountPercentage(): number {
    const product = this.product();
    if (!product.sizes || product.sizes.length === 0) return 0;

    // For now, return 0 as discount logic depends on business requirements
    // This could be implemented based on original price vs current price
    return 0;
  }

  protected hasStock(): boolean {
    const shoe = this.product();
    return shoe.sizes && shoe.sizes.some((size: { quantity: number }) => size.quantity > 0);
  }

  protected getTotalQuantity(): number {
    const shoe = this.product();
    if (!shoe.sizes || shoe.sizes.length === 0) return 0;
    return shoe.sizes.reduce((total: number, size: { quantity: number }) => total + size.quantity, 0);
  }

  protected getAvailableSizes(): number[] {
    const shoe = this.product();
    if (!shoe.sizes || shoe.sizes.length === 0) return [];
    return shoe.sizes
      .filter((size: { quantity: number }) => size.quantity > 0)
      .map((size: { size: number }) => size.size)
      .sort((a: number, b: number) => a - b);
  }

  protected getPriceRange(): string {
    const shoe = this.product();
    if (!shoe.sizes || shoe.sizes.length === 0) return 'Price not available';

    const prices = shoe.sizes.map((s: { price: number }) => s.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `€${minPrice.toFixed(2)}`;
    } else {
      return `€${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`;
    }
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

  protected getStockStatus(): { label: string; severity: string; icon: string } {
    const totalStock = this.getTotalQuantity();

    if (totalStock === 0) {
      return { label: 'Out of Stock', severity: 'danger', icon: 'pi pi-times-circle' };
    } else if (totalStock <= 5) {
      return { label: 'Low Stock', severity: 'warning', icon: 'pi pi-exclamation-triangle' };
    } else if (totalStock <= 20) {
      return { label: 'In Stock', severity: 'success', icon: 'pi pi-check-circle' };
    } else {
      return { label: 'Well Stocked', severity: 'info', icon: 'pi pi-check-circle' };
    }
  }
}
