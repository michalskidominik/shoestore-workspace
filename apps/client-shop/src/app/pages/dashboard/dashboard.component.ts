import { Component, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthStore } from '../../core/stores/auth.store';
import { CartStore } from '../../features/cart/stores/cart.store';
import { OrderHistoryStore } from '../../features/orders/stores/order-history.store';
import { CurrencyPipe } from '../../shared/pipes';
import { OrderStatus } from '@shoestore/shared-models';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  cartItems: number;
  cartValue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    ChartModule,
    SkeletonModule,
    CurrencyPipe
  ],
  template: `
    <div class="dashboard min-h-screen bg-slate-50">
      <!-- Header Section -->
      <div class="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">Business Dashboard</h1>
              @if (currentUser()) {
                <p class="text-slate-600 mt-1">Welcome back, {{ currentUser()?.contactName || 'Partner' }}</p>
              }
            </div>
            <div class="mt-4 sm:mt-0 flex gap-3">
              <p-button
                label="Browse Products"
                icon="pi pi-shopping-bag"
                severity="primary"
                routerLink="/products"
                styleClass="!text-sm !px-4 !py-2">
              </p-button>
              @if (cartItemCount() > 0) {
                <p-button
                  label="Review Cart"
                  icon="pi pi-shopping-cart"
                  severity="secondary"
                  [outlined]="true"
                  routerLink="/cart"
                  styleClass="!text-sm !px-4 !py-2"
                  [badge]="cartItemCount().toString()">
                </p-button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Quick Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <!-- Total Orders -->
          <div class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-blue-50 p-3 rounded-lg">
                <i class="pi pi-shopping-bag text-blue-600 text-xl"></i>
              </div>
              <p-tag value="All Time" severity="info" styleClass="!text-xs"></p-tag>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-1">{{ stats().totalOrders }}</h3>
            <p class="text-sm text-slate-600">Total Orders</p>
          </div>

          <!-- Pending Orders -->
          <div class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-orange-50 p-3 rounded-lg">
                <i class="pi pi-clock text-orange-600 text-xl"></i>
              </div>
              @if (stats().pendingOrders > 0) {
                <p-tag value="Active" severity="warning" styleClass="!text-xs"></p-tag>
              }
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-1">{{ stats().pendingOrders }}</h3>
            <p class="text-sm text-slate-600">Pending Orders</p>
          </div>

          <!-- Cart Status -->
          <div class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-green-50 p-3 rounded-lg">
                <i class="pi pi-shopping-cart text-green-600 text-xl"></i>
              </div>
              @if (cartItemCount() > 0) {
                <p-tag value="Ready" severity="success" styleClass="!text-xs"></p-tag>
              }
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-1">{{ cartItemCount() }}</h3>
            <p class="text-sm text-slate-600">Items in Cart</p>
            @if (cartValue() > 0) {
              <p class="text-xs text-green-600 font-medium mt-1">{{ cartValue() | appCurrency }}</p>
            }
          </div>

          <!-- Total Spent -->
          <div class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-purple-50 p-3 rounded-lg">
                <i class="pi pi-wallet text-purple-600 text-xl"></i>
              </div>
              <p-tag value="B2B" severity="secondary" styleClass="!text-xs"></p-tag>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-1">{{ stats().totalSpent | appCurrency }}</h3>
            <p class="text-sm text-slate-600">Total Spent</p>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="grid lg:grid-cols-3 gap-6 sm:gap-8">

          <!-- Recent Orders -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-slate-900">Recent Orders</h2>
                  <p-button
                    label="View All"
                    severity="secondary"
                    [text]="true"
                    routerLink="/orders"
                    styleClass="!text-sm !p-2">
                  </p-button>
                </div>
              </div>
              <div class="p-6">
                @if (orderHistoryStore.isLoading()) {
                  <div class="space-y-4">
                    @for (item of [1,2,3]; track item) {
                      <div class="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                        <p-skeleton width="3rem" height="3rem" borderRadius="0.5rem"></p-skeleton>
                        <div class="flex-1 space-y-2">
                          <p-skeleton width="60%" height="1rem"></p-skeleton>
                          <p-skeleton width="40%" height="0.75rem"></p-skeleton>
                        </div>
                        <p-skeleton width="4rem" height="1.5rem" borderRadius="1rem"></p-skeleton>
                      </div>
                    }
                  </div>
                } @else if (recentOrders().length === 0) {
                  <div class="text-center py-12">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i class="pi pi-shopping-bag text-slate-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
                    <p class="text-slate-600 mb-4">Start browsing our catalog to place your first order.</p>
                    <p-button
                      label="Browse Products"
                      severity="primary"
                      routerLink="/products"
                      styleClass="!text-sm !px-6 !py-2">
                    </p-button>
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (order of recentOrders(); track order.id) {
                      <div class="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                           [routerLink]="['/order', order.id]">
                        <div class="flex-shrink-0">
                          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <i class="pi pi-box text-blue-600"></i>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-medium text-slate-900 truncate">Order #{{ order.id }}</h4>
                          <p class="text-sm text-slate-600">{{ formatDate(order.date) }} • {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</p>
                          <p class="text-sm font-medium text-slate-900">{{ order.totalAmount | appCurrency }}</p>
                        </div>
                        <div class="flex-shrink-0">
                          <p-tag
                            [value]="getStatusLabel(order.status)"
                            [severity]="getStatusSeverity(order.status)"
                            styleClass="!text-xs">
                          </p-tag>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Quick Actions & Cart Summary -->
          <div class="space-y-6">

            <!-- Quick Actions -->
            <div class="bg-white rounded-xl border border-slate-200 p-6">
              <h2 class="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div class="space-y-3">
                <p-button
                  label="Browse Products"
                  icon="pi pi-search"
                  severity="primary"
                  routerLink="/products"
                  styleClass="w-full !justify-start !text-sm !px-4 !py-3">
                </p-button>
                @if (cartItemCount() > 0) {
                  <p-button
                    label="Complete Order"
                    icon="pi pi-check"
                    severity="success"
                    routerLink="/cart"
                    styleClass="w-full !justify-start !text-sm !px-4 !py-3">
                  </p-button>
                }
                <p-button
                  label="Order History"
                  icon="pi pi-history"
                  severity="secondary"
                  [outlined]="true"
                  routerLink="/orders"
                  styleClass="w-full !justify-start !text-sm !px-4 !py-3">
                </p-button>
                <p-button
                  label="Account Settings"
                  icon="pi pi-cog"
                  severity="secondary"
                  [outlined]="true"
                  routerLink="/profile"
                  styleClass="w-full !justify-start !text-sm !px-4 !py-3">
                </p-button>
              </div>
            </div>

            <!-- Cart Summary -->
            @if (cartItemCount() > 0) {
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-semibold text-slate-900">Current Cart</h2>
                  <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {{ cartItemCount() }} item{{ cartItemCount() !== 1 ? 's' : '' }}
                  </div>
                </div>
                <div class="space-y-3 mb-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-600">Subtotal:</span>
                    <span class="font-medium text-slate-900">{{ cartValue() | appCurrency }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-600">VAT (included):</span>
                    <span class="font-medium text-slate-900">{{ (cartValue() * 0.23) | appCurrency }}</span>
                  </div>
                </div>
                <p-button
                  label="Review & Order"
                  icon="pi pi-arrow-right"
                  severity="primary"
                  routerLink="/cart"
                  styleClass="w-full !text-sm !px-4 !py-3">
                </p-button>
              </div>
            }

            <!-- Business Info -->
            @if (currentUser()) {
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Business Account</h2>
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i class="pi pi-user text-blue-600"></i>
                    </div>
                    <div>
                      <p class="font-medium text-slate-900">{{ currentUser()?.contactName }}</p>
                      <p class="text-sm text-slate-600">{{ currentUser()?.email }}</p>
                    </div>
                  </div>
                  <div class="pt-3 border-t border-slate-200">
                    <div class="flex items-center gap-2 text-sm text-green-600">
                      <i class="pi pi-check-circle"></i>
                      <span>B2B Account Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      @apply min-h-screen;
    }

    :host ::ng-deep .p-button.p-button-outlined:hover {
      @apply transform-none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly cartStore = inject(CartStore);
  protected readonly orderHistoryStore = inject(OrderHistoryStore);

  // Computed values from stores
  readonly currentUser = this.authStore.user;
  readonly cartItemCount = this.cartStore.totalItems;
  readonly cartValue = this.cartStore.totalPrice;

  // Computed dashboard statistics
  readonly stats = computed((): DashboardStats => {
    const allOrders = this.orderHistoryStore.orders();
    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const pendingOrders = allOrders.filter(o => o.status === 'processing' || o.status === 'placed');

    return {
      totalOrders: allOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalSpent: completedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.totalAmount, 0) / completedOrders.length
        : 0,
      cartItems: this.cartItemCount(),
      cartValue: this.cartValue()
    };
  });

  // Recent orders (last 5)
  readonly recentOrders = computed(() => {
    return this.orderHistoryStore.orders()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.orderHistoryStore.loadOrders();
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  protected getStatusLabel(status: string): string {
    return this.orderHistoryStore.getStatusLabel(status as OrderStatus);
  }

  protected getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    return this.orderHistoryStore.getStatusSeverity(status as OrderStatus);
  }
}
