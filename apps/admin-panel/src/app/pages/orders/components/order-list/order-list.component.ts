import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms'; // potrzebne dla ngModel
import { ActivatedRoute, Router } from '@angular/router';
import {
  Order,
  OrderQueryParams,
  OrderStatus,
  PagedResult,
} from '@shoestore/shared-models';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
    FormsModule,
    TagModule,
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly message = inject(MessageService);

  // --- SYGNAŁY I STANY ---

  /** Parametry zapytania do serwera (status / search / strona / sort) */
  queryParams = signal<OrderQueryParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'date',
    sortDirection: 'desc',
  });
  private reloadTrigger = signal(0);

  /** Lista zamówień pobrana z serwera */
  orders = signal<Order[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  /** Ustawione filtrowanie po statusie */
  selectedStatus: OrderStatus | undefined = undefined;

  /** Sygnał przechowujący bieżące słowo wyszukiwania */
  searchTerm = signal<string>('');

  /** Możliwe statusy do filtrowania i do TieredMenu */
  statuses: StatusOption[] = [
    { label: 'Złożone', value: 'placed' },
    { label: 'W realizacji', value: 'processing' },
    { label: 'Zrealizowane', value: 'completed' },
    { label: 'Anulowane', value: 'cancelled' },
  ];

  /** Efekt: kiedy zmienia się queryParams lub reloadTrigger, pobieramy na nowo listę */
  private dataEffect = effect(() => {
    const _q = this.queryParams();
    const _t = this.reloadTrigger();
    this.loadOrders();
  });

  ngOnInit(): void {
    // 1) Odczyt parametru ?search=z cURL i nadanie wartości sygnałowi oraz queryParams
    this.route.queryParamMap.subscribe((params) => {
      const search = params.get('search') ?? '';
      this.searchTerm.set(search); // sygnał trzyma teraz tekst w polu
      this.queryParams.update((q) => ({
        ...q,
        search: search || undefined,
        page: 1,
      }));
    });
  }

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

  /**
   * Wywoływane przy zmianie wartości w polu „Szukaj...”.
   * Ustawiamy sygnał searchTerm oraz aktualizujemy queryParams.search.
   */
  onSearch(value: string) {
    this.searchTerm.set(value);
    this.queryParams.update((q) => ({
      ...q,
      search: value || undefined,
      page: 1,
    }));
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
    this.queryParams.update((q) => ({
      ...q,
      page: newPage,
      pageSize: rows,
    }));
    this.triggerReload();
  }

  onViewDetails(orderId: number) {
    this.router.navigate(['/orders', orderId]);
  }

  getStatusMenuItems(menu: Menu, order: Order): MenuItem[] {
    return this.statuses.map((st) => ({
      label: st.label,
      command: () => {
        menu.hide();
        this.onStatusSelect(order, st.value)
      },
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
