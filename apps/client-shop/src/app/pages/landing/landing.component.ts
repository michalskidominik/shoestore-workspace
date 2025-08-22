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
      title: 'Wholesale Footwear',
      description: 'Access to premium shoe collections at wholesale prices',
      icon: 'pi pi-shopping-bag'
    },
    {
      title: 'Business Dashboard',
      description: 'Comprehensive analytics and order management tools',
      icon: 'pi pi-chart-bar'
    },
    {
      title: 'Bulk Ordering',
      description: 'Streamlined ordering process for business customers',
      icon: 'pi pi-box'
    },
    {
      title: '24/7 Support',
      description: 'Dedicated support team for your business needs',
      icon: 'pi pi-headphones'
    }
  ];
}
