import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent {
  readonly companyName = 'MANDRAIME';

  readonly features = [
    {
      title: 'Premium Wholesale',
      description: 'Access to top footwear brands at competitive wholesale prices with transparent pricing structure.',
      icon: 'pi pi-shopping-bag'
    },
    {
      title: 'Smart Inventory',
      description: 'Real-time stock levels, automated reorder alerts, and intelligent demand forecasting tools.',
      icon: 'pi pi-chart-bar'
    },
    {
      title: 'Bulk Ordering',
      description: 'Streamlined ordering process with flexible MOQs and consolidated shipping options.',
      icon: 'pi pi-box'
    },
    {
      title: 'Partner Support',
      description: 'Dedicated account managers and 24/7 support team for all your business needs.',
      icon: 'pi pi-headphones'
    }
  ];
}
