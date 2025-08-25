import { Component, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

// Models and Services
import { Order, OrderStatus } from '@shoestore/shared-models';
import { OrderHistoryStore } from '../../features/orders/stores/order-history.store';
import { CurrencyPipe } from '../../shared/pipes';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    ProgressSpinnerModule,
    MessageModule,
    DividerModule,
    SkeletonModule,
    CurrencyPipe
  ],
  template: `
    <div class="orders-page min-h-screen bg-slate-50 md:py-4">
      <!-- Header Section (matches dashboard structure) -->
      <div class="px-4 sm:px-6 lg:px-8 py-4">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">My Orders</h1>
          <p class="text-slate-600">Track and manage your orders</p>
        </div>
      </div>

  <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <!-- Filters and Search -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="md:col-span-2">
              <label for="search" class="block text-sm font-medium text-slate-700 mb-2">Search Orders</label>
              <input
                id="search"
                type="text"
                pInputText
                placeholder="Search by order ID, email"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange($event)"
                class="w-full"
              />
            </div>

            <!-- Status Filter -->
            <div>
              <label for="status-filter" class="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
              <p-select
                id="status-filter"
                [options]="orderHistoryStore.getStatusOptions()"
                [(ngModel)]="selectedStatus"
                (onChange)="onStatusFilterChange($event.value)"
                placeholder="All statuses"
                [showClear]="true"
                styleClass="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Orders Content: Desktop Table / Mobile Cards -->
        <div class="bg-white rounded-lg shadow-sm">
          @if (orderHistoryStore.isLoading()) {
            <!-- Loading State -->
            <div class="p-6">
              <div class="space-y-4">
                @for (item of [1, 2, 3, 4, 5]; track item) {
                  <div class="flex items-center space-x-4">
                    <p-skeleton width="100px" height="20px"></p-skeleton>
                    <p-skeleton width="150px" height="20px"></p-skeleton>
                    <p-skeleton width="200px" height="20px"></p-skeleton>
                    <p-skeleton width="100px" height="20px"></p-skeleton>
                    <p-skeleton width="80px" height="20px"></p-skeleton>
                  </div>
                }
              </div>
            </div>
          } @else if (orderHistoryStore.error()) {
            <!-- Error State -->
            <div class="p-6">
              <p-message
                severity="error"
                [text]="orderHistoryStore.error()!"
                styleClass="w-full"
              />
              <div class="mt-4">
                <p-button
                  label="Retry"
                  icon="pi pi-refresh"
                  (onClick)="orderHistoryStore.loadOrders()"
                  severity="secondary"
                />
              </div>
            </div>
          } @else if (orderHistoryStore.orders().length === 0) {
            <!-- Empty State -->
            <div class="text-center py-12">
              <div class="space-y-4">
                <i class="pi pi-shopping-bag text-slate-300 text-4xl"></i>
                <div>
                  <h3 class="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
                  @if (hasActiveFilters()) {
                    <p class="text-slate-500 mb-4">Try adjusting your search criteria or filters.</p>
                    <p-button
                      label="Clear Filters"
                      icon="pi pi-filter-slash"
                      severity="secondary"
                      [outlined]="true"
                      (onClick)="clearFilters()"
                    />
                  } @else {
                    <p class="text-slate-500 mb-4">You haven't placed any orders yet.</p>
                    <p-button
                      label="Start Shopping"
                      icon="pi pi-shopping-cart"
                      (onClick)="navigateToProducts()"
                    />
                  }
                </div>
              </div>
            </div>
          } @else {
            <!-- Desktop Table View (hidden on mobile) -->
            <div class="hidden md:block">
              <p-table
                [value]="orderHistoryStore.orders()"
                [paginator]="true"
                [rows]="orderHistoryStore.queryParams().pageSize || 10"
                [totalRecords]="orderHistoryStore.pagination().total"
                [lazy]="true"
                [loading]="orderHistoryStore.isLoading()"
                [sortField]="currentSortField()"
                [sortOrder]="currentSortOrder()"
                (onSort)="onSort($event)"
                (onPage)="onPageChange($event)"
                dataKey="id"
                [tableStyle]="{ 'min-width': '50rem' }"
                styleClass="p-datatable-sm"
              >
                <!-- Table Header -->
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="id" class="text-left">
                      Order ID <p-sortIcon field="id" />
                    </th>
                    <th pSortableColumn="date" class="text-left">
                      Order Date <p-sortIcon field="date" />
                    </th>
                    <th class="text-left">Items</th>
                    <th pSortableColumn="totalAmount" class="text-right">
                      Total Amount <p-sortIcon field="totalAmount" />
                    </th>
                    <th pSortableColumn="status" class="text-center">
                      Status <p-sortIcon field="status" />
                    </th>
                    <th class="text-center">Actions</th>
                  </tr>
                </ng-template>

                <!-- Table Body -->
                <ng-template pTemplate="body" let-order>
                  <tr class="hover:bg-slate-50">
                    <!-- Order ID -->
                    <td class="font-mono text-sm font-medium text-slate-900">
                      #{{ order.id }}
                    </td>

                    <!-- Order Date -->
                    <td class="text-slate-600">
                      {{ order.date | date:'MMM d, y' }}<br>
                      <span class="text-xs text-slate-400">{{ order.date | date:'HH:mm' }}</span>
                    </td>

                    <!-- Items Summary -->
                    <td>
                      <div class="space-y-1">
                        <div class="text-sm font-medium text-slate-900">
                          {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}
                        </div>
                        <div class="text-xs text-slate-500">
                          {{ getTotalQuantity(order) }} pieces total
                        </div>
                        @if (order.items.length > 0) {
                          <div class="text-xs text-slate-400 truncate max-w-48"
                               [title]="getItemsSummary(order)">
                            {{ getItemsPreview(order) }}
                          </div>
                        }
                      </div>
                    </td>

                    <!-- Total Amount -->
                    <td class="text-right">
                      <div class="font-bold text-slate-900">
                        {{ order.totalAmount | appCurrency }}
                      </div>
                    </td>

                    <!-- Status -->
                    <td class="text-center">
                      <p-tag
                        [value]="orderHistoryStore.getStatusLabel(order.status)"
                        [severity]="orderHistoryStore.getStatusSeverity(order.status)"
                      />
                    </td>

                    <!-- Actions -->
                    <td class="text-center">
                      <div class="flex justify-center gap-2">
                        <p-button
                          icon="pi pi-eye"
                          [text]="true"
                          [rounded]="true"
                          size="small"
                          severity="secondary"
                          (onClick)="viewOrderDetails(order.id)"
                          pTooltip="View Details"
                          tooltipPosition="top"
                        />
                      </div>
                    </td>
                  </tr>
                </ng-template>

                <!-- Loading Template -->
                <ng-template pTemplate="loadingbody">
                  <tr>
                    <td colspan="7" class="text-center py-8">
                      <p-progressSpinner styleClass="w-8 h-8" />
                      <p class="text-slate-500 mt-2">Loading orders...</p>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Mobile Card View (visible on mobile only) -->
            <div class="md:hidden">
              <div class="divide-y divide-slate-200">
                @for (order of orderHistoryStore.orders(); track order.id) {
                  <div class="p-4 hover:bg-slate-50 transition-colors">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <h3 class="font-mono text-sm font-bold text-slate-900">#{{ order.id }}</h3>
                          <p-tag
                            [value]="orderHistoryStore.getStatusLabel(order.status)"
                            [severity]="orderHistoryStore.getStatusSeverity(order.status)"
                            styleClass="!text-xs"
                          />
                        </div>
                        <p class="text-xs text-slate-500">
                          {{ order.date | date:'MMM d, y' }} at {{ order.date | date:'HH:mm' }}
                        </p>
                      </div>
                      <p-button
                        icon="pi pi-eye"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        severity="secondary"
                        (onClick)="viewOrderDetails(order.id)"
                        styleClass="!w-8 !h-8 flex-shrink-0"
                        pTooltip="View Details"
                      />
                    </div>

                    <!-- Order Details -->
                    <div class="space-y-2">
                      <!-- Items Summary -->
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-600">Items:</span>
                        <span class="font-medium text-slate-900">
                          {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }} ({{ getTotalQuantity(order) }} pieces)
                        </span>
                      </div>

                      <!-- Items Preview -->
                      @if (order.items.length > 0) {
                        <div class="text-xs text-slate-500">
                          {{ getItemsPreview(order) }}
                        </div>
                      }

                      <!-- Total Amount -->
                      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span class="text-sm font-medium text-slate-600">Total:</span>
                        <span class="text-lg font-bold text-slate-900">{{ order.totalAmount | appCurrency }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Mobile Pagination -->
              @if (orderHistoryStore.pagination().total > (orderHistoryStore.queryParams().pageSize || 10)) {
                <div class="p-4 border-t border-slate-200 bg-slate-50">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-600">
                      Showing {{ orderHistoryStore.orders().length }} of {{ orderHistoryStore.pagination().total }} orders
                    </span>
                    <div class="flex gap-2">
                      @if ((orderHistoryStore.queryParams().page || 1) > 1) {
                        <p-button
                          icon="pi pi-chevron-left"
                          [text]="true"
                          size="small"
                          (onClick)="goToPreviousPage()"
                          styleClass="!w-8 !h-8"
                        />
                      }
                      @if (((orderHistoryStore.queryParams().page || 1) * (orderHistoryStore.queryParams().pageSize || 10)) < orderHistoryStore.pagination().total) {
                        <p-button
                          icon="pi pi-chevron-right"
                          [text]="true"
                          size="small"
                          (onClick)="goToNextPage()"
                          styleClass="!w-8 !h-8"
                        />
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Order Summary Stats -->
        @if (!orderHistoryStore.isLoading() && orderHistoryStore.hasOrders()) {
          <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow-sm p-6 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ orderHistoryStore.pagination().total }}</div>
              <div class="text-sm text-slate-500">Total Orders</div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6 text-center">
              <div class="text-2xl font-bold text-green-600">{{ getCompletedOrdersCount() }}</div>
              <div class="text-sm text-slate-500">Completed</div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6 text-center">
              <div class="text-2xl font-bold text-yellow-600">{{ getProcessingOrdersCount() }}</div>
              <div class="text-sm text-slate-500">Processing</div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6 text-center">
              <div class="text-2xl font-bold text-slate-900">{{ getTotalOrderValue() | appCurrency }}</div>
              <div class="text-sm text-slate-500">Total Value</div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit {
  protected readonly orderHistoryStore = inject(OrderHistoryStore);
  private readonly router = inject(Router);

  // Local state for form controls
  protected searchTerm = '';
  protected selectedStatus: OrderStatus | null = null;

  // Computed properties for table sorting
  protected readonly currentSortField = computed(() => {
    const queryParams = this.orderHistoryStore.queryParams();
    const backendField = queryParams.sortBy || 'date';

    // Map backend field names back to PrimeNG table field names
    switch (backendField) {
      case 'id':
        return 'id';
      case 'date':
        return 'date';
      case 'status':
        return 'status';
      case 'totalAmount':
        return 'totalAmount';
      default:
        return 'date';
    }
  });  protected readonly currentSortOrder = computed(() => {
    const queryParams = this.orderHistoryStore.queryParams();
    return queryParams.sortDirection === 'asc' ? 1 : -1;
  });

  ngOnInit(): void {
    // Load initial orders
    this.orderHistoryStore.loadOrders();
  }

  /**
   * Handle search input change
   */
  protected onSearchChange(searchTerm: string): void {
    this.orderHistoryStore.searchOrders(searchTerm);
  }

  /**
   * Handle status filter change
   */
  protected onStatusFilterChange(status: OrderStatus | null): void {
    this.orderHistoryStore.filterByStatus(status || undefined);
  }

  /**
   * Handle table sorting
   */
  protected onSort(event: { field: string; order: number }): void {
    const sortDirection = event.order === 1 ? 'asc' : 'desc';

    // Map field names to supported sort fields
    let sortField: 'id' | 'date' | 'status' | 'totalAmount';

    switch (event.field) {
      case 'id':
        sortField = 'id';
        break;
      case 'date':
        sortField = 'date';
        break;
      case 'status':
        sortField = 'status';
        break;
      case 'totalAmount':
        sortField = 'totalAmount';
        break;
      default:
        // Default to date sorting for unknown fields
        sortField = 'date';
        break;
    }

    this.orderHistoryStore.sortOrders(sortField, sortDirection);
  }

  /**
   * Handle table pagination
   */
  protected onPageChange(event: TablePageEvent): void {
    const page = Math.floor((event.first || 0) / (event.rows || 10)) + 1;
    if (event.rows && event.rows !== this.orderHistoryStore.queryParams().pageSize) {
      this.orderHistoryStore.changePageSize(event.rows);
    } else {
      this.orderHistoryStore.goToPage(page);
    }
  }

  /**
   * Navigate to order details
   */
  protected viewOrderDetails(orderId: number): void {
    this.router.navigate(['/order', orderId]);
  }

  /**
   * Navigate to products page
   */
  protected navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Clear all filters
   */
  protected clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.orderHistoryStore.updateQueryParams({
      search: undefined,
      status: undefined,
      page: 1
    });
  }

  /**
   * Check if any filters are active
   */
  protected hasActiveFilters(): boolean {
    const params = this.orderHistoryStore.queryParams();
    return !!(params.search || params.status);
  }

  /**
   * Get total quantity of items in an order
   */
  protected getTotalQuantity(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get items summary for tooltip
   */
  protected getItemsSummary(order: Order): string {
    return order.items.map(item =>
      `${item.shoeName} (Size ${item.size}) - Qty: ${item.quantity}`
    ).join('\n');
  }

  /**
   * Get items preview (first few items)
   */
  protected getItemsPreview(order: Order): string {
    if (order.items.length === 0) return '';
    if (order.items.length === 1) {
      return `${order.items[0].shoeName} (${order.items[0].quantity}x)`;
    }
    return `${order.items[0].shoeName}, ${order.items[1]?.shoeName || ''}${order.items.length > 2 ? '...' : ''}`;
  }

  /**
   * Get count of completed orders
   */
  protected getCompletedOrdersCount(): number {
    return this.orderHistoryStore.orders().filter(order => order.status === 'completed').length;
  }

  /**
   * Get count of processing orders
   */
  protected getProcessingOrdersCount(): number {
    return this.orderHistoryStore.orders().filter(order => order.status === 'processing').length;
  }

  /**
   * Get total value of all orders
   */
  protected getTotalOrderValue(): number {
    return this.orderHistoryStore.orders().reduce((total, order) => total + order.totalAmount, 0);
  }

  /**
   * Navigate to previous page (mobile pagination)
   */
  protected goToPreviousPage(): void {
    const currentPage = this.orderHistoryStore.queryParams().page || 1;
    if (currentPage > 1) {
      this.orderHistoryStore.goToPage(currentPage - 1);
    }
  }

  /**
   * Navigate to next page (mobile pagination)
   */
  protected goToNextPage(): void {
    const currentPage = this.orderHistoryStore.queryParams().page || 1;
    const pageSize = this.orderHistoryStore.queryParams().pageSize || 10;
    const totalRecords = this.orderHistoryStore.pagination().total;

    if ((currentPage * pageSize) < totalRecords) {
      this.orderHistoryStore.goToPage(currentPage + 1);
    }
  }
}
