import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';

interface BrandOption {
  label: string;
  value: string;
  count?: number;
}

interface ActiveFilter {
  type: string;
  label: string;
  value: string;
  displayValue: string;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, InputGroupModule, InputGroupAddonModule, InputTextModule],
  template: `
    <!-- Desktop Sidebar (Always Visible) -->
    <div class="hidden lg:block bg-white border-r border-slate-200 h-full">
      <div class="p-6 h-full flex flex-col">
        <!-- Sidebar Header -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Filter Products</h2>
          <p class="text-sm text-slate-600">Refine your product search</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-50 rounded-lg p-3 text-center">
            <div class="text-lg font-bold text-blue-600">{{ totalProducts() }}</div>
            <div class="text-xs text-slate-600">Total Products</div>
          </div>
          <div class="bg-slate-50 rounded-lg p-3 text-center">
            <div class="text-lg font-bold text-green-600">{{ filteredProducts() }}</div>
            <div class="text-xs text-slate-600">Available</div>
          </div>
        </div>

        <!-- Search -->
        <div class="mb-6">
          <div class="text-sm font-semibold text-slate-700 mb-2">Search</div>
          <p-inputGroup>
            <p-inputGroupAddon>
              <i class="pi pi-search text-slate-500"></i>
            </p-inputGroupAddon>
            <input
              type="text"
              pInputText
              placeholder="Product name or code..."
              [ngModel]="searchTerm()"
              (ngModelChange)="searchChange.emit($event)"
              class="flex-1 !border-l-0 focus:!border-blue-500 !text-sm"
              aria-label="Search products">
            @if (searchTerm()) {
              <p-inputGroupAddon class="cursor-pointer hover:bg-slate-50" (click)="clearSearch.emit()">
                <i class="pi pi-times text-slate-400"></i>
              </p-inputGroupAddon>
            }
          </p-inputGroup>
        </div>

        <!-- Brand Filter -->
        <div class="mb-6 flex-1 flex flex-col min-h-0">
          <div class="text-sm font-semibold text-slate-700 mb-3">Brand</div>
          <div class="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 pr-2">
            @for (brand of brandOptions(); track brand.value) {
              @if (brand.value !== 'all') {
                <label class="flex items-center justify-between cursor-pointer group">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      [checked]="isBrandSelected(brand.value)"
                      (change)="toggleBrand.emit(brand.value)"
                      class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded">
                    <span class="ml-3 text-sm text-slate-700 group-hover:text-slate-900">{{ brand.label }}</span>
                  </div>
                  @if (brand.count) {
                    <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{{ brand.count }}</span>
                  }
                </label>
              }
            }
          </div>
        </div>

        <!-- Active Filters -->
        @if (hasActiveFilters()) {
          <div class="border-t border-slate-200 pt-4 mt-auto flex-shrink-0">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-semibold text-slate-700">Active Filters</span>
              <button
                type="button"
                (click)="clearAllFilters.emit()"
                class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Clear All
              </button>
            </div>
            <div class="space-y-2">
              @for (filter of activeFilters(); track filter.type + '-' + filter.value) {
                <div class="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                  <span class="text-sm text-blue-800">{{ filter.label }}: {{ filter.displayValue }}</span>
                  <button
                    type="button"
                    (click)="removeFilter.emit({type: filter.type, value: filter.value})"
                    class="text-blue-600 hover:text-blue-800">
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterSidebarComponent {
  // Inputs
  readonly totalProducts = input.required<number>();
  readonly filteredProducts = input.required<number>();
  readonly searchTerm = input.required<string>();
  readonly brandOptions = input.required<BrandOption[]>();
  readonly selectedBrands = input.required<string[]>();
  readonly activeFilters = input.required<ActiveFilter[]>();
  readonly hasActiveFilters = input.required<boolean>();

  // Outputs
  readonly searchChange = output<string>();
  readonly clearSearch = output<void>();
  readonly toggleBrand = output<string>();
  readonly removeFilter = output<{type: string, value: string}>();
  readonly clearAllFilters = output<void>();

  // Helper methods for template
  isBrandSelected(brandValue: string): boolean {
    return this.selectedBrands().includes(brandValue);
  }
}
