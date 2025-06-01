import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { PagedResult, User } from '@shoestore/shared-models';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    PaginatorModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  private message = inject(MessageService);

  // Parametry zapytania (paginacja, wyszukiwanie)
  queryParams = signal<{ page: number; pageSize: number; search?: string }>({
    page: 1,
    pageSize: 10,
    search: undefined,
  });
  private reloadTrigger = signal(0);

  users = signal<User[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  // Efekt: za każdym razem, gdy zmienią się queryParams lub reloadTrigger, pobieramy dane
  private dataEffect = effect(() => {
    const _params = this.queryParams();
    const _trigger = this.reloadTrigger();
    this.loadUsers();
  });

  private loadUsers(): void {
    this.loading.set(true);
    const { page, pageSize, search } = this.queryParams();
    this.userService.getUsers({ page, pageSize, search }).subscribe({
      next: (res: PagedResult<User>) => {
        this.users.set(res.items);
        this.totalRecords.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
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

  onPageChange(event: TablePageEvent): void {
    const first = event.first!;
    const rows = event.rows!;
    const newPage = Math.floor(first / rows) + 1;
    this.queryParams.update((q) => ({ ...q, page: newPage, pageSize: rows }));
    this.triggerReload();
  }

  onViewDetail(userId: number): void {
    this.router.navigate(['users', userId]);
  }

  private triggerReload(): void {
    this.reloadTrigger.set(this.reloadTrigger() + 1);
  }
}
