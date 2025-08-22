import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';

interface ActiveFilter {
  type: string;
  label: string;
  value: string;
  displayValue: string;
}

@Component({
  selector: 'app-active-filters-bar',
  standalone: true,
  imports: [CommonModule, BadgeModule, ChipModule],
  template: `
    <!-- Desktop Active Filters Bar -->
    <div class="hidden lg:block bg-white border border-slate-200 rounded-lg p-4 mb-4" *ngIf="hasActiveFilters()">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-filter text-slate-600 text-sm"></i>
          <span class="text-sm font-semibold text-slate-700">Active Filters</span>
          <p-badge
            [value]="activeFilters().length.toString()"
            severity="info"
            styleClass="!text-xs !min-w-[20px] !h-[20px]">
          </p-badge>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">
            @if (filterLoading()) {
              <i class="pi pi-spin pi-spinner text-xs mr-1"></i>
            }
            {{ productCount() }} products
          </span>
          <button
            type="button"
            (click)="clearAllFilters.emit()"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            aria-label="Clear all filters">
            <i class="pi pi-filter-slash text-xs"></i>
            Clear All
          </button>
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="flex flex-wrap gap-2">
        @for (filter of activeFilters(); track filter.type + '-' + filter.value) {
          <p-chip
            [label]="filter.label + ': ' + filter.displayValue"
            [removable]="true"
            (onRemove)="removeFilter.emit({type: filter.type, value: filter.value})"
            styleClass="!bg-blue-50 !text-blue-800 !border-blue-200 !text-sm !py-1 !px-3">
            <ng-template pTemplate="removeicon">
              <i class="pi pi-times text-blue-600 hover:text-blue-800 text-xs ml-2 cursor-pointer"></i>
            </ng-template>
          </p-chip>
        }
      </div>
    </div>

    <!-- Mobile Active Filters Bar -->
    <div class="lg:hidden bg-white border-b border-slate-200 px-4 py-3" *ngIf="hasActiveFilters()">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-700">Filters</span>
          <p-badge
            [value]="activeFilters().length.toString()"
            severity="info"
            styleClass="!text-xs !min-w-[16px] !h-[16px]">
          </p-badge>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-600">
            @if (filterLoading()) {
              <i class="pi pi-spin pi-spinner text-xs mr-1"></i>
            }
            {{ productCount() }} results
          </span>
          <button
            type="button"
            (click)="clearAllFilters.emit()"
            class="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Clear
          </button>
        </div>
      </div>

      <!-- Mobile Filter Chips - Scrollable -->
      <div class="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
        @for (filter of activeFilters(); track filter.type + '-' + filter.value) {
          <div class="flex-shrink-0 bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
            <span>{{ filter.label }}: {{ filter.displayValue }}</span>
            <button
              type="button"
              (click)="removeFilter.emit({type: filter.type, value: filter.value})"
              class="ml-1 text-blue-600 hover:text-blue-800">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveFiltersBarComponent {
  // Inputs
  readonly activeFilters = input.required<ActiveFilter[]>();
  readonly hasActiveFilters = input.required<boolean>();
  readonly productCount = input.required<number>();
  readonly filterLoading = input.required<boolean>();

  // Outputs
  readonly removeFilter = output<{type: string, value: string}>();
  readonly clearAllFilters = output<void>();
}
