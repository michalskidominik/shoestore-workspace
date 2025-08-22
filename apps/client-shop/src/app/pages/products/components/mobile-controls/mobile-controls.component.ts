import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectModule } from 'primeng/select';

interface ViewOption {
  label: string;
  value: 'grid' | 'list';
  icon: string;
}

interface SizeSystemOption {
  label: string;
  value: 'eu' | 'us';
}

interface SortOption {
  label: string;
  value: string;
  icon: string;
}

interface ItemsPerPageOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-mobile-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectButtonModule, ToggleButtonModule, SelectModule],
  template: `
    <!-- Mobile Controls - Normal positioning -->
    <div class="lg:hidden border-t border-slate-200 bg-slate-50 w-full">
      <!-- First Controls Row -->
      <div class="flex items-center justify-between px-4 py-3 gap-4">
        <!-- View Toggle -->
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm font-medium text-slate-700 whitespace-nowrap">View:</span>
          <p-selectButton
            [options]="viewOptions()"
            optionLabel="label"
            optionValue="value"
            [ngModel]="currentView()"
            (ngModelChange)="viewChange.emit($event)"
            styleClass="!text-sm">
          </p-selectButton>
        </div>

        <!-- Size System -->
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm font-medium text-slate-700 whitespace-nowrap">Size:</span>
          <p-selectButton
            [options]="sizeSystemOptions()"
            optionLabel="label"
            optionValue="value"
            [ngModel]="sizeSystem()"
            (ngModelChange)="sizeSystemChange.emit($event)"
            styleClass="!text-sm">
          </p-selectButton>
        </div>
      </div>

      <!-- Second Controls Row -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-slate-200 gap-4">
        <!-- Sort -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-sm font-medium text-slate-700 whitespace-nowrap">Sort:</span>
          <p-select
            [options]="sortOptions()"
            [ngModel]="selectedSort()"
            (ngModelChange)="sortChange.emit($event)"
            optionLabel="label"
            optionValue="value"
            styleClass="!w-full !text-sm"
            placeholder="Sort by">
          </p-select>
        </div>

        <!-- Items Per Page -->
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm font-medium text-slate-700 whitespace-nowrap">Show:</span>
          <p-select
            [options]="itemsPerPageOptions()"
            [ngModel]="itemsPerPage()"
            (ngModelChange)="itemsPerPageChange.emit($event)"
            optionLabel="label"
            optionValue="value"
            styleClass="!w-20 !text-sm">
          </p-select>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileControlsComponent {
  // Inputs
  readonly viewOptions = input.required<ViewOption[]>();
  readonly sizeSystemOptions = input.required<SizeSystemOption[]>();
  readonly sortOptions = input.required<SortOption[]>();
  readonly itemsPerPageOptions = input.required<ItemsPerPageOption[]>();
  readonly currentView = input.required<'grid' | 'list'>();
  readonly sizeSystem = input.required<'eu' | 'us'>();
  readonly selectedSort = input.required<string>();
  readonly itemsPerPage = input.required<number>();

  // Outputs
  readonly viewChange = output<'grid' | 'list'>();
  readonly sizeSystemChange = output<'eu' | 'us'>();
  readonly sortChange = output<string>();
  readonly itemsPerPageChange = output<number>();
}
