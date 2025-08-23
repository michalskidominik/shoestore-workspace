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

@Component({
  selector: 'app-mobile-filters-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, InputGroupModule, InputGroupAddonModule, InputTextModule],
  template: `
    <!-- Mobile Filters Overlay -->
    <div
      class="lg:hidden fixed inset-0 z-50 transition-transform duration-300 ease-in-out"
      [class.translate-x-0]="showFilters()"
      [class.translate-x-full]="!showFilters()">

      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        (click)="toggleFilters.emit()"
        (keydown.enter)="toggleFilters.emit()"
        (keydown.space)="toggleFilters.emit()"
        tabindex="0"
        role="button"
        aria-label="Close filters"></div>

      <!-- Mobile Filters Panel -->
      <div class="absolute right-0 top-0 h-full w-80 max-w-[calc(100vw-2rem)] bg-white shadow-xl overflow-y-auto">
        <!-- Mobile Header -->
        <div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Filters</h3>
            <button
              type="button"
              (click)="toggleFilters.emit()"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close filters">
              <i class="pi pi-times text-slate-600"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Filters Content -->
        <div class="p-6">
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
          <div class="mb-6">
            <div class="text-sm font-semibold text-slate-700 mb-3">Brand</div>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              @for (brand of brandOptions(); track brand.value) {
                @if (brand.value !== 'all') {
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        [checked]="isBrandSelected(brand.value)"
                        (change)="toggleBrand.emit(brand.value)"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded">
                      <span class="ml-3 text-sm text-slate-700">{{ brand.label }}</span>
                    </div>
                    @if (brand.count) {
                      <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{{ brand.count }}</span>
                    }
                  </label>
                }
              }
            </div>
          </div>

          <!-- Apply/Clear Actions -->
          <div class="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              (click)="clearAllFilters.emit()"
              class="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              Clear All
            </button>
            <button
              type="button"
              (click)="toggleFilters.emit()"
              class="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileFiltersOverlayComponent {
  // Inputs
  readonly showFilters = input.required<boolean>();
  readonly searchTerm = input.required<string>();
  readonly brandOptions = input.required<BrandOption[]>();
  readonly selectedBrands = input.required<string[]>();

  // Outputs
  readonly toggleFilters = output<void>();
  readonly searchChange = output<string>();
  readonly clearSearch = output<void>();
  readonly toggleBrand = output<string>();
  readonly clearAllFilters = output<void>();

  // Helper methods for template
  isBrandSelected(brandValue: string): boolean {
    return this.selectedBrands().includes(brandValue);
  }
}
