import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  signal,
} from '@angular/core';
import { PagedResult, Shoe, ShoeQueryParams } from '@shoestore/shared-models';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ShoeService } from '../../service/shoe.service';

@Component({
  selector: 'app-shoe-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    PaginatorModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './shoe-list.component.html',
  styleUrls: ['./shoe-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoeListComponent {
  // Reactive state using signals
  queryParams = signal<ShoeQueryParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'code',
    sortDirection: 'asc',
  });
  private reloadTrigger = signal(0);

  shoes = signal<Shoe[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  expandedRows = signal<Record<string, boolean>>({});

  // Effect: reload data when queryParams or reloadTrigger change
  private dataEffect = effect(() => {
    // 💡 Odczyt obu sygnałów w ramach efektu:
    //    - dzięki temu Angular wie, że ma „subskrybować” zmiany queryParams i reloadTrigger
    const _params = this.queryParams();
    const _trigger = this.reloadTrigger();

    // Wywołanie metody ładowania danych
    this.loadShoes();
  });

  constructor(
    private shoeService: ShoeService,
    private confirmation: ConfirmationService,
    private message: MessageService
  ) {}

  private loadShoes(): void {
    this.loading.set(true);
    const params = this.queryParams();
    this.shoeService.getShoes(params).subscribe({
      next: (result: PagedResult<Shoe>) => {
        this.shoes.set(result.items);
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

  onSearch(value: string): void {
    this.queryParams.update((q) => ({ ...q, search: value, page: 1 }));
    this.triggerReload();
  }

  onSort(event: { field: string; order: number }): void {
    this.queryParams.update((q) => ({
      ...q,
      sortBy: event.field as 'code' | 'name',
      sortDirection: event.order === 1 ? 'asc' : 'desc',
    }));
    this.triggerReload();
  }

  onPageChange(event: TablePageEvent): void {
    // PrimeNG `TablePageEvent`: `first` to index first record, `rows` for page size
    const first: number = event.first;
    const rows: number = event.rows;
    const newPage = Math.floor(first / rows) + 1;
    this.queryParams.update((q) => ({ ...q, page: newPage, pageSize: rows }));
    this.triggerReload();
  }

  confirmDelete(shoe: Shoe): void {
    this.confirmation.confirm({
      header: 'Potwierdzenie usunięcia',
      message: `Czy usunąć model ${shoe.code}?`,
      accept: () => this.delete(shoe),
    });
  }

  private delete(shoe: Shoe): void {
    this.shoeService.deleteShoe(shoe.id).subscribe({
      next: () => {
        this.message.add({
          severity: 'success',
          summary: 'Usunięto',
          detail: `${shoe.code} został usunięty`,
        });
        this.triggerReload();
      },
      error: (err: HttpErrorResponse) =>
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: err.message,
        }),
    });
  }

  onRowExpand(event: { data: Shoe }) {
    this.expandedRows.update((m) => ({ ...m, [event.data.code]: true }));
  }

  onRowCollapse(event: { data: Shoe }) {
    this.expandedRows.update((m) => {
      const copy = { ...m };
      delete copy[event.data.code];
      return copy;
    });
  }

  private triggerReload(): void {
    this.reloadTrigger.set(this.reloadTrigger() + 1);
  }
}
