import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

// Models and Services
import { Order } from '@shoestore/shared-models';
import { OrderHistoryStore } from '../../features/orders/stores/order-history.store';
import { CurrencyPipe } from '../../shared/pipes';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    DividerModule,
    SkeletonModule,
    MessageModule,
    TooltipModule,
    CurrencyPipe
  ],
  template: `
    <div class="order-detail-page min-h-screen bg-slate-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        @if (orderHistoryStore.isLoadingDetail()) {
          <!-- Loading State -->
          <div class="space-y-6">
            <!-- Header Skeleton -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <p-skeleton width="200px" height="32px" styleClass="mb-4"></p-skeleton>
              <p-skeleton width="150px" height="20px"></p-skeleton>
            </div>

            <!-- Content Skeleton -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <p-skeleton width="100%" height="200px"></p-skeleton>
            </div>
          </div>
        } @else if (orderHistoryStore.error()) {
          <!-- Error State -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <p-message
              severity="error"
              [text]="orderHistoryStore.error()!"
              styleClass="w-full mb-4"
            />
            <div class="flex gap-3">
              <p-button
                label="Go Back"
                icon="pi pi-arrow-left"
                severity="secondary"
                (onClick)="goBack()"
              />
              <p-button
                label="Retry"
                icon="pi pi-refresh"
                (onClick)="orderHistoryStore.loadOrderById(+route.snapshot.params['id'])"
              />
            </div>
          </div>
        } @else if (orderHistoryStore.currentOrder()) {
          <!-- Order Details -->
          <!-- Page Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold text-slate-900">Order #{{ orderHistoryStore.currentOrder()!.id }}</h1>
              <p class="text-slate-600 mt-1">{{ orderHistoryStore.currentOrder()!.date | date:'fullDate' }} at {{ orderHistoryStore.currentOrder()!.date | date:'shortTime' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <p-tag
                [value]="orderHistoryStore.currentOrderStatusLabel()"
                [severity]="orderHistoryStore.currentOrderStatusSeverity()"
                styleClass="text-sm px-3 py-1"
              />
              <p-button
                label="Back to Orders"
                icon="pi pi-arrow-left"
                severity="secondary"
                [outlined]="true"
                (onClick)="goBack()"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Order Items -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Items List -->
              <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-slate-200">
                  <h2 class="text-xl font-semibold text-slate-900">Order Items</h2>
                  <p class="text-slate-600 mt-1">{{ orderHistoryStore.currentOrder()!.items.length }} item{{ orderHistoryStore.currentOrder()!.items.length !== 1 ? 's' : '' }} ordered</p>
                </div>

                <div class="divide-y divide-slate-200">
                  @for (groupedItem of getGroupedItems(); track groupedItem.shoeId) {
                    <div class="p-6 hover:bg-slate-50 transition-colors">
                      <div class="flex items-start gap-4">
                        <!-- Product Image Placeholder -->
                        <div class="flex-shrink-0 w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                          <i class="pi pi-image text-slate-400 text-lg"></i>
                        </div>

                        <!-- Product Details -->
                        <div class="flex-1 min-w-0">
                          <h3 class="font-semibold text-slate-900">{{ groupedItem.shoeName }}</h3>
                          <p class="text-slate-600 text-sm mt-1">Code: {{ groupedItem.shoeCode }}</p>

                          <!-- Size breakdown -->
                          <div class="mt-2 space-y-1">
                            @for (sizeInfo of groupedItem.sizes; track sizeInfo.size) {
                              <div class="flex items-center gap-4 text-sm">
                                <span class="text-slate-500">Size {{ sizeInfo.size }}:</span>
                                <span class="text-slate-500">{{ sizeInfo.quantity }} × {{ groupedItem.unitPrice | currency }}</span>
                                <span class="font-medium text-slate-700">=  {{ sizeInfo.total | currency }}</span>
                              </div>
                            }
                          </div>

                          <!-- Total for this product -->
                          <div class="mt-2 pt-2 border-t border-slate-100">
                            <span class="text-sm font-medium text-slate-900">
                              Total: {{ groupedItem.totalQuantity }} pieces
                            </span>
                          </div>
                        </div>

                        <!-- Item Total -->
                        <div class="text-right">
                          <div class="font-bold text-slate-900">{{ groupedItem.totalAmount | currency }}</div>
                          <div class="text-xs text-slate-500 mt-1">{{ groupedItem.totalQuantity }} pieces</div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Order Summary & Customer Info -->
            <div class="space-y-6">
              <!-- Order Summary -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>

                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Subtotal ({{ getTotalQuantity() }} items)</span>
                    <span class="text-slate-900">{{ getSubtotal() | currency }}</span>
                  </div>

                  <div class="flex justify-between">
                    <span class="text-slate-600">Shipping</span>
                    <span class="text-green-600">Free</span>
                  </div>

                  <p-divider />

                  <div class="flex justify-between text-lg font-semibold">
                    <span class="text-slate-900">Total</span>
                    <span class="text-slate-900">{{ orderHistoryStore.currentOrder()!.totalAmount | currency }}</span>
                  </div>
                </div>
              </div>

              <!-- Customer Information -->
              @if (orderHistoryStore.currentOrder()!.user) {
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-slate-900 mb-4">Customer Information</h3>

                  <div class="space-y-4">
                    <!-- Contact Details -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-2">Contact</h4>
                      <div class="text-sm space-y-1">
                        <div class="text-slate-900">{{ orderHistoryStore.currentOrder()!.user!.contactName }}</div>
                        <div class="text-slate-600">{{ orderHistoryStore.currentOrder()!.user!.email }}</div>
                        @if (orderHistoryStore.currentOrder()!.user!.phone) {
                          <div class="text-slate-600">{{ orderHistoryStore.currentOrder()!.user!.phone }}</div>
                        }
                      </div>
                    </div>

                    <!-- Company Information -->
                    @if (orderHistoryStore.currentOrder()!.user!.invoiceInfo) {
                      <div>
                        <h4 class="font-medium text-slate-900 mb-2">Company</h4>
                        <div class="text-sm space-y-1">
                          <div class="text-slate-900">{{ orderHistoryStore.currentOrder()!.user!.invoiceInfo.companyName }}</div>
                          <div class="text-slate-600">VAT: {{ orderHistoryStore.currentOrder()!.user!.invoiceInfo.vatNumber }}</div>
                        </div>
                      </div>
                    }

                    <!-- Shipping Address -->
                    @if (orderHistoryStore.currentOrder()!.user!.shippingAddress) {
                      <div>
                        <h4 class="font-medium text-slate-900 mb-2">Shipping Address</h4>
                        <div class="text-sm text-slate-600">
                          <div>{{ orderHistoryStore.currentOrder()!.user!.shippingAddress.street }}</div>
                          <div>{{ orderHistoryStore.currentOrder()!.user!.shippingAddress.postalCode }} {{ orderHistoryStore.currentOrder()!.user!.shippingAddress.city }}</div>
                          <div>{{ orderHistoryStore.currentOrder()!.user!.shippingAddress.country }}</div>
                        </div>
                      </div>
                    }

                    <!-- Billing Address -->
                    @if (orderHistoryStore.currentOrder()!.user!.billingAddress && orderHistoryStore.currentOrder()!.user!.billingAddress.street !== orderHistoryStore.currentOrder()!.user!.shippingAddress.street) {
                      <div>
                        <h4 class="font-medium text-slate-900 mb-2">Billing Address</h4>
                        <div class="text-sm text-slate-600">
                          <div>{{ orderHistoryStore.currentOrder()!.user!.billingAddress.street }}</div>
                          <div>{{ orderHistoryStore.currentOrder()!.user!.billingAddress.postalCode }} {{ orderHistoryStore.currentOrder()!.user!.billingAddress.city }}</div>
                          <div>{{ orderHistoryStore.currentOrder()!.user!.billingAddress.country }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Order Timeline -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Order Timeline</h3>

                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <div class="font-medium text-slate-900">Order Placed</div>
                      <div class="text-sm text-slate-600">{{ orderHistoryStore.currentOrder()!.date | date:'MMM d, y, h:mm a' }}</div>
                    </div>
                  </div>

                  @if (orderHistoryStore.currentOrder()!.status === 'processing' || orderHistoryStore.currentOrder()!.status === 'completed') {
                    <div class="flex items-start gap-3">
                      <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <div class="font-medium text-slate-900">Processing Started</div>
                        <div class="text-sm text-slate-600">Your order is being prepared</div>
                      </div>
                    </div>
                  }

                  @if (orderHistoryStore.currentOrder()!.status === 'completed') {
                    <div class="flex items-start gap-3">
                      <div class="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <div class="font-medium text-slate-900">Order Completed</div>
                        <div class="text-sm text-slate-600">Your order has been fulfilled</div>
                      </div>
                    </div>
                  }

                  @if (orderHistoryStore.currentOrder()!.status === 'cancelled') {
                    <div class="flex items-start gap-3">
                      <div class="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <div>
                        <div class="font-medium text-slate-900">Order Cancelled</div>
                        <div class="text-sm text-slate-600">This order was cancelled</div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailComponent implements OnInit {
  protected readonly orderHistoryStore = inject(OrderHistoryStore);
  private readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const orderId = this.route.snapshot.params['id'];
    if (orderId) {
      this.orderHistoryStore.loadOrderById(parseInt(orderId, 10));
    }
  }

  /**
   * Go back to orders list
   */
  protected goBack(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Get total quantity of items
   */
  protected getTotalQuantity(): number {
    const order = this.orderHistoryStore.currentOrder();
    if (!order) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get subtotal (before tax)
   */
  protected getSubtotal(): number {
    const order = this.orderHistoryStore.currentOrder();
    if (!order) return 0;
    return order.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  }

  /**
   * Group items by shoe ID and aggregate sizes and quantities
   */
  protected getGroupedItems(): Array<{
    shoeId: number;
    shoeCode: string;
    shoeName: string;
    unitPrice: number;
    sizes: Array<{ size: number; quantity: number; total: number }>;
    totalQuantity: number;
    totalAmount: number;
  }> {
    const order = this.orderHistoryStore.currentOrder();
    if (!order) return [];

    const grouped = new Map<number, {
      shoeId: number;
      shoeCode: string;
      shoeName: string;
      unitPrice: number;
      sizes: Array<{ size: number; quantity: number; total: number }>;
      totalQuantity: number;
      totalAmount: number;
    }>();

    order.items.forEach(item => {
      if (!grouped.has(item.shoeId)) {
        grouped.set(item.shoeId, {
          shoeId: item.shoeId,
          shoeCode: item.shoeCode,
          shoeName: item.shoeName,
          unitPrice: item.unitPrice,
          sizes: [],
          totalQuantity: 0,
          totalAmount: 0
        });
      }

      const group = grouped.get(item.shoeId);
      if (!group) return;

      group.sizes.push({
        size: item.size,
        quantity: item.quantity,
        total: item.unitPrice * item.quantity
      });
      group.totalQuantity += item.quantity;
      group.totalAmount += item.unitPrice * item.quantity;
    });

    return Array.from(grouped.values());
  }
}
