import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="dashboard">
      <h2 class="text-2xl font-bold mb-4">Dashboard</h2>

      <div class="grid">
        <div class="col-12 md:col-6 lg:col-3">
          <p-card header="Total Orders" styleClass="text-center">
            <div class="text-3xl font-bold text-primary">24</div>
            <div class="text-sm text-500">This month</div>
          </p-card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <p-card header="Favorite Items" styleClass="text-center">
            <div class="text-3xl font-bold text-primary">12</div>
            <div class="text-sm text-500">Saved items</div>
          </p-card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <p-card header="Recent Views" styleClass="text-center">
            <div class="text-3xl font-bold text-primary">48</div>
            <div class="text-sm text-500">Last 7 days</div>
          </p-card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <p-card header="Points Balance" styleClass="text-center">
            <div class="text-3xl font-bold text-primary">1,250</div>
            <div class="text-sm text-500">Loyalty points</div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 1rem;
    }
  `]
})
export class DashboardComponent {}
