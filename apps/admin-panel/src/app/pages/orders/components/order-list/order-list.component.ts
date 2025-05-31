import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Order,
  OrderQueryParams,
  OrderStatus,
  PagedResult,
} from '@shoestore/shared-models';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TieredMenu, TieredMenuModule } from 'primeng/tieredmenu';
import { TooltipModule } from 'primeng/tooltip';
import { OrderService } from '../../services/order.service';

interface StatusOption {
  label: string;
  value: 'placed' | 'processing' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    TieredMenuModule,
    FormsModule,
    TagModule,
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderListComponent {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly message = inject(MessageService);

  // Reactive state
  queryParams = signal<OrderQueryParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'date',
    sortDirection: 'desc',
  });
  private reloadTrigger = signal(0);

  orders = signal<Order[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  // Przykładowe statusy:
  statuses: StatusOption[] = [
    { label: 'Złożone', value: 'placed' },
    { label: 'W realizacji', value: 'processing' },
    { label: 'Zrealizowane', value: 'completed' },
    { label: 'Anulowane', value: 'cancelled' },
  ];

  // Referencja do TieredMenu
  @ViewChild('statusMenu') statusMenu!: TieredMenu;

  selectedStatus: OrderStatus | undefined = undefined;

  // Effect: odświeżaj, gdy queryParams lub reloadTrigger się zmienią
  private dataEffect = effect(() => {
    const _q = this.queryParams();
    const _t = this.reloadTrigger();
    this.loadOrders();
  });

  private loadOrders(): void {
    this.loading.set(true);
    this.orderService.getOrders(this.queryParams()).subscribe({
      next: (result: PagedResult<Order>) => {
        this.orders.set(result.items);
        this.totalRecords.set(result.total);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: err.message,
        });
      },
    });
  }

  onSearch(value: string) {
    this.queryParams.update((q) => ({ ...q, search: value, page: 1 }));
    this.triggerReload();
  }

  onStatusFilterChange(status: OrderStatus | undefined) {
    this.selectedStatus = status;
    this.queryParams.update((q) => ({
      ...q,
      status: status === undefined ? undefined : status,
      page: 1,
    }));
    this.triggerReload();
  }

  onSort(event: { field: string; order: number }) {
    this.queryParams.update((q) => ({
      ...q,
      sortBy: event.field as 'date' | 'status' | 'totalAmount',
      sortDirection: event.order === 1 ? 'asc' : 'desc',
    }));
    this.triggerReload();
  }

  onPageChange(event: TablePageEvent) {
    const first = event.first!;
    const rows = event.rows!;
    const newPage = Math.floor(first / rows) + 1;
    this.queryParams.update((q) => ({ ...q, page: newPage, pageSize: rows }));
    this.triggerReload();
  }

  onViewDetails(orderId: number) {
    this.router.navigate(['/orders', orderId]);
  }

  onChangeStatus(order: Order, menu: any) {
    // Otwórz TieredMenu
    menu.toggle(event);
  }

  /**
   * Buduje tablicę MenuItem[] dla danego zamówienia.
   * Założenie: do `order` chcemy przekazać wybrany status.
   */
  getStatusMenuItems(order: any): MenuItem[] {
    // Pomijamy pierwszy element statuses[0], bo to „Wszystkie”
    return this.statuses.slice(1).map((st) => ({
      label: st.label,
      command: () => this.onStatusSelect(order, st.value),
    }));
  }

  onStatusSelect(order: Order, status: OrderStatus) {
    if (order.status === status) {
      return;
    }
    this.orderService.updateOrderStatus(order.id, { status }).subscribe({
      next: (updated) => {
        this.message.add({
          severity: 'success',
          summary: 'Zaktualizowano',
          detail: `Status zamówienia ${order.id} zmieniono na "${status}".`,
        });
        this.triggerReload();
      },
      error: (err: HttpErrorResponse) => {
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: err.message,
        });
      },
    });
  }

  statusSeverity(status: OrderStatus): string {
    switch (status) {
      case 'placed':
        return 'warn';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return '';
    }
  }

  /**
   * Zwraca odpowiednią etykietę (label) dla statusu.
   * Można zamiast tego użyć built-in titlecase lub zdefiniować tablicę
   * statuses = [ { label: 'Złożone', value: 'placed' }, … ]
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'placed':
        return 'Złożone';
      case 'processing':
        return 'W realizacji';
      case 'completed':
        return 'Zrealizowane';
      case 'cancelled':
        return 'Anulowane';
      default:
        return status;
    }
  }

  private triggerReload() {
    this.reloadTrigger.set(this.reloadTrigger() + 1);
  }
}
