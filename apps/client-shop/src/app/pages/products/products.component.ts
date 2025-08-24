import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, computed, signal, effect, ChangeDetectionStrategy, inject, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
// Models and services
import { Shoe, SizeTemplate, SizeAvailability } from '@shoestore/shared-models';
import { ProductService, ProductFilters, ProductSort } from '../../shared/services/product.service';
import { CartService, AddToCartRequest } from '../../shared/services/cart.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
// Import order component
import { QuickOrderComponent, OrderData } from './components/quick-order/quick-order.component';
// Import new components
import {
  MobileHeaderComponent,
  MobileControlsComponent,
  ActiveFiltersBarComponent,
  FilterSidebarComponent,
  MobileFiltersOverlayComponent,
  ProductGridComponent
} from './components';

interface SortOption {
  label: string;
  value: string;
  icon: string;
}

interface BrandOption {
  label: string;
  value: string;
  count?: number;
}

interface SizeSystemOption {
  label: string;
  value: 'eu' | 'us';
}

interface ViewOption {
  label: string;
  value: 'grid' | 'list';
  icon: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DataViewModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    ToggleButtonModule,
    ButtonModule,
    ProgressSpinnerModule,
    BadgeModule,
    TagModule,
    InputGroupModule,
    InputGroupAddonModule,
    ChipModule,
    DialogModule,
    // Order component
    QuickOrderComponent,
    // New component imports
    MobileHeaderComponent,
    MobileControlsComponent,
    ActiveFiltersBarComponent,
    FilterSidebarComponent,
    MobileFiltersOverlayComponent,
    ProductGridComponent
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  // Dependency injection using inject() function
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Authentication
  protected readonly isAuthenticated = this.authService.isAuthenticated;

  // State signals
  protected readonly allShoes = signal<Shoe[]>([]);
  protected readonly sizeTemplates = signal<SizeTemplate[]>([]);
  protected readonly brands = signal<string[]>([]);
  protected readonly brandStats = signal<Record<string, number>>({});
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filterLoading = signal(false);

  // Mobile dialog state
  protected readonly showMobileOrderDialog = signal(false);
  protected readonly selectedProductForOrder = signal<Shoe | null>(null);
  protected readonly orderDialogSubmitting = signal(false);
  protected readonly isMobile = signal(false);

  // Filter signals
  protected readonly searchTerm = signal('');
  protected readonly selectedBrands = signal<string[]>([]);
  protected readonly selectedSort = signal('name-asc');
  protected readonly sizeSystem = signal<'eu' | 'us'>('eu');
  protected readonly currentView = signal<'grid' | 'list'>('grid');
  protected readonly itemsPerPage = signal(12);

  // Search debouncing
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Mobile sidebar state
  protected readonly showMobileFilters = signal(false);

  // Computed values
  protected readonly filteredShoes = computed(() => this.allShoes());

  protected readonly brandOptions = computed<BrandOption[]>(() => {
    const brands = this.brands();
    const brandCounts = this.brandStats();

    return [
      { label: 'All Brands', value: 'all' },
      ...brands.map(brand => ({
        label: brand,
        value: brand.toLowerCase(),
        count: brandCounts[brand] || 0
      }))
    ];
  });

  protected readonly hasActiveFilters = computed(() => {
    return this.searchTerm() !== '' ||
           this.selectedBrands().length > 0;
  });

  // Active filters for display
  protected readonly activeFilters = computed(() => {
    const filters: Array<{type: string, label: string, value: string, displayValue: string}> = [];

    // Search filter
    if (this.searchTerm()) {
      filters.push({
        type: 'search',
        label: 'Search',
        value: 'search',
        displayValue: this.searchTerm()
      });
    }

    // Brand filters
    this.selectedBrands().forEach(brand => {
      const brandOption = this.brandOptions().find(b => b.value === brand);
      filters.push({
        type: 'brand',
        label: 'Brand',
        value: brand,
        displayValue: brandOption?.label || brand
      });
    });

    return filters;
  });

  readonly sortOptions: SortOption[] = [
    { label: 'Name A-Z', value: 'name-asc', icon: 'pi pi-sort-alpha-down' },
    { label: 'Name Z-A', value: 'name-desc', icon: 'pi pi-sort-alpha-up' },
    { label: 'Price Low to High', value: 'price-asc', icon: 'pi pi-sort-numeric-down' },
    { label: 'Price High to Low', value: 'price-desc', icon: 'pi pi-sort-numeric-up' },
    { label: 'Sort By Stock Descending', value: 'stock-desc', icon: 'pi pi-box' },
    { label: 'Sort By Stock Ascending', value: 'stock-asc', icon: 'pi pi-box' }
  ];

  readonly sizeSystemOptions: SizeSystemOption[] = [
    { label: 'EU', value: 'eu' },
    { label: 'US', value: 'us' }
  ];

  readonly viewOptions: ViewOption[] = [
    { label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
    { label: 'List', value: 'list', icon: 'pi pi-list' }
  ];

  readonly itemsPerPageOptions = [
    { label: '12 per page', value: 12 },
    { label: '24 per page', value: 24 },
    { label: '48 per page', value: 48 }
  ];

  constructor() {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
    });

    // Initialize mobile detection
    this.checkIsMobile();

    // Watch for filter changes and reload data
    effect(() => {
      // Track all filter changes
      this.searchTerm();
      this.selectedBrands();
      this.selectedSort();

      // Only reload if we have initial data (avoid loading on component init)
      if (this.brands().length > 0) {
        this.loadFilteredProducts();
      }
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load all static data using modern async/await pattern
    this.loadStaticData()
      .then(() => this.loadFilteredProducts())
      .catch(error => {
        console.error('Error loading initial data:', error);
        this.error.set('Failed to load product data. Please try again.');
        this.loading.set(false);
      });
  }

  private async loadStaticData(): Promise<void> {
    try {
      const [templates, brands, brandStats] = await Promise.all([
        this.productService.getSizeTemplates().toPromise(),
        this.productService.getBrands().toPromise(),
        this.productService.getBrandStats().toPromise()
      ]);

      this.sizeTemplates.set(templates || []);
      this.brands.set(brands || []);
      this.brandStats.set(brandStats || {});
    } catch (error) {
      throw new Error(`Failed to load static data: ${error}`);
    }
  }

  private loadFilteredProducts(): void {
    const filters = this.buildFilters();
    const sort = this.buildSort();

    this.productService.getShoes(filters, sort)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shoes) => {
          this.allShoes.set(shoes);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.error.set('Failed to load products. Please try again.');
          this.loading.set(false);
        }
      });
  }

  private buildFilters(): ProductFilters {
    return {
      searchTerm: this.searchTerm() || undefined,
      brands: this.selectedBrands().length > 0 ? this.selectedBrands() : undefined,
    };
  }

  private buildSort(): ProductSort {
    const [sortField, sortDirection] = this.selectedSort().split('-');
    return {
      field: sortField as 'name' | 'price' | 'code' | 'stock',
      direction: sortDirection as 'asc' | 'desc'
    };
  }

  private checkIsMobile(): void {
    this.isMobile.set(window.innerWidth < 1024); // lg breakpoint
  }

  // ============================================
  // MOBILE DIALOG METHODS
  // ============================================

  protected onMobileOrder(product: Shoe): void {
    // Show order dialog for both desktop and mobile
    this.selectedProductForOrder.set(product);
    this.showMobileOrderDialog.set(true);
  }

  protected onMobileOrderSubmit(orderData: OrderData): void {
    const selectedProduct = this.selectedProductForOrder();
    if (!selectedProduct) return;

    this.orderDialogSubmitting.set(true);

    const request: AddToCartRequest = {
      productId: orderData.productId,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      items: orderData.items
    };

    this.cartService.addToCart(request).subscribe({
      next: () => {
        this.orderDialogSubmitting.set(false);
        this.showMobileOrderDialog.set(false);
        this.selectedProductForOrder.set(null);

        // Show success toast
        const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
        this.toastService.showSuccess(
          `Added ${totalItems} items to cart`,
          5000,
          {
            label: 'View Cart',
            handler: () => {
              this.router.navigate(['/cart']);
            }
          }
        );
      },
      error: (error) => {
        this.orderDialogSubmitting.set(false);
        this.toastService.showError(
          'Failed to add items to cart. Please try again.',
          7000
        );
        console.error('Failed to add to cart:', error);
      }
    });
  }

  protected onMobileOrderCancel(): void {
    this.showMobileOrderDialog.set(false);
    this.selectedProductForOrder.set(null);
    this.orderDialogSubmitting.set(false);
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkIsMobile();
  }

  // ============================================
  // PUBLIC METHODS - Template access
  // ============================================

  protected onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedBrands.set([]);
  }

  protected onQuickOrder(shoe: Shoe): void {
    // This is for the simple "Add to Cart" button (not quick order form)
    // The quick order form is handled entirely within ProductCardComponent
    const hasStock = shoe.sizes && shoe.sizes.some((size: SizeAvailability) => size.quantity > 0);

    if (!hasStock) {
      this.toastService.showError('This product is out of stock');
      return;
    }

    // For simple add to cart, add the first available size with quantity 1
    const availableSize = shoe.sizes.find((size: SizeAvailability) => size.quantity > 0);
    if (!availableSize) {
      this.toastService.showError('No sizes available');
      return;
    }

    const addToCartRequest: AddToCartRequest = {
      productId: shoe.id,
      productCode: shoe.code,
      productName: shoe.name,
      items: [{
        size: availableSize.size,
        quantity: 1,
        unitPrice: availableSize.price
      }]
    };

    this.cartService.addToCart(addToCartRequest).subscribe({
      next: () => {
        this.toastService.showSuccess(
          `Added ${shoe.name} to cart`,
          5000,
          {
            label: 'View Cart',
            handler: () => {
              this.router.navigate(['/cart']);
            }
          }
        );
      },
      error: (error) => {
        console.error('Error adding item to cart:', error);
        this.toastService.showError(`Failed to add ${shoe.name} to cart`);
      }
    });
  }

  protected onViewDetails(shoe: Shoe): void {
    // TODO: Implement view details functionality
    console.log('View details for:', shoe.name);
  }

  protected retryLoad(): void {
    this.loadInitialData();
  }

  protected toggleMobileFilters(): void {
    this.showMobileFilters.update(current => !current);
  }

  // ============================================
  // UTILITY METHODS - UI calculations
  // ============================================

  protected getMinPrice(shoe: Shoe): number {
    if (!shoe.sizes || shoe.sizes.length === 0) return 0;
    return Math.min(...shoe.sizes.map(size => size.price));
  }

  protected getMaxPrice(shoe: Shoe): number {
    if (!shoe.sizes || shoe.sizes.length === 0) return 0;
    return Math.max(...shoe.sizes.map(size => size.price));
  }

  protected getPriceRange(shoe: Shoe): string {
    const min = this.getMinPrice(shoe);
    const max = this.getMaxPrice(shoe);

    if (min === 0 && max === 0) return 'Price not available';

    return min === max ? `€${min.toFixed(2)}` : `€${min.toFixed(2)} - €${max.toFixed(2)}`;
  }

  protected getSizeRange(shoe: Shoe): string {
    if (!shoe.sizes || shoe.sizes.length === 0) return 'No sizes available';

    const sizes = shoe.sizes.map(size => size.size).sort((a, b) => a - b);
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

  protected getTotalQuantity(shoe: Shoe): number {
    if (!shoe.sizes || shoe.sizes.length === 0) return 0;
    return shoe.sizes.reduce((total, size) => total + size.quantity, 0);
  }

  protected getAvailableSizes(shoe: Shoe): number {
    if (!shoe.sizes || shoe.sizes.length === 0) return 0;
    return shoe.sizes.filter(size => size.quantity > 0).length;
  }

  protected getStockStatus(shoe: Shoe): { label: string; severity: string; icon: string } {
    const total = this.getTotalQuantity(shoe);

    if (total === 0) {
      return { label: 'Out of Stock', severity: 'danger', icon: 'pi pi-times-circle' };
    } else if (total <= 10) {
      return { label: 'Low Stock', severity: 'warning', icon: 'pi pi-exclamation-triangle' };
    } else if (total <= 50) {
      return { label: 'In Stock', severity: 'success', icon: 'pi pi-check-circle' };
    } else {
      return { label: 'High Stock', severity: 'info', icon: 'pi pi-check-circle' };
    }
  }

  // ============================================
  // VIEW AND SIZE SYSTEM VALIDATION METHODS
  // ============================================

  protected onViewChange(newView: 'grid' | 'list'): void {
    // Ensure view is always valid - prevent deselection
    if (newView && (newView === 'grid' || newView === 'list')) {
      this.currentView.set(newView);
    } else {
      // Fallback to current value or default if invalid
      const current = this.currentView();
      if (!current || (current !== 'grid' && current !== 'list')) {
        this.currentView.set('grid'); // Default fallback
      }
    }
  }

  protected onSizeSystemChange(newSizeSystem: 'eu' | 'us'): void {
    // Ensure size system is always valid - prevent deselection
    if (newSizeSystem && (newSizeSystem === 'eu' || newSizeSystem === 'us')) {
      this.sizeSystem.set(newSizeSystem);
    } else {
      // Fallback to current value or default if invalid
      const current = this.sizeSystem();
      if (!current || (current !== 'eu' && current !== 'us')) {
        this.sizeSystem.set('eu'); // Default fallback
      }
    }
  }

  // ============================================
  // MULTI-SELECT FILTER METHODS
  // ============================================

  protected toggleBrandFilter(brandValue: string): void {
    this.filterLoading.set(true);
    const current = this.selectedBrands();
    const index = current.indexOf(brandValue);

    if (index === -1) {
      this.selectedBrands.set([...current, brandValue]);
    } else {
      this.selectedBrands.set(current.filter(b => b !== brandValue));
    }

    // Reset loading after a brief delay to show feedback
    setTimeout(() => this.filterLoading.set(false), 300);
  }

  protected isBrandSelected(brandValue: string): boolean {
    return this.selectedBrands().includes(brandValue);
  }

  protected onRemoveFilter(event: {type: string, value: string}): void {
    if (event.type === 'search') {
      this.searchTerm.set('');
    } else if (event.type === 'brand') {
      const current = this.selectedBrands();
      this.selectedBrands.set(current.filter(b => b !== event.value));
    }
  }
}
