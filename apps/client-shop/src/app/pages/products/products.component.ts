import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, computed, signal, effect, ChangeDetectionStrategy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
// Models and services
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { ProductService, ProductFilters, ProductSort, ProductCategory } from '../../shared/services/product.service';

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
    ButtonModule,
    ProgressSpinnerModule,
    BadgeModule,
    TagModule,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  // Dependency injection using inject() function
  private readonly productService = inject(ProductService);

  // State signals
  protected readonly allShoes = signal<Shoe[]>([]);
  protected readonly sizeTemplates = signal<SizeTemplate[]>([]);
  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly brands = signal<string[]>([]);
  protected readonly brandStats = signal<Record<string, number>>({});
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Filter signals
  protected readonly searchTerm = signal('');
  protected readonly selectedBrand = signal('all');
  protected readonly selectedCategory = signal('all');
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

  protected readonly categoryOptions = computed(() => this.categories());

  protected readonly hasActiveFilters = computed(() => {
    return this.searchTerm() !== '' ||
           this.selectedBrand() !== 'all' ||
           this.selectedCategory() !== 'all';
  });

  readonly sortOptions: SortOption[] = [
    { label: 'Name A-Z', value: 'name-asc', icon: 'pi pi-sort-alpha-down' },
    { label: 'Name Z-A', value: 'name-desc', icon: 'pi pi-sort-alpha-up' },
    { label: 'Price Low to High', value: 'price-asc', icon: 'pi pi-sort-numeric-down' },
    { label: 'Price High to Low', value: 'price-desc', icon: 'pi pi-sort-numeric-up' },
    { label: 'Stock Level', value: 'stock-desc', icon: 'pi pi-box' },
    { label: 'Product Code', value: 'code-asc', icon: 'pi pi-hashtag' }
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

    // Watch for filter changes and reload data
    effect(() => {
      // Track all filter changes
      this.searchTerm();
      this.selectedBrand();
      this.selectedCategory();
      this.selectedSort();

      // Only reload if we have initial data (avoid loading on component init)
      if (this.categories().length > 0) {
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
      const [templates, categories, brands, brandStats] = await Promise.all([
        this.productService.getSizeTemplates().toPromise(),
        this.productService.getCategories().toPromise(),
        this.productService.getBrands().toPromise(),
        this.productService.getBrandStats().toPromise()
      ]);

      this.sizeTemplates.set(templates || []);
      this.categories.set(categories || []);
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
      brand: this.selectedBrand() !== 'all' ? this.selectedBrand() : undefined,
      category: this.selectedCategory() !== 'all' ? this.selectedCategory() : undefined,
    };
  }

  private buildSort(): ProductSort {
    const [sortField, sortDirection] = this.selectedSort().split('-');
    return {
      field: sortField as 'name' | 'price' | 'code' | 'stock',
      direction: sortDirection as 'asc' | 'desc'
    };
  }

  // ============================================
  // PUBLIC METHODS - Template access
  // ============================================

  protected onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedBrand.set('all');
    this.selectedCategory.set('all');
    this.selectedSort.set('name-asc');
  }

  protected onQuickOrder(shoe: Shoe): void {
    // TODO: Implement quick order functionality
    console.log('Quick order for:', shoe.name);
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
}
