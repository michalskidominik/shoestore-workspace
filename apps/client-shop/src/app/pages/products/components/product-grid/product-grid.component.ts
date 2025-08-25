import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProductCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Desktop Grid -->
    <div class="hidden lg:block">
      <div
        class="transition-all duration-300"
        [ngClass]="viewMode() === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
          : 'space-y-3'">
        @for (product of filteredProducts(); track product.id) {
          <app-product-card
            [product]="product"
            [viewMode]="viewMode()"
            [imageSize]="imageSize()"
            [sizeTemplates]="sizeTemplates()"
            [isMobile]="isMobile()"
            (addToCart)="addToCart.emit(product)"
            (viewDetails)="viewDetails.emit(product)">
          </app-product-card>
        }
      </div>
    </div>

    <!-- Mobile Grid -->
    <div class="lg:hidden">
      <div
        class="transition-all duration-300"
        [ngClass]="mobileViewMode() === 'large'
          ? 'space-y-3'
          : 'grid grid-cols-2 gap-3'">
        @for (product of filteredProducts(); track product.id) {
          <app-product-card
            [product]="product"
            [viewMode]="mobileViewMode()"
            [imageSize]="mobileImageSize()"
            [sizeTemplates]="sizeTemplates()"
            [isMobile]="isMobile()"
            (addToCart)="mobileOrder.emit(product)"
            (viewDetails)="viewDetails.emit(product)">
          </app-product-card>
        }
      </div>
    </div>

    <!-- Empty State -->
    @if (filteredProducts().length === 0 && !isLoading()) {
      <div class="text-center py-20">
        <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="pi pi-search text-slate-400 text-3xl"></i>
        </div>
        <h3 class="text-xl font-semibold text-slate-900 mb-3">No Products Found</h3>
        <p class="text-slate-600 mb-6 max-w-md mx-auto">
          We couldn't find any products matching your current filters.
          Try adjusting your search criteria or clearing the filters.
        </p>
        <p-button
          label="Clear All Filters"
          icon="pi pi-filter-slash"
          severity="primary"
          (onClick)="clearFilters.emit()">
        </p-button>
      </div>
    }

    <!-- Loading State -->
    @if (isLoading()) {
      <div
        class="transition-all duration-300"
        [ngClass]="viewMode() === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
          : 'space-y-3'">
        @for (item of loadingItems; track $index) {
          <div class="group bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-pulse">
            <div class="aspect-square bg-slate-200"></div>
            <div class="p-3">
              <div class="h-4 bg-slate-200 rounded mb-2"></div>
              <div class="h-3 bg-slate-200 rounded w-2/3 mb-2"></div>
              <div class="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div class="flex gap-1">
                <div class="h-6 bg-slate-200 rounded flex-1"></div>
                <div class="h-6 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ProductGridComponent {
  // Inputs
  readonly filteredProducts = input.required<Shoe[]>();
  readonly viewMode = input.required<'grid' | 'list'>();
  readonly mobileViewMode = input.required<'large' | 'compact'>();
  readonly imageSize = input<'small' | 'medium' | 'large'>('medium');
  readonly mobileImageSize = input<'small' | 'medium' | 'large'>('small');
  readonly isLoading = input<boolean>(false);
  readonly sizeTemplates = input.required<SizeTemplate[]>();
  readonly isMobile = input<boolean>(false);

  // Outputs
  readonly addToCart = output<Shoe>();
  readonly viewDetails = output<Shoe>();
  readonly clearFilters = output<void>();
  readonly mobileOrder = output<Shoe>();

  // Loading skeleton items
  protected readonly loadingItems = Array(12).fill(0);
}
