import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, DividerModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss',
})
export class AboutUsComponent {
  readonly companyInfo = {
    name: 'MANDRAIME',
    founded: '2020',
    mission:
      'To provide high-quality, comfortable, and stylish footwear for every lifestyle.',
    vision:
      'To become the leading online destination for premium shoes worldwide.',
    values: [
      'Quality craftsmanship',
      'Customer satisfaction',
      'Sustainable practices',
      'Innovation in design',
    ],
  };
  readonly stats = [
    { label: 'Shoes Sold', value: '200,000+' },
    { label: 'Years of Excellence', value: '5+' },
  ];

  readonly valueDescriptions = [
    'Every pair of shoes is crafted with attention to detail and premium materials.',
    'We prioritize our customers\' needs and strive to exceed their expectations.',
    'We are committed to environmentally responsible manufacturing processes.',
    'We continuously innovate to bring you the latest trends and technologies.',
  ];

  getValueDescription(index: number): string {
    return this.valueDescriptions[index] || '';
  }
}
