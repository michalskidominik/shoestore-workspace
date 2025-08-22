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
      'To provide high-quality, comfortable, and stylish footwear for business partners across Europe through our professional B2B wholesale platform.',
    vision:
      'To become the leading B2B footwear supplier in Europe, empowering retailers with premium products and exceptional service.',
    values: [
      'Quality craftsmanship',
      'Customer satisfaction',
      'Sustainable practices',
      'Innovation in design',
    ],
  };

  readonly companyDetails = {
    name: 'MANDRAIME SUPPLY SP. Z O.O.',
    address: 'ul. Polna 4C, 32-043 Skała, Poland',
    vatId: '5130293109',
    regon: '528216748',
    krs: '0001097529'
  };

  readonly businessInfo = {
    specialization: 'B2B Footwear Wholesale',
    coverage: '15+ Countries in Europe',
    responseTime: '24h',
    partnerStores: '50+',
    languages: ['English', 'Polish'],
    certifications: ['EU Quality Standards', 'ISO 9001:2015', 'Sustainable Manufacturing']
  };

  readonly stats = [
    { label: 'Partner Stores', value: '50+', icon: 'pi pi-building' },
    { label: 'Countries Served', value: '15+', icon: 'pi pi-globe' },
    { label: 'SKUs Available', value: '1000+', icon: 'pi pi-box' },
    { label: 'Years of Excellence', value: '5+', icon: 'pi pi-calendar' },
  ];

  readonly capabilities = [
    {
      title: 'Wholesale Distribution',
      description: 'Comprehensive B2B distribution network serving retailers across Europe with flexible order quantities and fast delivery.',
      icon: 'pi pi-truck'
    },
    {
      title: 'Private Label Solutions',
      description: 'Custom branding and private label manufacturing services to help retailers develop their own footwear lines.',
      icon: 'pi pi-tag'
    },
    {
      title: 'Inventory Management',
      description: 'Advanced inventory management system with real-time stock levels and automated reorder notifications.',
      icon: 'pi pi-chart-bar'
    },
    {
      title: 'Business Support',
      description: 'Dedicated account management, marketing support, and business development assistance for our retail partners.',
      icon: 'pi pi-users'
    }
  ];

  readonly valueDescriptions = [
    'Every pair of shoes is crafted with attention to detail and premium materials, ensuring your customers receive only the best products.',
    'We prioritize our retail partners\' success and provide dedicated support to help grow your business and exceed your customers\' expectations.',
    'We are committed to environmentally responsible manufacturing processes and sustainable business practices throughout our supply chain.',
    'We continuously innovate to bring you the latest trends and technologies, keeping your inventory fresh and competitive.',
  ];

  getValueDescription(index: number): string {
    return this.valueDescriptions[index] || '';
  }
}
