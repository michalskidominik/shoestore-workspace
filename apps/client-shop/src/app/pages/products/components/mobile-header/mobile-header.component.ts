import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule, BadgeModule],
  template: `
    <div class="lg:hidden bg-white border-b border-slate-200 shadow-sm">
      <!-- Main Header Row -->
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex-1">
          <h1 class="text-lg font-bold text-slate-900">Product Catalog</h1>
          <p class="text-sm text-slate-600">{{ productCount() }} products available</p>
        </div>
        <button
          type="button"
          (click)="toggleFilters.emit()"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          [attr.aria-expanded]="showFilters()"
          aria-label="Toggle filters">
          <i class="pi pi-filter text-sm"></i>
          <span>Filters</span>
          @if (hasActiveFilters()) {
            <p-badge value="!" severity="warn" styleClass="!bg-orange-500 !text-white !text-xs !min-w-[16px] !h-[16px]"></p-badge>
          }
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileHeaderComponent {
  // Inputs
  readonly productCount = input.required<number>();
  readonly showFilters = input.required<boolean>();
  readonly hasActiveFilters = input.required<boolean>();

  // Outputs
  readonly toggleFilters = output<void>();
}
