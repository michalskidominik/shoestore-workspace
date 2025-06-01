// apps/admin-panel/src/app/components/order-detail/order-detail.component.ts
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { Order, OrderStatus } from '@shoestore/shared-models';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { OrderService } from '../../services/order.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputNumberModule,
    RouterLink,
    TooltipModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private message = inject(MessageService);

  order = signal<Order | null>(null);
  orderItems = computed(() => this.order()?.items || []);
  loading = signal(false);

  // Mapujemy status na kolor tagu
  statusSeverity = (status: OrderStatus): string => {
    switch (status) {
      case 'placed':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return '';
    }
  };

  ngOnInit(): void {
    const idParam = +this.route.snapshot.paramMap.get('id')!;
    this.loadOrder(idParam);
  }

  private loadOrder(id: number) {
    this.loading.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (o: Order) => {
        this.order.set(o);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: 'Nie udało się pobrać zamówienia.',
        });
        this.router.navigate(['/orders']);
      },
    });
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
