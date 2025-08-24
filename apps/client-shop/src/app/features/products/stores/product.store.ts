import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { ProductApiService, ProductCategory, ProductFilters } from '../../../shared/services/product-api.service';

interface ProductState {
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
  sizeTemplates: SizeTemplate[];
  categories: ProductCategory[];
  brands: string[];
  brandStats: Record<string, number>;
  filteredProducts: Shoe[]; // Store filtered products from service
}

const initialFilters: ProductFilters = {
  searchTerm: '',
  selectedBrands: [],
  selectedCategories: [],
  selectedAvailability: [],
  sortBy: 'name-asc',
  sizeSystem: 'eu'
};

const initialState: ProductState = {
  isLoading: false,
  error: null,
  filters: initialFilters,
  sizeTemplates: [],
  categories: [],
  brands: [],
  brandStats: {},
  filteredProducts: []
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Shoe>(),
  withComputed(({ filteredProducts, filters, brands, brandStats }) => ({
    // Brand options with counts for filter UI
    brandOptions: computed(() => {
      const brandList = brands();
      const stats = brandStats();
      return [
        { label: 'All Brands', value: 'all' },
        ...brandList.map(brand => ({
          label: brand,
          value: brand.toLowerCase(),
          count: stats[brand] || 0
        }))
      ];
    }),

    // Active filters for display chips
    activeFilters: computed(() => {
      const currentFilters = filters();
      const activeList: Array<{type: string, label: string, value: string, displayValue: string}> = [];

      if (currentFilters.searchTerm) {
        activeList.push({
          type: 'search',
          label: 'Search',
          value: 'search',
          displayValue: currentFilters.searchTerm
        });
      }

      currentFilters.selectedBrands.forEach(brand => {
        activeList.push({
          type: 'brand',
          label: 'Brand',
          value: brand,
          displayValue: brand
        });
      });

      currentFilters.selectedCategories.forEach(category => {
        activeList.push({
          type: 'category',
          label: 'Category',
          value: category,
          displayValue: category
        });
      });

      return activeList;
    }),

    hasActiveFilters: computed(() => {
      const currentFilters = filters();
      return currentFilters.searchTerm !== '' ||
             currentFilters.selectedBrands.length > 0 ||
             currentFilters.selectedCategories.length > 0 ||
             currentFilters.selectedAvailability.length > 0;
    })
  })),
  withMethods((store, productApiService = inject(ProductApiService)) => ({
    // Load products with error handling
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => 
          productApiService.getAllProducts().pipe(
            tapResponse({
              next: (products) => {
                patchState(store, setAllEntities(products));
                patchState(store, { isLoading: false });
              },
              error: (error: Error) => patchState(store, { 
                isLoading: false,
                error: error.message || 'Failed to load products' 
              })
            })
          )
        )
      )
    ),

    // Load filtered products from service based on current filters
    refreshFilteredProducts: rxMethod<void>(
      pipe(
        switchMap(() => {
          const currentFilters = store.filters();
          return productApiService.getFilteredAndSortedProducts(currentFilters).pipe(
            tapResponse({
              next: (filteredProducts) => patchState(store, { filteredProducts }),
              error: (error: Error) => patchState(store, { 
                error: error.message || 'Failed to load filtered products' 
              })
            })
          );
        })
      )
    ),

    // Load supporting data (categories, brands, etc.)
    loadSupportingData: rxMethod<void>(
      pipe(
        switchMap(() => 
          forkJoin({
            categories: productApiService.getCategories(),
            brands: productApiService.getBrands(),
            brandStats: productApiService.getBrandStats(),
            sizeTemplates: productApiService.getSizeTemplates()
          }).pipe(
            tapResponse({
              next: (data) => patchState(store, {
                categories: data.categories,
                brands: data.brands,
                brandStats: data.brandStats,
                sizeTemplates: data.sizeTemplates
              }),
              error: (error: Error) => patchState(store, { 
                error: error.message || 'Failed to load supporting data' 
              })
            })
          )
        )
      )
    ),

    // Debounced search
    searchProducts: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((searchTerm) => {
          patchState(store, { 
            filters: { ...store.filters(), searchTerm } 
          });
        })
      )
    ),

    // Filter management methods
    updateFilter<K extends keyof ProductFilters>(
      filterKey: K, 
      value: ProductFilters[K]
    ): void {
      patchState(store, {
        filters: { ...store.filters(), [filterKey]: value }
      });
    },

    clearFilter(filterType: 'search' | 'brand' | 'category' | 'availability', value?: string): void {
      const currentFilters = store.filters();
      const updatedFilters = { ...currentFilters };

      switch (filterType) {
        case 'search':
          updatedFilters.searchTerm = '';
          break;
        case 'brand':
          if (value) {
            updatedFilters.selectedBrands = currentFilters.selectedBrands.filter(b => b !== value);
          }
          break;
        case 'category':
          if (value) {
            updatedFilters.selectedCategories = currentFilters.selectedCategories.filter(c => c !== value);
          }
          break;
        case 'availability':
          if (value) {
            updatedFilters.selectedAvailability = currentFilters.selectedAvailability.filter(a => a !== value);
          }
          break;
      }

      patchState(store, { filters: updatedFilters });
    },

    clearAllFilters(): void {
      patchState(store, { filters: initialFilters });
    },

    getSizeTemplate(templateId: number) {
      return store.sizeTemplates().find(template => template.id === templateId);
    }
  }))
);