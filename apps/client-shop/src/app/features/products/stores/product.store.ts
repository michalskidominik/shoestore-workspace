import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { ProductService, ProductCategory } from '../../../shared/services/product.service';

export interface ProductFilters {
  searchTerm: string;
  selectedBrands: string[];
  selectedCategories: string[];
  selectedAvailability: string[];
  sortBy: string;
  sizeSystem: 'eu' | 'us';
}

interface ProductState {
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
  sizeTemplates: SizeTemplate[];
  categories: ProductCategory[];
  brands: string[];
  brandStats: Record<string, number>;
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
  brandStats: {}
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Shoe>(),
  withComputed(({ entities, filters, brands, brandStats }) => ({
    // Advanced computed filtered products
    filteredProducts: computed(() => {
      const allProducts = entities();
      const currentFilters = filters();
      
      let filtered = allProducts.filter(product => {
        // Search filter
        if (currentFilters.searchTerm) {
          const searchTerm = currentFilters.searchTerm.toLowerCase();
          if (!product.name.toLowerCase().includes(searchTerm) && 
              !product.code.toLowerCase().includes(searchTerm)) {
            return false;
          }
        }

        // Brand filter
        if (currentFilters.selectedBrands.length > 0) {
          const productBrand = product.name.split(' ')[0].toLowerCase();
          if (!currentFilters.selectedBrands.some(brand => 
            brand.toLowerCase() === productBrand)) {
            return false;
          }
        }

        // Category filter
        if (currentFilters.selectedCategories.length > 0) {
          if (!currentFilters.selectedCategories.includes(product.category || 'sneakers')) {
            return false;
          }
        }

        // Availability filter
        if (currentFilters.selectedAvailability.length > 0) {
          const totalStock = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
          const hasAvailability = currentFilters.selectedAvailability.some(availability => {
            switch (availability) {
              case 'in-stock': return totalStock > 50;
              case 'low-stock': return totalStock > 0 && totalStock <= 50;
              case 'pre-order': return totalStock === 0;
              case 'made-to-order': return product.name.toLowerCase().includes('custom');
              default: return false;
            }
          });
          if (!hasAvailability) return false;
        }

        return true;
      });

      // Apply sorting
      const [sortField, sortDirection] = currentFilters.sortBy.split('-');
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            const priceA = Math.min(...a.sizes.map(size => size.price));
            const priceB = Math.min(...b.sizes.map(size => size.price));
            comparison = priceA - priceB;
            break;
          case 'stock':
            const stockA = a.sizes.reduce((sum, size) => sum + size.quantity, 0);
            const stockB = b.sizes.reduce((sum, size) => sum + size.quantity, 0);
            comparison = stockA - stockB;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });

      return filtered;
    }),

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
  withMethods((store, productService = inject(ProductService)) => ({
    // Load products with error handling
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => 
          productService.getShoes().pipe(
            tapResponse({
              next: (products) => {
                setAllEntities(products, store);
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

    // Load supporting data (categories, brands, etc.)
    loadSupportingData: rxMethod<void>(
      pipe(
        switchMap(() => 
          forkJoin({
            categories: productService.getCategories(),
            brands: productService.getBrands(),
            brandStats: productService.getBrandStats(),
            sizeTemplates: productService.getSizeTemplates()
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